/**
 * Stack Perfeita MCP — Code Reading tools
 * smart_outline, smart_unfold, smart_read MCP tool registrations.
 * AST-based extraction via acorn-loose with regex fallback.
 */

import { z } from "zod";
import { existsSync } from "fs";
import { resolve } from "path";
import { readFile } from "./helpers.js";
import { parse as parseLoose } from "acorn-loose";

// ─── Regex patterns (fallback for when AST fails or for Python) ─────────────
const SYMBOL_PATTERNS = {
  js: [
    { regex: /^(export\s+)?(default\s+)?(async\s+)?function\s+(?<name>\w+)\s*\([^)]*\)/m, kind: "function" },
    { regex: /^(export\s+)?(default\s+)?(async\s+)?function\s*\*\s*(?<name>\w+)\s*\([^)]*\)/m, kind: "generator" },
    { regex: /^(export\s+)?(default\s+)?const\s+(?<name>\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/m, kind: "arrow" },
    { regex: /^(export\s+)?(default\s+)?const\s+(?<name>\w+)\s*=\s*(async\s+)?function/m, kind: "function-expr" },
    { regex: /^(export\s+)?(default\s+)?class\s+(?<name>\w+)/m, kind: "class" },
    { regex: /^(export\s+)?(default\s+)?interface\s+(?<name>\w+)/m, kind: "interface" },
    { regex: /^(export\s+)?type\s+(?<name>\w+)\s*=/m, kind: "type" },
    { regex: /^(export\s+)?enum\s+(?<name>\w+)/m, kind: "enum" },
    { regex: /^\s+(async\s+)?(?<name>\w+)\s*\([^)]*\)\s*\{/m, kind: "method" },
  ],
  py: [
    { regex: /^(export\s+)?@(\w+)/m, kind: "decorator" },
    { regex: /^(async\s+)?def\s+(?<name>\w+)\s*\(/m, kind: "function" },
    { regex: /^class\s+(?<name>\w+)/m, kind: "class" },
    { regex: /^(?<name>\w+)\s*=\s*(lambda|async\s+lambda)/m, kind: "lambda" },
  ],
};

const KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "else", "return", "throw", "new", "try", "do"]);

function getFileLang(filePath) {
  if (/\.(js|ts|jsx|tsx|mjs|cjs)$/.test(filePath)) return "js";
  if (/\.py$/.test(filePath)) return "py";
  return null;
}

// ─── AST-based extraction (JS/TS) ───────────────────────────────────────────
function extractSymbolsAST(content) {
  const symbols = [];
  const lines = content.split("\n");

  try {
    const ast = parseLoose(content, { ecmaVersion: 2025, sourceType: "module" });

    function walk(node, depth = 0) {
      if (!node || typeof node !== "object") return;

      const loc = node.loc || node.start != null ? { start: { line: (content.slice(0, node.start).match(/\n/g) || []).length + 1 } } : null;
      const line = loc ? loc.start.line : 0;

      switch (node.type) {
        case "FunctionDeclaration":
          if (node.id && !KEYWORDS.has(node.id.name)) {
            symbols.push({ name: node.id.name, kind: node.async ? "async-function" : "function", line, signature: lines[line - 1]?.trim() || node.id.name });
          }
          break;
        case "ClassDeclaration":
          if (node.id) {
            symbols.push({ name: node.id.name, kind: "class", line, signature: lines[line - 1]?.trim() || `class ${node.id.name}` });
          }
          break;
        case "VariableDeclaration":
          for (const decl of node.declarations || []) {
            if (decl.init?.type === "ArrowFunctionExpression" || decl.init?.type === "FunctionExpression") {
              const name = decl.id?.name;
              if (name && !KEYWORDS.has(name)) {
                symbols.push({ name, kind: decl.init.type === "ArrowFunctionExpression" ? "arrow" : "function-expr", line, signature: lines[line - 1]?.trim() || name });
              }
            }
          }
          break;
        case "ExportNamedDeclaration":
        case "ExportDefaultDeclaration":
          if (node.declaration) walk(node.declaration, depth);
          break;
        case "MethodDefinition":
          if (node.key?.name && !KEYWORDS.has(node.key.name)) {
            symbols.push({ name: node.key.name, kind: "method", line, signature: lines[line - 1]?.trim() || node.key.name });
          }
          break;
        case "TSInterfaceDeclaration":
          if (node.id) symbols.push({ name: node.id.name, kind: "interface", line, signature: lines[line - 1]?.trim() || `interface ${node.id.name}` });
          break;
        case "TSTypeAliasDeclaration":
          if (node.id) symbols.push({ name: node.id.name, kind: "type", line, signature: lines[line - 1]?.trim() || `type ${node.id.name}` });
          break;
        case "TSEnumDeclaration":
          if (node.id) symbols.push({ name: node.id.name, kind: "enum", line, signature: lines[line - 1]?.trim() || `enum ${node.id.name}` });
          break;
      }

      // Recurse into child nodes
      for (const key of Object.keys(node)) {
        if (key === "loc" || key === "range" || key === "start" || key === "end") continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(c => walk(c, depth + 1));
        } else if (child && typeof child === "object" && child.type) {
          walk(child, depth + 1);
        }
      }
    }

    walk(ast);
  } catch {
    // AST parse failed — will fall back to regex
  }

  return symbols;
}

// ─── Regex-based extraction (fallback + Python) ─────────────────────────────
function extractSymbolsRegex(content, lang) {
  const patterns = SYMBOL_PATTERNS[lang] || [];
  const symbols = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    for (const p of patterns) {
      const match = lines[i].match(p.regex);
      if (match) {
        const name = match.groups?.name;
        if (name && !KEYWORDS.has(name)) {
          symbols.push({ name, kind: p.kind, line: i + 1, signature: lines[i].trim() });
        }
      }
    }
  }
  return symbols;
}

// ─── Combined extraction (AST first, regex fallback) ────────────────────────
function extractSymbols(content, lang) {
  if (lang === "js") {
    const astSymbols = extractSymbolsAST(content);
    if (astSymbols.length > 0) return astSymbols;
    // Fallback to regex if AST returned nothing
  }
  return extractSymbolsRegex(content, lang);
}

// ─── Symbol body extraction ─────────────────────────────────────────────────
function extractSymbolBody(content, symbolName, lang) {
  const lines = content.split("\n");
  const patterns = SYMBOL_PATTERNS[lang] || [];

  // Try AST first for JS
  if (lang === "js") {
    try {
      const ast = parseLoose(content, { ecmaVersion: 2025, sourceType: "module" });
      let found = null;

      function findNode(node) {
        if (!node || typeof node !== "object" || found) return;

        if (node.type === "FunctionDeclaration" && node.id?.name === symbolName) {
          found = node;
        } else if (node.type === "ClassDeclaration" && node.id?.name === symbolName) {
          found = node;
        } else if (node.type === "VariableDeclaration") {
          for (const decl of node.declarations || []) {
            if (decl.id?.name === symbolName && (decl.init?.type === "ArrowFunctionExpression" || decl.init?.type === "FunctionExpression")) {
              found = node;
            }
          }
        }

        for (const key of Object.keys(node)) {
          if (key === "loc" || key === "range" || key === "start" || key === "end") continue;
          const child = node[key];
          if (Array.isArray(child)) child.forEach(c => findNode(c));
          else if (child && typeof child === "object" && child.type) findNode(child);
        }
      }

      findNode(ast);
      if (found && found.start != null && found.end != null) {
        const startLine = content.slice(0, found.start).split("\n").length;
        const endLine = content.slice(0, found.end).split("\n").length;
        return {
          startLine,
          endLine,
          signature: lines[startLine - 1]?.trim() || symbolName,
          body: lines.slice(startLine - 1, endLine).join("\n"),
        };
      }
    } catch { /* fall through to regex */ }
  }

  // Regex fallback
  for (let i = 0; i < lines.length; i++) {
    for (const p of patterns) {
      const match = lines[i].match(p.regex);
      if (match && match.groups?.name === symbolName) {
        const startLine = i;
        let endLine = i;

        if (lang === "py") {
          const baseIndent = lines[i].search(/\S/);
          for (let j = i + 1; j < lines.length; j++) {
            const lineIndent = lines[j].search(/\S/);
            if (lineIndent <= baseIndent && lines[j].trim() !== "") break;
            endLine = j;
          }
        } else {
          let depth = 0;
          let foundOpen = false;
          for (let j = i; j < lines.length; j++) {
            for (const ch of lines[j]) {
              if (ch === "{") { depth++; foundOpen = true; }
              if (ch === "}") depth--;
            }
            endLine = j;
            if (foundOpen && depth === 0) break;
          }
        }

        return { startLine: startLine + 1, endLine: endLine + 1, signature: lines[i].trim(), body: lines.slice(startLine, endLine + 1).join("\n") };
      }
    }
  }
  return null;
}

// ─── Return type annotation check (regex-based, acorn doesn't parse TS types) ─
function checkReturnType(content, nodeStart, bodyStart) {
  // Extract signature text: from function start to opening brace of body
  const sigText = content.slice(nodeStart, bodyStart);
  // Find last ')' in signature (closing params)
  const lastParen = sigText.lastIndexOf(")");
  if (lastParen === -1) return false;
  // Check for ':' after params close (return type annotation)
  const afterParams = sigText.slice(lastParen + 1);
  return /:\s*\S/.test(afterParams);
}

// ─── AST-based metrics for validate_bad_code ────────────────────────────────
export function analyzeCodeMetrics(content) {
  const lines = content.split("\n");
  const metrics = {
    lineCount: lines.length,
    functions: [],
    maxNesting: 0,
  };

  try {
    const ast = parseLoose(content, { ecmaVersion: 2025, sourceType: "module" });

    function walkMetrics(node, depth = 0) {
      if (!node || typeof node !== "object") return;

      // Track nesting depth
      if (["BlockStatement", "IfStatement", "ForStatement", "WhileStatement", "SwitchStatement", "TryStatement", "CatchClause"].includes(node.type)) {
        metrics.maxNesting = Math.max(metrics.maxNesting, depth);
      }

      // Function analysis
      if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
        const name = node.id?.name || (node.type === "ArrowFunctionExpression" ? "<arrow>" : "<anonymous>");
        const startLine = content.slice(0, node.start).split("\n").length;
        const endLine = content.slice(0, node.end).split("\n").length;
        const funcLines = endLine - startLine + 1;

        // Cyclomatic complexity: count decision points
        let complexity = 1;
        function countComplexity(n) {
          if (!n || typeof n !== "object") return;
          if (["IfStatement", "ForStatement", "WhileStatement", "CaseClause", "CatchClause"].includes(n.type)) complexity++;
          if (n.type === "LogicalExpression" && (n.operator === "&&" || n.operator === "||")) complexity++;
          if (n.type === "ConditionalExpression") complexity++;
          for (const key of Object.keys(n)) {
            if (key === "loc" || key === "range" || key === "start" || key === "end") continue;
            const child = n[key];
            if (Array.isArray(child)) child.forEach(c => countComplexity(c));
            else if (child && typeof child === "object" && child.type) countComplexity(child);
          }
        }
        countComplexity(node.body);

        // Typedness check: does the function have a return type annotation?
        const hasReturnType = checkReturnType(content, node.start, node.body?.start || node.end);

        metrics.functions.push({ name, startLine, endLine, lines: funcLines, complexity, hasReturnType });
      }

      for (const key of Object.keys(node)) {
        if (key === "loc" || key === "range" || key === "start" || key === "end") continue;
        const child = node[key];
        const nextDepth = ["BlockStatement", "IfStatement", "ForStatement", "WhileStatement", "SwitchStatement"].includes(node.type) ? depth + 1 : depth;
        if (Array.isArray(child)) child.forEach(c => walkMetrics(c, nextDepth));
        else if (child && typeof child === "object" && child.type) walkMetrics(child, nextDepth);
      }
    }

    walkMetrics(ast);
  } catch {
    // AST parse failed — return basic metrics
  }

  return metrics;
}

// ─── Tool registrations ─────────────────────────────────────────────────────
export function registerCodeReadingTools(server) {
  // Tool: smart_outline
  server.tool(
    "smart_outline",
    "Get structural outline of a file — shows all symbols (functions, classes, methods, types) with signatures. Uses AST parsing for JS/TS (handles decorators, multiline, generics) with regex fallback. Supports JS/TS/Python.",
    { file_path: z.string().describe("Absolute path to the source file to outline.") },
    async ({ file_path }) => {
      const absPath = resolve(file_path);
      if (!existsSync(absPath)) {
        return { content: [{ type: "text", text: `HALT — File does not exist: ${absPath}` }] };
      }

      const content = readFile(absPath);
      if (!content) {
        return { content: [{ type: "text", text: `HALT — Cannot read file: ${absPath}` }] };
      }

      const lang = getFileLang(absPath);
      if (!lang) {
        return { content: [{ type: "text", text: `Unsupported language for: ${absPath}\nSupported: .js, .ts, .jsx, .tsx, .mjs, .cjs, .py` }] };
      }

      const symbols = extractSymbols(content, lang);
      if (symbols.length === 0) {
        return { content: [{ type: "text", text: `No symbols found in: ${absPath}` }] };
      }

      const lines = symbols.map(s => `L${s.line}: [${s.kind}] ${s.signature}`);
      return {
        content: [{
          type: "text",
          text: `## Outline: ${absPath}\n\n${lines.join("\n")}\n\n${symbols.length} symbol(s). Use smart_unfold(path, symbol_name) to read a specific symbol's body.`,
        }],
      };
    }
  );

  // Tool: smart_unfold
  server.tool(
    "smart_unfold",
    "Expand a specific symbol (function, class, method) from a file. Returns the full source code of just that symbol. Uses AST parsing for precise extraction. Supports JS/TS/Python.",
    {
      file_path: z.string().describe("Absolute path to the source file."),
      symbol_name: z.string().describe("Name of the symbol to unfold (function, class, method, etc.)"),
    },
    async ({ file_path, symbol_name }) => {
      const absPath = resolve(file_path);
      if (!existsSync(absPath)) {
        return { content: [{ type: "text", text: `HALT — File does not exist: ${absPath}` }] };
      }

      const content = readFile(absPath);
      if (!content) {
        return { content: [{ type: "text", text: `HALT — Cannot read file: ${absPath}` }] };
      }

      const lang = getFileLang(absPath);
      if (!lang) {
        return { content: [{ type: "text", text: `Unsupported language for: ${absPath}` }] };
      }

      const result = extractSymbolBody(content, symbol_name, lang);
      if (!result) {
        const symbols = extractSymbols(content, lang);
        const available = symbols.map(s => `  - ${s.name} (${s.kind})`).join("\n");
        return {
          content: [{
            type: "text",
            text: `Symbol "${symbol_name}" not found in ${absPath}.\n\nAvailable symbols:\n${available}`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `## ${symbol_name} (${result.startLine}-${result.endLine})\n\n\`\`\`\n${result.body}\n\`\`\``,
        }],
      };
    }
  );

  // Tool: smart_read
  server.tool(
    "smart_read",
    "Intelligent file reader: returns full content for small files (<50 lines), structural outline for larger files. Use mode='full' to force full read or mode='symbol' with symbol_name to read a specific function. Supports JS/TS/Python.",
    {
      file_path: z.string().describe("Absolute path to the source file."),
      mode: z.enum(["auto", "outline", "full", "symbol"]).default("auto").describe("Read mode: auto (smart), outline (symbols only), full (entire file), symbol (specific function)."),
      symbol_name: z.string().optional().describe("Symbol name to unfold (required when mode='symbol')."),
    },
    async ({ file_path, mode, symbol_name }) => {
      const absPath = resolve(file_path);
      if (!existsSync(absPath)) {
        return { content: [{ type: "text", text: `HALT — File does not exist: ${absPath}` }] };
      }

      const content = readFile(absPath);
      if (!content) {
        return { content: [{ type: "text", text: `HALT — Cannot read file: ${absPath}` }] };
      }

      const lineCount = content.split("\n").length;
      const lang = getFileLang(absPath);

      // Mode: full — return everything
      if (mode === "full") {
        return { content: [{ type: "text", text: content }] };
      }

      // Mode: symbol — unfold specific symbol
      if (mode === "symbol") {
        if (!symbol_name) {
          return { content: [{ type: "text", text: "mode='symbol' requires symbol_name parameter." }] };
        }
        if (!lang) {
          return { content: [{ type: "text", text: `Unsupported language for: ${absPath}` }] };
        }
        const result = extractSymbolBody(content, symbol_name, lang);
        if (!result) {
          const symbols = extractSymbols(content, lang);
          return {
            content: [{
              type: "text",
              text: `Symbol "${symbol_name}" not found.\n\nAvailable:\n${symbols.map(s => `  - ${s.name} (${s.kind})`).join("\n")}`,
            }],
          };
        }
        return {
          content: [{
            type: "text",
            text: `## ${symbol_name} (${result.startLine}-${result.endLine})\n\n\`\`\`\n${result.body}\n\`\`\``,
          }],
        };
      }

      // Mode: auto or outline
      if (lineCount < 50 && mode === "auto") {
        return { content: [{ type: "text", text: content }] };
      }

      // Return outline
      if (lang) {
        const symbols = extractSymbols(content, lang);
        if (symbols.length > 0) {
          const outline = symbols.map(s => `L${s.line}: [${s.kind}] ${s.signature}`).join("\n");
          return {
            content: [{
              type: "text",
              text: `## ${absPath} (${lineCount} lines)\n\n${outline}\n\nUse smart_read(path, mode='full') for complete content or mode='symbol' with symbol_name for a specific function.`,
            }],
          };
        }
      }

      // Fallback: return full content
      return { content: [{ type: "text", text: content }] };
    }
  );
}

export { extractSymbols, extractSymbolsAST, extractSymbolsRegex, extractSymbolBody, getFileLang };
