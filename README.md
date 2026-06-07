# Stack Perfeita MCP

**MCP server that disciplines coding agents in real projects: anti-hallucination, code validation, and state checkpoints.** Move from vibe coding to rules + active validation.

[![Cursor](https://img.shields.io/badge/Cursor-Ready-purple)](https://cursor.com)
[![Windsurf](https://img.shields.io/badge/Windsurf-Ready-blue)](https://windsurf.com)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Ready-orange)](https://claude.ai)
[![VS Code](https://img.shields.io/badge/VS_Code-Ready-blue)](https://code.visualstudio.com)
[![npm version](https://img.shields.io/npm/v/stack-perfeita-mcp.svg)](https://www.npmjs.com/package/stack-perfeita-mcp)

## Why This Instead of a System Prompt?

A system prompt is static text. Stack Perfeita is a **live MCP server** that provides:
- **Executable validation** — `validate_bad_code` and `dependency_validate` actually check code, not just ask the LLM to self-police.
- **State checkpoints** — `checkpoint_task` / `resume_task` let the agent roll back to a known-good state after failures.
- **Progressive disclosure** — rules are loaded on-demand via tools, not dumped into context all at once.

---

## Quick Install (60 seconds)

```bash
# Install globally
npm install -g stack-perfeita-mcp

# In your project folder, generate IDE config files:
stack-perfeita
```

This generates `.cursorrules`, `.windsurfrules`, and `opencode.json` pointing to the MCP server. Each project uses its own `ai-rules/` folder for project-specific rules.

### Set Up Your Project Rules

Copy the starter rules into your project:

```bash
# In your project root:
mkdir ai-rules
# Copy or create your project-specific rules in ai-rules/
```

---

## Native IDE Configuration

### Cursor (most popular)
In Cursor Settings -> MCP -> Add Custom:

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "npx",
      "args": ["stack-perfeita-mcp", "--rules-dir", "./ai-rules"]
    }
  }
}
```
**Restart Cursor** -> done!

### Windsurf
Windsurf -> **Plugins** (sidebar) -> **Add Custom MCP**:

```json
{
  "servers": {
    "stack-perfeita": {
      "command": "npx",
      "args": ["stack-perfeita-mcp", "--rules-dir", "./ai-rules"]
    }
  }
}
```

### Claude Desktop / Claude Code
```bash
claude mcp add stack-perfeita --command "npx stack-perfeita-mcp --rules-dir ./ai-rules"
```

### VS Code + GitHub Copilot
Place `.github/copilot-instructions.md` in your project root. The `stack-perfeita` CLI does this automatically.

---

## How It Works

```
Your Project
    |
    v
stack-perfeita (setup) --> generates .cursorrules + opencode.json
    |
    v
MCP Server (npx stack-perfeita-mcp)
    |
    +--> ai-rules/        (your project rules)
    +--> .claude/skills/  (task playbooks)
    +--> .claude/project_state.json  (state checkpoints)
    |
    v
IDE Agent <-- tools: validate, search, checkpoint, resume
```

---

## Core Features

- **PASS/HALT validation** — `validate_bad_code` stops bad code (15 patterns + AST metrics + risk score), `dependency_validate` catches hallucinated imports.
- **State checkpoints** — save project state, create checkpoints, resume from any point. No more losing context in long sessions.
- **Compaction layer** — `compact_logs`, `compact_diff`, `compact_conversation_state` for long sessions.
- **Model profiles** — `get_model_profile` returns tuned config for Claude, GPT, or Gemini.
- **Project activation** — `activate_project` builds a full manifest (stack, rules, skills, state, fingerprint) in one call.
- **Adaptive terseness** — behavioral rules enforce concise output, expanding only when risk or debugging demands it.
- **Progressive disclosure** — rules loaded on-demand via tools, not dumped into context.
- **Python support** — bad patterns for Python code too (empty except, print debug, TODO).

---

## Demo: Before vs After

**Without Stack Perfeita:**
> Agent generates code with `any` types, hallucinated imports, and no validation.
> Session drifts after 20 messages, losing track of decisions.

**With Stack Perfeita:**
> `validate_bad_code` catches `any` before commit (RISK SCORE: 15/100 — HALT).
> `dependency_validate` catches phantom import `@utils/helpers`.
> `checkpoint_task("auth-done")` saves state.
> Next session: `resume_task()` restores full context.

---

## Exposed Tools (25 tools)

| Tool | What it does |
|---|---|
| `list_rules()` | Lists all available rule files |
| `get_rules(topic, mode)` | Reads rules (`summary` = description only, `full` = entire content) |
| `get_context(module_path)` | Returns CONTEXT.md for a module folder |
| `validate_bad_code(code)` | **15 patterns + AST metrics** -> risk score 0-100 PASS/WARN/HALT |
| `validate_git_commit(msg)` | Validates Conventional Commits format |
| `dependency_validate(path)` | Do imports exist? Checks relative, bare, tsconfig, Node builtins |
| `smart_outline(path)` | AST-based outline of all symbols in a file |
| `smart_unfold(path, name)` | Extracts just one specific function from a long file |
| `smart_read(path, mode)` | Intelligent reader: auto/outline/full/symbol modes |
| `list_skills()` | Lists available playbooks in `.claude/skills` |
| `get_skill(name)` | Loads instructions for a specific task |
| `save_observation(obs)` | Saves architectural decisions across chats |
| `search_observations(q)` | Searches project memory |
| `get_project_state(section?)` | Returns full project state or a specific section |
| `save_project_state(section, content)` | Updates a section of project state |
| `checkpoint_task(label)` | Creates a snapshot of current state for rollback |
| `resume_task(label?)` | Restores state from a checkpoint |
| `run_command(name, args)` | Runs a structured script from `ai-rules/commands` |
| `compress_markdown(path)` | Minifies markdown in-memory to save input tokens |
| `compact_conversation_state(summary)` | Saves structured conversation state to free context |
| `compact_logs(log_text)` | Extracts errors/warnings from logs, discards noise |
| `compact_diff(diff_text)` | Summarizes unified diff: files, hunks, line counts |
| `promote_summary_to_checkpoint(label)` | Promotes compacted state to a formal checkpoint |
| `get_model_profile(model)` | Returns tuned config for Claude, GPT, or Gemini |
| `activate_project(root?)` | Builds full project manifest with fingerprint |
| `get_rules_bundle(mode)` | All rules in stable order for prompt caching |

---

## Architecture

```
src/
  index.js          # Entry point: config, server init, connect
  config.js         # Constants: RULES_DIR, TOPIC_MAP, BAD_PATTERNS
  helpers.js        # readFile, minifyTokens, safeResolvePath
  rate-limiter.js   # Anti-loop rate limiter
  resources.js      # MCP resource registrations
  rules.js          # list_rules, get_rules, get_context
  validators.js     # validate_bad_code (regex+AST), validate_git_commit, dependency_validate
  skills.js         # list_skills, get_skill
  code-reading.js   # smart_outline, smart_unfold, smart_read (AST via acorn-loose)
  commands.js       # run_command
  memory.js         # save_observation, search_observations
  project-state.js  # get/save/checkpoint/resume project state
  compaction.js     # compact_logs, compact_diff, compact_conversation_state, promote_summary_to_checkpoint
  profiles.js       # get_model_profile (Claude, GPT, Gemini)
  activation.js     # activate_project (manifest builder with fingerprint)
```

Each module stays under 300 lines (per the project's own `09-bad-patterns-halt.md` rule).

---

## Prompt Recipes

### Ignition (Session Start)
> "STACK-PERFEITA MCP ACTIVE. Call `list_rules`, read `get_rules('behavior')`, call `get_project_state`. OUTPUT-GATE MANDATORY."

### Checkpoint (Course Correction)
> "CHECKPOINT MCP. Call `checkpoint_task('before-refactor')`. Return to concise mode."

### State Recovery
> "Resume from last checkpoint. Call `resume_task` and continue from where we left off."

---

## Roadmap

### Shipped (v4.0)
- Modular architecture (15 modules)
- 25 MCP tools including state/checkpoint/resume, compaction, profiles, activation
- AST-based code validation with risk scoring (acorn-loose)
- Compaction layer for long sessions
- Model-specific profiles (Claude, GPT, Gemini)
- Project activation manifest with fingerprint
- Per-project setup via npx
- 80+ tests, zero dependencies beyond MCP SDK + zod + acorn

### Next
- Multi-language AST support (Python via tree-sitter)
- Semantic search across observations
- Auto-compaction triggers based on token count
- Remote project state sync

---

## Contributing

1. **New pattern in `validate_bad_code`** -> PR in `src/config.js` (BAD_PATTERNS array)
2. **New rule** -> `ai-rules/12-new-rule.md`
3. **New Slash Command** -> `ai-rules/commands/`

**Star if it helped your workflow!**
