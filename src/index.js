#!/usr/bin/env node
/**
 * stack-perfeita-mcp
 * MCP server that exposes project AI rules as tools for any IDE/agent.
 *
 * Usage:
 *   node src/index.js --rules-dir /path/to/ai-rules
 *
 * Tools:
 *   list_rules()              → lists all available rule files
 *   get_rules(topic)          → returns content of a specific rules file
 *   get_context(module_path)  → returns CONTEXT.md for a given module path
 *   validate_bad_code(code)   → checks code against bad patterns (PASS/HALT)
 *   validate_git_commit(msg)  → validates Conventional Commits format
 *   dependency_validate(path) → checks if imports/references exist on disk
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ─── MCP Protocol Protection ─────────────────────────────────────────────────
// stdout is reserved for JSON-RPC. Any console.log breaks the protocol.
const originalConsoleLog = console.log;
console.log = (...args) => process.stderr.write(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n');

// ─── Config ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

const args = process.argv.slice(2);
const rulesDirFlag = args.indexOf("--rules-dir");
const RULES_DIR = rulesDirFlag !== -1
  ? resolve(args[rulesDirFlag + 1])
  : resolve(process.cwd(), "ai-rules");

const SRC_DIR = resolve(RULES_DIR, "../src");

// ─── Security ───────────────────────────────────────────────────────────────

function safeResolvePath(base, filename) {
  const resolved = resolve(base, filename);
  if (!resolved.startsWith(resolve(base))) {
    throw new Error(`Path traversal detectado: ${filename}`);
  }
  return resolved;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readFile(filePath) {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function listRuleFiles() {
  try {
    return readdirSync(RULES_DIR)
      .filter(f => f.endsWith(".md"))
      .sort();
  } catch {
    return [];
  }
}

function getRuleByTopic(topic) {
  const files = listRuleFiles();

  const exact = files.find(f => f === topic || f === `${topic}.md`);
  if (exact) return { file: exact, content: readFile(join(RULES_DIR, exact)) };

  const fuzzy = files.find(f => f.toLowerCase().includes(topic.toLowerCase()));
  if (fuzzy) return { file: fuzzy, content: readFile(join(RULES_DIR, fuzzy)) };

  return null;
}

// ─── Topic Map (keyword → real filename) ────────────────────────────────────

const TOPIC_MAP = {
  "overview":     "00-project-overview.md",
  "project":      "00-project-overview.md",
  "workflow":     "01-ai-workflow-strict.md",
  "process":      "01-ai-workflow-strict.md",
  "flow":         "01-ai-workflow-strict.md",
  "coding":       "02-coding-standards.md",
  "standards":    "02-coding-standards.md",
  "naming":       "02-coding-standards.md",
  "tokens":       "03-token-economy.md",
  "economy":      "03-token-economy.md",
  "security":     "04-security-secrets.md",
  "secrets":      "04-security-secrets.md",
  "debugging":    "05-debugging-mastery.md",
  "debug":        "05-debugging-mastery.md",
  "ci":           "06-ci-cd-testing.md",
  "testing":      "06-ci-cd-testing.md",
  "tests":        "06-ci-cd-testing.md",
  "frontend":     "07-frontend-semantic.md",
  "semantic":     "07-frontend-semantic.md",
  "a11y":         "07-frontend-semantic.md",
  "backend":      "08-backend-architecture.md",
  "architecture": "08-backend-architecture.md",
  "arch":         "08-backend-architecture.md",
  "bad":          "09-bad-patterns-halt.md",
  "patterns":     "09-bad-patterns-halt.md",
  "blacklist":    "09-bad-patterns-halt.md",
  "antipatterns": "09-bad-patterns-halt.md",
  "behavior":     "10-llm-behavioral-rules.md",
  "llm":          "10-llm-behavioral-rules.md",
  "global":       "10-llm-behavioral-rules.md",
  "excitation":   "10-llm-behavioral-rules.md",
  "filler":       "10-llm-behavioral-rules.md",
  "hesitation":   "10-llm-behavioral-rules.md",
};

const RULE_DESCRIPTIONS = {
  "00-project-overview.md":         "Project domain, stack, and non-functional requirements",
  "01-ai-workflow-strict.md":       "AI workflow rules — anti-hallucination, P.E.R., zero-loop",
  "02-coding-standards.md":         "Caveman style — naming, variables, loops, functions",
  "03-token-economy.md":            "Token compression — block filler, semantic summarization",
  "04-security-secrets.md":         "OWASP 2025/2026, secrets management, agentic risks",
  "05-debugging-mastery.md":        "Structured debugging — no console.log, reproduce-reduce-prove",
  "06-ci-cd-testing.md":            "CI/CD as product — pipeline gates, SAST, coverage",
  "07-frontend-semantic.md":        "Semantic HTML, a11y, CSS modern, Core Web Vitals",
  "08-backend-architecture.md":     "Backend rules — validation at edge, ACID, stateless, N+1",
  "09-bad-patterns-halt.md":        "Bad code blacklist — halt on rotten foundation",
  "10-llm-behavioral-rules.md":     "Universal LLM rules — excitation blocking, global behavior",
};

// ─── Bad Code Patterns ──────────────────────────────────────────────────────

const BAD_PATTERNS = [
  { regex: /\bany\b/,                              id: "any",          msg: "TypeScript any — inferir tipo correto" },
  { regex: /catch\s*\([^)]*\)\s*\{\s*\}/,         id: "empty-catch",  msg: "Catch vazio — Fail Fast, tratar a falha" },
  { regex: /catch\s*\{\s*\}/,                      id: "empty-catch",  msg: "Catch vazio — Fail Fast, tratar a falha" },
  { regex: /console\.log\(/,                       id: "console-log",  msg: "console.log cru — usar logger estruturado ou debugger" },
  { regex: /function\s+\w+[^{]{200,}/,            id: "god-function", msg: "God Function — dividir em funções menores" },
  { regex: /if.*if.*if.*if/,                       id: "arrow-code",   msg: "Arrow code — usar Early Returns, reduzir aninhamento" },
  { regex: /innerHTML\s*=/,                        id: "innerhtml",    msg: "innerHTML inseguro — usar textContent ou replaceChildren" },
  { regex: /\bvar\s+/,                             id: "var",          msg: "var detectado — usar const/let" },
  { regex: /[^=!]==[^=]/,                          id: "weak-eq",      msg: "Comparação fraca == — usar ===" },
  { regex: /\/\/\s*(TODO|FIXME)/i,                 id: "todo-inline",  msg: "Technical debt inline — resolver ou criar issue" },
  { regex: /\beval\s*\(/,                          id: "eval",         msg: "eval proibido — risco de injection" },
];

// ─── Rate Limit ─────────────────────────────────────────────────────────────

const rateLimiter = {
  counters: {},
  windowMs: 60000,
  maxCalls: 20,

  check(toolName) {
    const now = Date.now();
    if (!this.counters[toolName] || now - this.counters[toolName].start > this.windowMs) {
      this.counters[toolName] = { start: now, count: 1 };
      return null;
    }
    this.counters[toolName].count += 1;
    if (this.counters[toolName].count > this.maxCalls) {
      return `HALT: rate limit — tool "${toolName}" chamada ${this.counters[toolName].count}x em 60s. Possível loop.`;
    }
    return null;
  },
};

// ─── MCP Server ─────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "stack-perfeita-mcp",
  version: "1.0.0",
});

// ─── Resources (leitura de ai-rules/*.md) ────────────────────────────────────

server.resource(
  "ai-rules-list",
  "ai-rules://list",
  async () => {
    const files = listRuleFiles();
    const lines = files.map(f => {
      const desc = RULE_DESCRIPTIONS[f] || "Custom rule file";
      return `- **${f}** — ${desc}`;
    });
    return {
      contents: [{
        uri: "ai-rules://list",
        mimeType: "text/markdown",
        text: `## Available rule files\n\n${lines.join("\n")}`,
      }],
    };
  }
);

for (const file of listRuleFiles()) {
  const desc = RULE_DESCRIPTIONS[file] || "Custom rule file";
  server.resource(
    desc,
    `ai-rules://${file}`,
    async () => {
      const content = readFile(safeResolvePath(RULES_DIR, file));
      return {
        contents: [{
          uri: `ai-rules://${file}`,
          mimeType: "text/markdown",
          text: content || `File not found: ${file}`,
        }],
      };
    }
  );
}

// ─── Tools ────────────────────────────────────────────────────────────────────

// Tool: list_rules
server.tool(
  "list_rules",
  "Lists all available AI rule files in the project. Use this first to know what rules exist.",
  {},
  async () => {
    const files = listRuleFiles();

    if (files.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No rule files found in: ${RULES_DIR}\n\nCreate markdown files in an 'ai-rules/' folder next to your source code.`,
        }],
      };
    }

    const lines = files.map(f => {
      const desc = RULE_DESCRIPTIONS[f] || "Custom rule file";
      return `- **${f}** — ${desc}`;
    });

    return {
      content: [{
        type: "text",
        text: `## Available rule files in: ${RULES_DIR}\n\n${lines.join("\n")}\n\nUse get_rules(topic) to read any of these files.`,
      }],
    };
  }
);

// Tool: get_rules
server.tool(
  "get_rules",
  "Returns the content of a specific rules file. Use topic keywords like: coding, workflow, bad, architecture, security, tokens, behavior, frontend, backend, debugging.",
  { topic: z.string().describe("Topic keyword or filename. Examples: 'coding', 'workflow', 'bad', 'behavior', '02-coding-standards.md'") },
  async ({ topic }) => {
    const rateLimitHit = rateLimiter.check("get_rules");
    if (rateLimitHit) {
      return { content: [{ type: "text", text: rateLimitHit }] };
    }

    const mappedFile = TOPIC_MAP[topic.toLowerCase()];
    let result = null;

    if (mappedFile) {
      const filePath = safeResolvePath(RULES_DIR, mappedFile);
      const content = readFile(filePath);
      if (content) result = { file: mappedFile, content };
    }

    if (!result) {
      const found = getRuleByTopic(topic);
      if (found) {
        safeResolvePath(RULES_DIR, found.file);
        result = found;
      }
    }

    if (!result) {
      const files = listRuleFiles();
      return {
        content: [{
          type: "text",
          text: `No rules found for topic: "${topic}"\n\nAvailable files:\n${files.map(f => `- ${f}`).join("\n")}\n\nTopic keywords: ${Object.keys(TOPIC_MAP).join(", ")}`,
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: `## ${result.file}\n\n${result.content}`,
      }],
    };
  }
);

// Tool: get_context
server.tool(
  "get_context",
  "Returns the CONTEXT.md file for a specific module/feature folder. Always call this before editing files in a module.",
  { module_path: z.string().describe("Module folder name or path relative to src/. Examples: 'orders', 'users', 'payments'") },
  async ({ module_path }) => {
    const safeModule = module_path.replace(/\.\./g, "");
    const candidates = [
      join(SRC_DIR, safeModule, "CONTEXT.md"),
      join(resolve(process.cwd(), "src"), safeModule, "CONTEXT.md"),
      join(resolve(process.cwd()), safeModule, "CONTEXT.md"),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        const content = readFile(candidate);
        return {
          content: [{
            type: "text",
            text: `## CONTEXT.md — ${safeModule}\n\n${content}`,
          }],
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `No CONTEXT.md found for module: "${safeModule}"\n\nSearched in:\n${candidates.map(c => `- ${c}`).join("\n")}\n\nCreate a CONTEXT.md in the module folder.`,
      }],
    };
  }
);

// Tool: validate_bad_code
server.tool(
  "validate_bad_code",
  "Checks code against bad patterns (any, empty catch, console.log, God Function, arrow code, innerHTML, var, ==, TODO, eval). Returns PASS or HALT with detected patterns. Use BEFORE submitting code to a file.",
  { code: z.string().describe("Code snippet to validate (JavaScript/TypeScript).") },
  async ({ code }) => {
    const rateLimitHit = rateLimiter.check("validate_bad_code");
    if (rateLimitHit) {
      return { content: [{ type: "text", text: rateLimitHit }] };
    }

    const detected = [];

    for (const pattern of BAD_PATTERNS) {
      if (pattern.regex.test(code)) {
        detected.push(`HALT: [${pattern.id}] ${pattern.msg}`);
      }
    }

    if (detected.length > 0) {
      return {
        content: [{
          type: "text",
          text: `HALT — ${detected.length} pattern(s) detected:\n\n${detected.join("\n")}\n\nFix before proceeding.`,
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: "PASS — No bad patterns detected. Proceed.",
      }],
    };
  }
);

// Tool: validate_git_commit
server.tool(
  "validate_git_commit",
  "Validates commit message against Conventional Commits format (feat/fix/docs/style/refactor/perf/test/chore). Use ALWAYS before creating a commit.",
  { message: z.string().describe("Commit message to validate.") },
  async ({ message }) => {
    const commitRegex = /^(feat|fix|docs|style|refactor|perf|test|chore)(\([^)]+\))?:\s.+/;

    if (commitRegex.test(message)) {
      return {
        content: [{
          type: "text",
          text: "PASS — Valid Conventional Commits format. Proceed with commit.",
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: "HALT — Invalid format. Must be: type(scope): description\nValid types: feat, fix, docs, style, refactor, perf, test, chore",
      }],
    };
  }
);

// Tool: dependency_validate
server.tool(
  "dependency_validate",
  "Checks if relative import/require/script/link references (./x, ../x) in a file exist on disk. Detects hallucinated imports. Aliases (@/x, ~/, tsconfig paths) are NOT resolved. Use after generating or modifying a file.",
  { file_path: z.string().describe("Absolute path to the file to validate dependencies for.") },
  async ({ file_path }) => {
    const rateLimitHit = rateLimiter.check("dependency_validate");
    if (rateLimitHit) {
      return { content: [{ type: "text", text: rateLimitHit }] };
    }

    const absPath = resolve(file_path);
    if (!existsSync(absPath)) {
      return {
        content: [{
          type: "text",
          text: `HALT — File does not exist: ${absPath}`,
        }],
      };
    }

    const content = readFile(absPath);
    if (!content) {
      return {
        content: [{
          type: "text",
          text: `HALT — Cannot read file: ${absPath}`,
        }],
      };
    }

    const fileDir = dirname(absPath);
    const missing = [];

    // só resolve imports relativos — aliases (@/components, ~/, tsconfig paths) não suportados

    // JS/TS imports: import X from './path' or import './path'
    const importRegex = /import\s+(?:[\w{},*\s]+\s+from\s+)?['"](\.[^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const candidates = [
        resolve(fileDir, importPath),
        resolve(fileDir, importPath + ".js"),
        resolve(fileDir, importPath + ".ts"),
        resolve(fileDir, importPath + ".jsx"),
        resolve(fileDir, importPath + ".tsx"),
        resolve(fileDir, importPath, "index.js"),
        resolve(fileDir, importPath, "index.ts"),
      ];
      const found = candidates.some(c => existsSync(c));
      if (!found) {
        missing.push(`import "${importPath}" — not found relative to ${fileDir}`);
      }
    }

    // CommonJS: require('./path')
    const requireRegex = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const requirePath = match[1];
      const candidates = [
        resolve(fileDir, requirePath),
        resolve(fileDir, requirePath + ".js"),
        resolve(fileDir, requirePath + ".ts"),
        resolve(fileDir, requirePath, "index.js"),
        resolve(fileDir, requirePath, "index.ts"),
      ];
      const found = candidates.some(c => existsSync(c));
      if (!found) {
        missing.push(`require("${requirePath}") — not found relative to ${fileDir}`);
      }
    }

    // HTML: <script src="x"> and <link href="x">
    const scriptRegex = /<script\s+[^>]*src=['"]([^'"]+)['"]/g;
    while ((match = scriptRegex.exec(content)) !== null) {
      const src = match[1];
      if (!src.startsWith("http") && !src.startsWith("//")) {
        const resolved = resolve(fileDir, src);
        if (!existsSync(resolved)) {
          missing.push(`<script src="${src}"> — not found at ${resolved}`);
        }
      }
    }

    const linkRegex = /<link\s+[^>]*href=['"]([^'"]+\.css)['"]/g;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      if (!href.startsWith("http") && !href.startsWith("//")) {
        const resolved = resolve(fileDir, href);
        if (!existsSync(resolved)) {
          missing.push(`<link href="${href}"> — not found at ${resolved}`);
        }
      }
    }

    if (missing.length > 0) {
      return {
        content: [{
          type: "text",
          text: `HALT — ${missing.length} missing reference(s):\n\n${missing.join("\n")}\n\nPossible hallucinated import. Fix before proceeding.`,
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: "PASS — All relative imports and references resolve to existing files. (Aliases not checked.)",
      }],
    };
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(`stack-perfeita-mcp started\nRules dir: ${RULES_DIR}\n`);

// ─── Orphan Detection ─────────────────────────────────────────────────────────
// Auto-exit when parent process dies (stdin closed / ppid changed)
// Prevents zombie MCP server processes when IDE exits unexpectedly.

function gracefulExit(reason) {
  process.stderr.write(`stack-perfeita-mcp exiting: ${reason}\n`);
  process.exit(0);
}

process.stdin.on('end', () => gracefulExit('stdin ended (parent closed)'));
process.stdin.on('close', () => gracefulExit('stdin closed'));

// ppid-based orphan detection (Unix only; no-op on Windows)
if (process.platform !== 'win32') {
  const initialPpid = process.ppid;
  const heartbeat = setInterval(() => {
    if (process.ppid !== initialPpid) {
      gracefulExit(`parent died (ppid ${initialPpid} → ${process.ppid})`);
    }
  }, 30_000);
  if (heartbeat.unref) heartbeat.unref(); // don't keep event loop alive
}
