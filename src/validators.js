/**
 * Stack Perfeita MCP — Validator tools
 * validate_bad_code (regex + AST + risk score), validate_git_commit, dependency_validate (robust)
 */

import { z } from "zod";
import { existsSync, readdirSync } from "fs";
import { resolve, dirname, join, basename } from "path";
import { BAD_PATTERNS } from "./config.js";
import { readFile } from "./helpers.js";
import { rateLimiter } from "./rate-limiter.js";
import { analyzeCodeMetrics } from "./code-reading.js";

// ─── Node.js built-in modules ───────────────────────────────────────────────
const NODE_BUILTINS = new Set([
  "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
  "constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
  "events", "fs", "http", "http2", "https", "inspector", "module", "net",
  "os", "path", "perf_hooks", "process", "punycode", "querystring",
  "readline", "repl", "stream", "string_decoder", "sys", "timers",
  "tls", "trace_events", "tty", "url", "util", "v8", "vm", "wasi",
  "worker_threads", "zlib",
  // node: prefix variants
  "node:assert", "node:buffer", "node:child_process", "node:crypto",
  "node:dns", "node:events", "node:fs", "node:http", "node:https",
  "node:net", "node:os", "node:path", "node:process", "node:stream",
  "node:test", "node:timers", "node:tls", "node:url", "node:util",
  "node:worker_threads", "node:zlib",
]);

function getFileLang(filePath) {
  if (/\.(js|ts|jsx|tsx|mjs|cjs)$/.test(filePath)) return "js";
  if (/\.py$/.test(filePath)) return "py";
  return null;
}

// ─── Risk scoring thresholds ────────────────────────────────────────────────
const THRESHOLDS = {
  FUNC_SIZE_WARN: 50,
  FUNC_SIZE_HALT: 100,
  FILE_SIZE_WARN: 300,
  FILE_SIZE_HALT: 500,
  COMPLEXITY_WARN: 10,
  COMPLEXITY_HALT: 20,
  NESTING_WARN: 4,
  NESTING_HALT: 6,
};

const SCORE_PASS_MAX = 20;
const SCORE_WARN_MAX = 50;

export function registerValidatorsTools(server) {
  // Tool: validate_bad_code
  server.tool(
    "validate_bad_code",
    "Checks code against bad patterns (regex + AST analysis). Returns risk score 0-100 with PASS/WARN/HALT verdict. Regex: any, console.log, eval, var, innerHTML, etc. AST: function size, cyclomatic complexity, nesting depth. Use BEFORE submitting code.",
    { code: z.string().describe("Code snippet to validate (JavaScript/TypeScript/Python)."),
      file_path: z.string().optional().describe("Absolute path to the source file (enables missing test detection).") },
    async ({ code, file_path }) => {
      const rateLimitHit = rateLimiter.check("validate_bad_code");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      let score = 0;
      const findings = [];

      // Phase 1: Regex patterns
      const regexHits = [];
      for (const pattern of BAD_PATTERNS) {
        if (pattern.regex.test(code)) {
          regexHits.push(`[${pattern.id}] ${pattern.msg}`);
          score += 15;
        }
      }

      if (regexHits.length > 0) {
        findings.push(`- [HALT] Regex patterns (${regexHits.length} detected):`);
        regexHits.forEach(h => findings.push(`  - ${h}`));
      } else {
        findings.push("- [PASS] Regex patterns: 0 detected");
      }

      // Phase 2: AST metrics (JS/TS only)
      const lineCount = code.split("\n").length;

      // File size
      if (lineCount >= THRESHOLDS.FILE_SIZE_HALT) {
        score += 10;
        findings.push(`- [HALT] File size: ${lineCount} lines (limit ${THRESHOLDS.FILE_SIZE_HALT})`);
      } else if (lineCount >= THRESHOLDS.FILE_SIZE_WARN) {
        score += 5;
        findings.push(`- [WARN] File size: ${lineCount} lines (limit ${THRESHOLDS.FILE_SIZE_WARN})`);
      } else {
        findings.push(`- [INFO] File size: ${lineCount} lines (ok)`);
      }

      // AST-based checks
      const metrics = analyzeCodeMetrics(code);

      // Function size
      const largeFunctions = metrics.functions.filter(f => f.lines >= THRESHOLDS.FUNC_SIZE_WARN);
      if (largeFunctions.length > 0) {
        for (const fn of largeFunctions) {
          if (fn.lines >= THRESHOLDS.FUNC_SIZE_HALT) {
            score += 10;
            findings.push(`- [HALT] Function ${fn.name}: ${fn.lines} lines (limit ${THRESHOLDS.FUNC_SIZE_HALT})`);
          } else {
            score += 5;
            findings.push(`- [WARN] Function ${fn.name}: ${fn.lines} lines (limit ${THRESHOLDS.FUNC_SIZE_WARN})`);
          }
        }
      }

      // Cyclomatic complexity
      const complexFunctions = metrics.functions.filter(f => f.complexity >= THRESHOLDS.COMPLEXITY_WARN);
      for (const fn of complexFunctions) {
        if (fn.complexity >= THRESHOLDS.COMPLEXITY_HALT) {
          score += 15;
          findings.push(`- [HALT] Cyclomatic complexity: ${fn.complexity} in ${fn.name} (limit ${THRESHOLDS.COMPLEXITY_HALT})`);
        } else {
          score += 5;
          findings.push(`- [WARN] Cyclomatic complexity: ${fn.complexity} in ${fn.name} (limit ${THRESHOLDS.COMPLEXITY_WARN})`);
        }
      }

      // Nesting depth
      if (metrics.maxNesting >= THRESHOLDS.NESTING_HALT) {
        score += 10;
        findings.push(`- [HALT] Nesting depth: ${metrics.maxNesting} levels (limit ${THRESHOLDS.NESTING_HALT})`);
      } else if (metrics.maxNesting >= THRESHOLDS.NESTING_WARN) {
        score += 5;
        findings.push(`- [WARN] Nesting depth: ${metrics.maxNesting} levels (limit ${THRESHOLDS.NESTING_WARN})`);
      }

      // Typedness: missing return type annotations (TS advisory)
      const untypedFunctions = metrics.functions.filter(f => !f.hasReturnType && f.name !== "<arrow>" && f.name !== "<anonymous>");
      if (untypedFunctions.length > 0 && untypedFunctions.length <= 5) {
        score += 3;
        findings.push(`- [WARN] Missing return type: ${untypedFunctions.map(f => f.name).join(", ")}`);
      }

      // Missing test detection (only when file_path is provided)
      if (file_path) {
        const TEST_EXTS = [".js", ".ts", ".mjs", ".cjs"];
        const base = basename(file_path).replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, "");
        const testDirs = [
          dirname(file_path),
          join(dirname(file_path), "..", "test"),
          join(dirname(file_path), "..", "tests"),
          join(dirname(file_path), "..", "__tests__"),
        ];
        const hasTests = testDirs.some(dir =>
          TEST_EXTS.some(ext => existsSync(join(dir, `${base}.test${ext}`)))
        );
        const hasExports = /export\s+(function|const|class|default)|module\.exports/.test(code);
        if (hasExports && !hasTests) {
          score += 5;
          findings.push(`- [WARN] No test file found for module "${base}" (searched test/, tests/, __tests__/)`);
        } else {
          findings.push(`- [INFO] Test coverage: ${hasTests ? "test file found" : "no exports to test"}`);
        }
      }

      // Cap score at 100
      score = Math.min(score, 100);

      // Verdict
      let verdict;
      if (score <= SCORE_PASS_MAX) verdict = "PASS";
      else if (score <= SCORE_WARN_MAX) verdict = "WARN";
      else verdict = "HALT";

      const header = `RISK SCORE: ${score}/100 (${verdict})`;
      const body = findings.join("\n");
      const footer = verdict === "HALT" ? "\n\nFix HALT items before proceeding." : verdict === "WARN" ? "\n\nWARN items are advisory. Fix if possible." : "";

      return {
        content: [{ type: "text", text: `${header}\n${body}${footer}` }],
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
          content: [{ type: "text", text: "PASS — Valid Conventional Commits format. Proceed with commit." }],
        };
      }

      return {
        content: [{ type: "text", text: "HALT — Invalid format. Must be: type(scope): description\nValid types: feat, fix, docs, style, refactor, perf, test, chore" }],
      };
    }
  );

  // Tool: dependency_validate
  server.tool(
    "dependency_validate",
    "Checks if import/require references exist on disk. Handles relative imports (./x, ../x), bare imports (lodash, express), Node built-ins, @/ aliases (tsconfig paths), and ~/ aliases. Detects hallucinated imports.",
    { file_path: z.string().describe("Absolute path to the file to validate dependencies for.") },
    async ({ file_path }) => {
      const rateLimitHit = rateLimiter.check("dependency_validate");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const absPath = resolve(file_path);
      if (!existsSync(absPath)) {
        return { content: [{ type: "text", text: `HALT — File does not exist: ${absPath}` }] };
      }

      const content = readFile(absPath);
      if (!content) {
        return { content: [{ type: "text", text: `HALT — Cannot read file: ${absPath}` }] };
      }

      const fileDir = dirname(absPath);
      const missing = [];
      const skipped = [];

      // Find project root (walk up to find package.json)
      let projectRoot = fileDir;
      for (let i = 0; i < 10; i++) {
        if (existsSync(join(projectRoot, "package.json"))) break;
        const parent = dirname(projectRoot);
        if (parent === projectRoot) break;
        projectRoot = parent;
      }

      // Load tsconfig paths if available
      const tsconfigPaths = {};
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      if (existsSync(tsconfigPath)) {
        try {
          const tsconfig = JSON.parse(readFile(tsconfigPath));
          const paths = tsconfig?.compilerOptions?.paths || {};
          for (const [alias, targets] of Object.entries(paths)) {
            const cleanAlias = alias.replace("/*", "");
            const target = Array.isArray(targets) ? targets[0].replace("/*", "") : targets.replace("/*", "");
            tsconfigPaths[cleanAlias] = resolve(projectRoot, tsconfig?.compilerOptions?.baseUrl || ".", target);
          }
        } catch { /* ignore parse errors */ }
      }

      const EXTENSIONS = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs", ".json"];

      function resolveImport(importPath) {
        // 1. Relative imports
        if (importPath.startsWith(".")) {
          const candidates = [resolve(fileDir, importPath)];
          for (const ext of EXTENSIONS) {
            candidates.push(resolve(fileDir, importPath + ext));
          }
          candidates.push(resolve(fileDir, importPath, "index.js"));
          candidates.push(resolve(fileDir, importPath, "index.ts"));
          return candidates.some(c => existsSync(c));
        }

        // 2. Node built-ins
        if (NODE_BUILTINS.has(importPath) || NODE_BUILTINS.has(importPath.split("/")[0])) {
          return true;
        }

        // 3. tsconfig @/ aliases
        for (const [alias, targetDir] of Object.entries(tsconfigPaths)) {
          if (importPath.startsWith(alias + "/") || importPath === alias) {
            const rest = importPath.slice(alias.length + 1);
            const resolved = rest ? resolve(targetDir, rest) : targetDir;
            const candidates = [resolved];
            for (const ext of EXTENSIONS) candidates.push(resolved + ext);
            if (candidates.some(c => existsSync(c))) return true;
          }
        }

        // 4. ~/ alias (common in some frameworks)
        if (importPath.startsWith("~/")) {
          const resolved = resolve(projectRoot, importPath.slice(2));
          const candidates = [resolved];
          for (const ext of EXTENSIONS) candidates.push(resolved + ext);
          if (candidates.some(c => existsSync(c))) return true;
        }

        // 5. Bare imports — check node_modules
        const pkgName = importPath.startsWith("@") ? importPath.split("/").slice(0, 2).join("/") : importPath.split("/")[0];
        const nodeModulesPath = join(projectRoot, "node_modules", pkgName);
        if (existsSync(nodeModulesPath)) return true;

        return false;
      }

      // JS/TS ES imports
      const importRegex = /import\s+(?:[\w{},*\s]+\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!resolveImport(importPath)) {
          missing.push(`import "${importPath}"`);
        }
      }

      // CommonJS require
      const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        const requirePath = match[1];
        if (!resolveImport(requirePath)) {
          missing.push(`require("${requirePath}")`);
        }
      }

      // Dynamic import()
      const dynamicImportRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = dynamicImportRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!resolveImport(importPath)) {
          missing.push(`import("${importPath}")`);
        }
      }

      // HTML: <script src="x"> and <link href="x">
      const scriptRegex = /<script\s+[^>]*src=['"]([^'"]+)['"]/g;
      while ((match = scriptRegex.exec(content)) !== null) {
        const src = match[1];
        if (!src.startsWith("http") && !src.startsWith("//")) {
          const resolved = resolve(fileDir, src);
          if (!existsSync(resolved)) {
            missing.push(`<script src="${src}">`);
          }
        }
      }

      const linkRegex = /<link\s+[^>]*href=['"]([^'"]+\.css)['"]/g;
      while ((match = linkRegex.exec(content)) !== null) {
        const href = match[1];
        if (!href.startsWith("http") && !href.startsWith("//")) {
          const resolved = resolve(fileDir, href);
          if (!existsSync(resolved)) {
            missing.push(`<link href="${href}">`);
          }
        }
      }

      if (missing.length > 0) {
        return {
          content: [{
            type: "text",
            text: `HALT — ${missing.length} missing reference(s):\n\n${missing.map(m => `- ${m}`).join("\n")}\n\nPossible hallucinated import. Fix before proceeding.\n\nChecked: relative paths, node_modules, tsconfig paths (${Object.keys(tsconfigPaths).length} aliases), Node built-ins.`,
          }],
        };
      }

      const aliasInfo = Object.keys(tsconfigPaths).length > 0 ? ` (${Object.keys(tsconfigPaths).length} tsconfig aliases loaded)` : "";
      return {
        content: [{
          type: "text",
          text: `PASS — All imports and references resolve to existing files.${aliasInfo}\nChecked: relative, bare (node_modules), tsconfig paths, Node built-ins, HTML assets.`,
        }],
      };
    }
  );
}
