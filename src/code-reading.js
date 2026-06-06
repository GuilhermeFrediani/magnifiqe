/**
 * Stack Perfeita MCP — Code Reading tools
 * smart_outline and smart_unfold MCP tool registrations.
 */

import { z } from "zod";
import { existsSync } from "fs";
import { resolve } from "path";
import { readFile } from "./helpers.js";

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
    { regex: /^(async\s+)?def\s+(?<name>\w+)\s*\(/m, kind: "function" },
    { regex: /^class\s+(?<name>\w+)/m, kind: "class" },
    { regex: /^(?<name>\w+)\s*=\s*(lambda|async\s+lambda)/m, kind: "lambda" },
  ],
};

function getFileLang(filePath) {
  if (/\.(js|ts|jsx|tsx|mjs|cjs)$/.test(filePath)) return "js";
  if (/\.py$/.test(filePath)) return "py";
  return null;
}

function extractSymbols(content, lang) {
  const patterns = SYMBOL_PATTERNS[lang] || [];
  const symbols = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    for (const p of patterns) {
      const match = lines[i].match(p.regex);
      if (match) {
        const name = match.groups?.name;
        if (name && !["if", "for", "while", "switch", "catch", "else", "return", "throw", "new"].includes(name)) {
          symbols.push({ name, kind: p.kind, line: i + 1, signature: lines[i].trim() });
        }
      }
    }
  }
  return symbols;
}

function extractSymbolBody(content, symbolName, lang) {
  const lines = content.split("\n");
  const patterns = SYMBOL_PATTERNS[lang] || [];

  for (let i = 0; i < lines.length; i++) {
    for (const p of patterns) {
      const match = lines[i].match(p.regex);
      if (match && match.groups?.name === symbolName) {
        const startLine = i;
        let endLine = i;
        const sig = lines[i].trim();

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

        return { startLine: startLine + 1, endLine: endLine + 1, signature: sig, body: lines.slice(startLine, endLine + 1).join("\n") };
      }
    }
  }
  return null;
}

export function registerCodeReadingTools(server) {
  // Tool: smart_outline
  server.tool(
    "smart_outline",
    "Get structural outline of a file — shows all symbols (functions, classes, methods, types) with signatures. Much cheaper than reading the full file. Supports JS/TS/Python.",
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
    "Expand a specific symbol (function, class, method) from a file. Returns the full source code of just that symbol. Use after smart_outline to read specific code. Supports JS/TS/Python.",
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
}

export { extractSymbols, extractSymbolBody, getFileLang };
