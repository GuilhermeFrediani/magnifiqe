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

- **PASS/HALT validation** — `validate_bad_code` stops bad code (15 patterns), `dependency_validate` catches hallucinated imports.
- **State checkpoints** — save project state, create checkpoints, resume from any point. No more losing context in long sessions.
- **Adaptive terseness** — behavioral rules enforce concise output, expanding only when risk or debugging demands it.
- **Progressive disclosure** — rules loaded on-demand via tools, not dumped into context.
- **Python support** — bad patterns for Python code too (empty except, print debug, TODO).

---

## Exposed Tools (18 tools)

| Tool | What it does |
|---|---|
| `list_rules()` | Lists all available rule files |
| `get_rules(topic, mode)` | Reads rules (`summary` = description only, `full` = entire content) |
| `get_context(module_path)` | Returns CONTEXT.md for a module folder |
| `validate_bad_code(code)` | **15 patterns** -> PASS/HALT (any, console.log, eval, etc.) |
| `validate_git_commit(msg)` | Validates Conventional Commits format |
| `dependency_validate(path)` | Do imports exist or did the LLM hallucinate the path? |
| `smart_outline(path)` | Lists all functions and signatures in a file |
| `smart_unfold(path, name)` | Extracts just one specific function from a long file |
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

---

## Architecture

```
src/
  index.js          # Entry point (~110 lines): config, server init, connect
  config.js         # Constants: RULES_DIR, TOPIC_MAP, BAD_PATTERNS
  helpers.js        # readFile, minifyTokens, safeResolvePath
  rate-limiter.js   # Anti-loop rate limiter
  resources.js      # MCP resource registrations
  rules.js          # list_rules, get_rules, get_context
  validators.js     # validate_bad_code, validate_git_commit, dependency_validate
  skills.js         # list_skills, get_skill
  code-reading.js   # smart_outline, smart_unfold
  commands.js       # run_command
  memory.js         # save_observation, search_observations
  project-state.js  # get/save/checkpoint/resume project state
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

## Contributing

1. **New pattern in `validate_bad_code`** -> PR in `src/config.js` (BAD_PATTERNS array)
2. **New rule** -> `ai-rules/12-new-rule.md`
3. **New Slash Command** -> `ai-rules/commands/`

**Star if it helped your workflow!**
