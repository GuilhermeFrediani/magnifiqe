# Stack Perfeita MCP

**MCP server for real coding agents: anti-hallucination, bad-code gates, checkpoint/resume, context compaction, and strict output hygiene.**

[![Cursor](https://img.shields.io/badge/Cursor-Ready-purple)](https://cursor.com)
[![Windsurf](https://img.shields.io/badge/Windsurf-Ready-blue)](https://windsurf.com)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Ready-orange)](https://claude.ai)
[![VS Code](https://img.shields.io/badge/VS_Code-Ready-blue)](https://code.visualstudio.com)
[![npm version](https://img.shields.io/npm/v/stack-perfeita-mcp.svg)](https://www.npmjs.com/package/stack-perfeita-mcp)

## Why this instead of a static system prompt?

A static system prompt can ask for discipline. Stack Perfeita can **enforce parts of it at runtime**:

- **Executable validation** — `validate_bad_code`, `dependency_validate`, and `validate_response_style` check outputs instead of trusting self-policing.
- **Deeper dependency resolution** — `dependency_validate` now understands monorepos, workspace packages, package `exports`, `tsconfig`/`jsconfig` paths, and Vite aliases.
- **Formal state** — `get_project_state`, `checkpoint_task`, `list_checkpoints`, and `resume_task` reduce drift across long sessions.
- **Progressive disclosure** — rules are loaded on demand instead of dumping every policy into context at once.
- **Project activation** — `activate_project()` builds a usable manifest in one call.

---

## Install

### Public package names
- **npm package:** `stack-perfeita-mcp`
- **setup CLI:** `stack-perfeita`
- **server name in IDEs:** `stack-perfeita`
- **human-facing product name:** **Stack Perfeita MCP**

### Fast path

```bash
npm install -g stack-perfeita-mcp
stack-perfeita init
```

That does two things:

1. Generates IDE config files (`.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, `opencode.json`)
2. Bootstraps starter `ai-rules/` and `.claude/skills/`

### Other setup modes

```bash
stack-perfeita           # generate IDE config only
stack-perfeita init      # config + starter rules + starter skills
stack-perfeita --minimal # only .cursorrules
stack-perfeita --force   # overwrite existing generated files
```

---

## Native IDE configuration

### Cursor

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

### Windsurf

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

### VS Code + Copilot

Run `stack-perfeita` or `stack-perfeita init` in the project root. It will generate `.github/copilot-instructions.md` automatically.

---

## How it works

```text
Project root
    |
    +--> ai-rules/               # project rules
    +--> .claude/skills/         # reusable task playbooks
    +--> .claude/project_state.json
    |
    v
stack-perfeita (setup)
    |
    +--> generates IDE config files
    |
    v
npx stack-perfeita-mcp --rules-dir ./ai-rules
    |
    +--> activation
    +--> validation
    +--> checkpoints
    +--> compaction
    +--> rule / skill retrieval
    |
    v
IDE agent
```

---

## Core features

- **Rotten Foundation Rule** — do not build on top of obviously broken code.
- **Rule of 2** — same failure twice -> HALT.
- **Code gate** — blockers, warnings, advisories, plus AST metrics.
- **Response-style gate** — block excitation tokens, filler, and verbose narration.
- **State + checkpoints** — resume work without asking the LLM to "remember harder".
- **Compaction tools** — shrink logs, diffs, and long sessions before they rot context.
- **Automatic state compaction** — project state trims older/oversized entries predictably when thresholds are exceeded.
- **Stronger code reading** — Babel-first parsing improves decorators, JSX/TSX, typed methods, and class-field analysis.
- **Model profiles** — provider family + capability matrix, including weaker-model scaffolding hints.
- **Role activation** — operational presets for architect, implementer, debugger, reviewer, frontend, backend, multimodal, refactor, and security review.
- **Task runtime contracts** — formalize objective, acceptance criteria, and step evidence before claiming success.
- **Project activation** — one-call manifest for stack, rules, skills, state, and cache strategy.
- **Caveman Mode** — explicit ultra-compact mode when token pressure is real.

---

## Exposed tools (31 tools)

| Tool | What it does |
|---|---|
| `list_rules()` | Lists rule files available in `ai-rules/` |
| `get_rules(topic, mode)` | Reads one rule file by topic or filename |
| `get_context(module_path)` | Reads a module-level `CONTEXT.md` |
| `get_rules_bundle(mode)` | Stable, cache-friendly rules index or full bundle |
| `validate_bad_code(code, file_path?)` | Blockers + warnings + advisories + AST metrics |
| `validate_response_style(text, mode)` | Blocks excitation tokens, filler, and verbose narration |
| `validate_git_commit(message)` | Checks Conventional Commits format |
| `dependency_validate(file_path)` | Fast-path detector for hallucinated imports/assets, now workspace/exports/alias-aware |
| `smart_outline(file_path)` | Structural outline of a file |
| `smart_unfold(file_path, symbol_name)` | Expands a specific symbol only |
| `smart_read(file_path, mode, symbol_name?)` | Intelligent reader for long files |
| `list_skills()` | Lists reusable playbooks in `.claude/skills/` |
| `get_skill(name)` | Loads one specific skill |
| `run_command(name, args?)` | Returns predefined command prompts from `ai-rules/commands/` |
| `save_observation(observation)` | Persists important observations |
| `search_observations(query)` | Searches saved observations |
| `get_project_state(section?)` | Reads full formal project state or one section |
| `save_project_state(section, content)` | Updates one state section |
| `checkpoint_task(label)` | Saves checkpoint snapshot |
| `list_checkpoints()` | Lists saved checkpoints |
| `resume_task(label?)` | Restores state from checkpoint |
| `compact_conversation_state(summary)` | Stores condensed conversation state |
| `compact_logs(log_text, keep_errors?)` | Keeps useful signal, discards noise |
| `compact_diff(diff_text)` | Summarizes changed files/hunks |
| `promote_summary_to_checkpoint(label)` | Turns compacted state into a formal checkpoint |
| `get_model_profile(model)` | Returns provider/model capability profile guidance |
| `activate_role(role, model?, task_type?, stack?)` | Returns operational scaffolding adapted to model strength |
| `start_task_contract(...)` | Formalizes objective, outputs, non-goals, acceptance criteria, and minimum evidence |
| `assert_step_evidence(...)` | Records step hypothesis, evidence, verification, and status |
| `activate_project(project_root?)` | Builds full project manifest |
| `compress_markdown(path)` | Token-minifies long markdown files |

---

## Architecture

```text
src/
  index.js          # server entrypoint
  config.js         # constants, rules metadata, bad-code + response-style patterns
  helpers.js        # file reading, token minify, path helpers
  rate-limiter.js   # anti-loop protection on hot tools
  resources.js      # MCP resources for ai-rules
  rules.js          # list_rules, get_rules, get_context, get_rules_bundle
  validators.js     # code validation, response-style validation, dependency validation
  dependency-resolution.js # workspace/exports/alias-aware import resolution
  skills.js         # list_skills, get_skill
  code-reading.js   # smart_outline, smart_unfold, smart_read, AST metrics
  state-compaction.js # automatic threshold-based project-state trimming
  commands.js       # run_command
  memory.js         # save_observation, search_observations
  project-state.js  # formal state + checkpoints
  compaction.js     # compaction helpers for logs/diffs/state
  profiles.js       # model-specific operating profiles
  activation.js     # project manifest builder
```

The goal is modularity by responsibility. Some analyzers are necessarily larger, but the design keeps the server split by concern rather than one monolithic "god file".

---

## Prompt recipes

### 1. New project / fresh session

```text
Activate Stack Perfeita in this project.

1. Call activate_project()
2. Call get_model_profile("claude")   # or gpt / gemini
3. Call activate_role("implementer", model="claude")
4. Call start_task_contract(...)
5. Call get_rules_bundle("index")
6. Call get_project_state()
7. Work in adaptive terseness
8. Record proof with assert_step_evidence(...)
9. Before final code: validate_bad_code
10. Before new imports/assets: dependency_validate
11. If the same failure happens twice -> HALT
12. If foundation is rotten -> stop feature work and propose fixing the base first
```

### 2. Resume an ongoing project

```text
Resume this project with Stack Perfeita.

1. Call activate_project()
2. Call get_project_state()
3. Call list_checkpoints()
4. If needed, call resume_task()
5. Re-activate the operational role with activate_role(...)
6. Re-open or restate the task with start_task_contract(...)
7. Load only the rules needed for the current task
8. Continue from the last valid step, not from scratch
```

### 3. Reinforce essentials / anti-loop / anti-drift

```text
Reinforce Stack Perfeita essentials.

- Return to concise mode
- Reload current state with get_project_state()
- Re-read only the rule needed
- Same failure twice -> HALT
- Validate code before delivery
- Validate imports after adding them
- Record step proof with assert_step_evidence(...)
- Do not invent APIs, files, or behavior
- Continue exactly from the last proven step
```

### 4. Force ultra-compact output

```text
CAVEMAN MODE: ACTIVE.

- Zero excitation tokens
- No filler, no warm-up, no process narration
- Keep technical precision
- If answer becomes long prose, run validate_response_style in caveman mode first
```

---

## Demo

**Without Stack Perfeita**
> Agent invents imports, writes code with `any`, loses track after a long session.

**With Stack Perfeita**
> `validate_bad_code` flags `any` as a blocker -> HALT.
> `dependency_validate` catches a phantom import before merge.
> `checkpoint_task("before-auth-refactor")` creates rollback point.
> Next session uses `list_checkpoints()` + `resume_task()` to continue from a proven state.

---

## Roadmap

### Shipped
- Modular server architecture
- 31 MCP tools
- Code gate + response-style gate
- Formal project state + checkpoint listing/resume
- Context compaction helpers
- Project activation manifest
- Bootstrap installer for per-project starter packs
- Capability-aware model profiles
- Role activation presets
- Task contract + step evidence runtime

### Next
- Change-set validation against actual diffs
- Foundation audit as a first-class tool
- Hybrid validators with deeper semantic/security signals
- Configurable compaction policy tuning per project

---

## Contributing

1. **New bad-code or response-style pattern** -> `src/config.js`
2. **New rule** -> `ai-rules/`
3. **New reusable prompt command** -> `ai-rules/commands/`
4. **New workflow playbook** -> `.claude/skills/`

**If this improves your agent workflow, star the repo.**
