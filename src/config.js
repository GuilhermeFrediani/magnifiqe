/**
 * Stack Perfeita MCP — Configuration
 * All constants, topic maps, rule descriptions, and bad code patterns.
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

const args = process.argv.slice(2);
const rulesDirFlag = args.indexOf("--rules-dir");
const RULES_DIR = rulesDirFlag !== -1
  ? resolve(args[rulesDirFlag + 1])
  : resolve(process.cwd(), "ai-rules");

const SRC_DIR = resolve(RULES_DIR, "../src");
const SKILLS_DIR = resolve(process.cwd(), ".claude/skills");
const COMMANDS_DIR = resolve(RULES_DIR, "commands");
const MEMORY_FILE = resolve(process.cwd(), ".claude", "session_memory.json");
const PROJECT_STATE_FILE = resolve(process.cwd(), ".claude", "project_state.json");

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
  "systematic":   "11-systematic-debugging.md",
  "debug-method": "11-systematic-debugging.md",
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
  "11-systematic-debugging.md":     "4-phase systematic debugging — root cause, hypothesis, fix, verify",
};

const BAD_PATTERNS = [
  { regex: /\bany\b/,                              id: "any",          msg: "TypeScript any — infer correct type", lang: "ts" },
  { regex: /catch\s*\([^)]*\)\s*\{\s*\}/,         id: "empty-catch",  msg: "Empty catch — Fail Fast, handle the error" },
  { regex: /catch\s*\{\s*\}/,                      id: "empty-catch",  msg: "Empty catch — Fail Fast, handle the error" },
  { regex: /console\.log\((?!{)/,                  id: "console-log",  msg: "Raw console.log — use structured logger or debugger", lang: "js" },
  { regex: /function\s+\w+[^{]{200,}/,            id: "god-function", msg: "God Function — break into smaller functions" },
  { regex: /if.*if.*if.*if/,                       id: "arrow-code",   msg: "Arrow code — use Early Returns, reduce nesting" },
  { regex: /innerHTML\s*=/,                        id: "innerhtml",    msg: "Unsafe innerHTML — use textContent or replaceChildren" },
  { regex: /\bvar\s+/,                             id: "var",          msg: "var detected — use const/let" },
  { regex: /[^=!]==[^=]/,                          id: "weak-eq",      msg: "Weak comparison == — use ===", lang: "js" },
  { regex: /\/\/\s*(TODO|FIXME)/i,                 id: "todo-inline",  msg: "Technical debt inline — resolve or create issue" },
  { regex: /\beval\s*\(/,                          id: "eval",         msg: "eval prohibited — injection risk" },
  // Python-specific patterns
  { regex: /except\s*:\s*pass/,                    id: "empty-except",  msg: "Empty except — handle the exception or log it", lang: "py" },
  { regex: /except\s+Exception\s*:\s*pass/,        id: "broad-except",  msg: "Broad exception swallowed — handle specific error", lang: "py" },
  { regex: /\bprint\s*\(/,                         id: "print-debug",   msg: "print() for debug — use logging module or debugger", lang: "py" },
  { regex: /#\s*(TODO|FIXME)/i,                    id: "todo-py",       msg: "Technical debt inline — resolve or create issue", lang: "py" },
];

export {
  ROOT_DIR,
  RULES_DIR,
  SRC_DIR,
  SKILLS_DIR,
  COMMANDS_DIR,
  MEMORY_FILE,
  PROJECT_STATE_FILE,
  TOPIC_MAP,
  RULE_DESCRIPTIONS,
  BAD_PATTERNS,
};
