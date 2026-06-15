# src/config.js

- kind: js
- lines: 144
- bytes: 9098

## Summary
Stack Perfeita MCP — Configuration All constants, topic maps, rule descriptions, response-style rules, and bad-code patterns.

## Imports
- `path`
- `url`

## Exports
- `ROOT_DIR`
- `PROJECT_ROOT`
- `RULES_DIR`
- `SRC_DIR`
- `SKILLS_DIR`
- `COMMANDS_DIR`
- `MEMORY_FILE`
- `PROJECT_STATE_FILE`
- `COUNCIL_STATE_FILE`
- `STATE_LIMITS`
- `TOPIC_MAP`
- `RULE_DESCRIPTIONS`
- `BAD_PATTERNS`
- `RESPONSE_STYLE_PATTERNS`

## Source
```js
/**
 * Stack Perfeita MCP — Configuration
 * All constants, topic maps, rule descriptions, response-style rules, and bad-code patterns.
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const PROJECT_ROOT = resolve(process.cwd());

const args = process.argv.slice(2);
const rulesDirFlag = args.indexOf("--rules-dir");
const RULES_DIR = rulesDirFlag !== -1 && args[rulesDirFlag + 1]
  ? resolve(args[rulesDirFlag + 1])
  : resolve(PROJECT_ROOT, "ai-rules");

const SRC_DIR = resolve(RULES_DIR, "../src");
const SKILLS_DIR = resolve(PROJECT_ROOT, ".claude/skills");
const COMMANDS_DIR = resolve(RULES_DIR, "commands");
const MEMORY_FILE = resolve(PROJECT_ROOT, ".claude", "session_memory.json");
const PROJECT_STATE_FILE = resolve(PROJECT_ROOT, ".claude", "project_state.json");
const COUNCIL_STATE_FILE = resolve(PROJECT_ROOT, ".claude", "council_state.json");

const STATE_LIMITS = {
  maxArrayItems: 50,
  maxCheckpoints: 20,
  maxCompactionHistory: 30,
  maxObservations: 100,
  autoCompactThresholdChars: 4000,
  autoCompactHardThresholdChars: 7000,
  autoCompactKeepRecentItems: 12,
  autoCompactKeepHardCapItems: 6,
  autoCompactMaxEntryChars: 220,
  autoCompactMaxScalarChars: 480,
};

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
  "council":      "12-council-deliberation.md",
  "deliberation": "12-council-deliberation.md",
  "arbiter":      "12-council-deliberation.md",
  "peer-review":  "12-council-deliberation.md",
};

const RULE_DESCRIPTIONS = {
  "00-project-overview.md":         "Project domain, stack, and non-functional requirements",
  "01-ai-workflow-strict.md":       "AI workflow rules — anti-hallucination, P.E.R., zero-loop",
  "02-coding-standards.md":         "Caveman style — naming, variables, loops, functions",
  "03-token-economy.md":            "Token compression — block filler, semantic compaction",
  "04-security-secrets.md":         "OWASP 2025/2026, secrets management, agentic risks",
  "05-debugging-mastery.md":        "Structured debugging — no blind logs, reproduce-reduce-prove",
  "06-ci-cd-testing.md":            "CI/CD as product — pipeline gates, SAST, coverage",
  "07-frontend-semantic.md":        "Semantic HTML, a11y, CSS modern, Core Web Vitals",
  "08-backend-architecture.md":     "Backend rules — validation at edge, ACID, stateless, N+1",
  "09-bad-patterns-halt.md":        "Bad code blacklist — halt on rotten foundation",
  "10-llm-behavioral-rules.md":     "Universal LLM rules — excitation blocking, global behavior",
  "11-systematic-debugging.md":     "4-phase systematic debugging — root cause, hypothesis, fix, verify",
  "12-council-deliberation.md":     "Multi-bot council deliberation — gate, peer review, synthesis, anti-theater rules",
};

const BAD_PATTERNS = [
  { regex: /\bany\b/,                              id: "any",            msg: "TypeScript any — infer or define the real type", lang: "ts", severity: "blocker" },
  { regex: /catch\s*\([^)]*\)\s*\{\s*\}/,     id: "empty-catch",    msg: "Empty catch — handle, rethrow, or log with context", severity: "blocker" },
  { regex: /catch\s*\{\s*\}/,                    id: "empty-catch",    msg: "Empty catch — handle, rethrow, or log with context", severity: "blocker" },
  { regex: /console\.log\((?!\s*\{)/,            id: "console-log",    msg: "Blind console.log — prefer structured log or debugger", lang: "js", severity: "warning" },
  { regex: /function\s+\w+[^{]{200,}/,            id: "god-function",   msg: "Large function signature/body hint — split responsibilities", severity: "warning" },
  { regex: /if.*if.*if.*if/,                       id: "arrow-code",     msg: "Deep conditional nesting — use early returns or guard clauses", severity: "warning" },
  { regex: /innerHTML\s*=/,                        id: "innerhtml",      msg: "Unsafe innerHTML — use textContent, template sanitization, or DOM APIs", severity: "blocker" },
  { regex: /dangerouslySetInnerHTML\s*=/,          id: "dangerous-react-html", msg: "dangerouslySetInnerHTML detected — sanitize or avoid raw HTML injection", lang: "js", severity: "blocker" },
  { regex: /\bfetch\s*\([\s\S]{0,240}\)(?![\s\S]{0,80}(signal|timeout))/, id: "fetch-no-timeout", msg: "fetch without timeout/abort signal hint — prefer AbortController or explicit timeout policy", lang: "js", severity: "warning" },
  { regex: /\b(exec|execSync)\s*\(/,             id: "child-process-exec", msg: "child_process exec detected — validate input, prefer execFile/spawn, avoid shell interpolation", lang: "js", severity: "warning" },
  { regex: /\blocalStorage\.(setItem|getItem)\(\s*["'`](token|auth|jwt|session|refresh)/i, id: "sensitive-localstorage", msg: "Sensitive token stored in localStorage — prefer httpOnly cookies or safer storage boundary", lang: "js", severity: "warning" },
  { regex: /\bvar\s+/,                             id: "var",            msg: "var detected — prefer const/let", lang: "js", severity: "advisory" },
  { regex: /[^=!]==[^=]/,                          id: "weak-eq",        msg: "Weak comparison == — use === unless coercion is deliberate", lang: "js", severity: "warning" },
  { regex: /\/\/\s*(TODO|FIXME)/i,                 id: "todo-inline",    msg: "Inline TODO/FIXME — resolve now or track externally", severity: "advisory" },
  { regex: /\beval\s*\(/,                          id: "eval",           msg: "eval prohibited — injection and integrity risk", severity: "blocker" },
  { regex: /except\s*:\s*pass/,                    id: "empty-except",   msg: "Empty except — handle the exception or rethrow", lang: "py", severity: "blocker" },
  { regex: /except\s+Exception\s*:\s*pass/,        id: "broad-except",   msg: "Broad exception swallowed — catch specific error", lang: "py", severity: "blocker" },
  { regex: /\bprint\s*\(/,                         id: "print-debug",    msg: "print() debug left in code — prefer logging or debugger", lang: "py", severity: "advisory" },
  { regex: /#\s*(TODO|FIXME)/i,                    id: "todo-py",         msg: "Inline TODO/FIXME — resolve now or track externally", lang: "py", severity: "advisory" },
];

const RESPONSE_STYLE_PATTERNS = [
  { regex: /\b(humm+|hmm+|uh+|umm+)\b/i, id: "hesitation", msg: "Hesitation token detected", severity: "blocker" },
  { regex: /\b(let me think|let me see|i'?ll analyze|i will analyze|vou analisar|deixa eu pensar|deixa eu ver)\b/i, id: "process-commentary", msg: "Process commentary detected", severity: "blocker" },
  { regex: /\b(got it|understood|alright|okay then|sure|claro|certo|entendido|perfeito)\b/i, id: "warmup", msg: "Warm-up filler detected", severity: "warning" },
  { regex: /\b(of course|absolutely|happy to help|com certeza|sem problemas)\b/i, id: "courtesy", msg: "Courtesy filler detected", severity: "warning" },
  { regex: /\b(here(?:'s| is) the code|here(?:'s| is) the updated code|aqui está|segue abaixo)\b/i, id: "preamble", msg: "Preamble before answer detected", severity: "warning" },
  { regex: /\b(the next step is|agora vou|vou criar|vou fazer|o próximo passo é)\b/i, id: "narration", msg: "Narration about process detected", severity: "warning" },
];

export {
  ROOT_DIR,
  PROJECT_ROOT,
  RULES_DIR,
  SRC_DIR,
  SKILLS_DIR,
  COMMANDS_DIR,
  MEMORY_FILE,
  PROJECT_STATE_FILE,
  COUNCIL_STATE_FILE,
  STATE_LIMITS,
  TOPIC_MAP,
  RULE_DESCRIPTIONS,
  BAD_PATTERNS,
  RESPONSE_STYLE_PATTERNS,
};

```
