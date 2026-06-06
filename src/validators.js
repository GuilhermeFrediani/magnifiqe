/**
 * Stack Perfeita MCP — Validator tools
 * validate_bad_code, validate_git_commit, dependency_validate MCP tool registrations.
 */

import { z } from "zod";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { BAD_PATTERNS } from "./config.js";
import { readFile } from "./helpers.js";
import { rateLimiter } from "./rate-limiter.js";

function getFileLang(filePath) {
  if (/\.(js|ts|jsx|tsx|mjs|cjs)$/.test(filePath)) return "js";
  if (/\.py$/.test(filePath)) return "py";
  return null;
}

export function registerValidatorsTools(server) {
  // Tool: validate_bad_code
  server.tool(
    "validate_bad_code",
    "Checks code against bad patterns (any, empty catch, console.log, God Function, arrow code, innerHTML, var, ==, TODO, eval, Python except/pass, print). Returns PASS or HALT with detected patterns. Use BEFORE submitting code to a file.",
    { code: z.string().describe("Code snippet to validate (JavaScript/TypeScript/Python).") },
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
        return { content: [{ type: "text", text: `HALT — File does not exist: ${absPath}` }] };
      }

      const content = readFile(absPath);
      if (!content) {
        return { content: [{ type: "text", text: `HALT — Cannot read file: ${absPath}` }] };
      }

      const fileDir = dirname(absPath);
      const missing = [];

      // JS/TS imports
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
        if (!candidates.some(c => existsSync(c))) {
          missing.push(`import "${importPath}" — not found relative to ${fileDir}`);
        }
      }

      // CommonJS
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
        if (!candidates.some(c => existsSync(c))) {
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
}
