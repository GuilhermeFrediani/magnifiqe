# Stack Perfeita MCP

**Disciplined engineering for any IDE + LLM.** Move from vibe coding to rules + active validation.

[![Cursor](https://img.shields.io/badge/Cursor-Ready-purple)](https://cursor.com)
[![Windsurf](https://img.shields.io/badge/Windsurf-Ready-blue)](https://windsurf.com)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Ready-orange)](https://claude.ai)
[![VS Code](https://img.shields.io/badge/VS_Code-Ready-blue)](https://code.visualstudio.com)
[![npm version](https://img.shields.io/npm/v/stack-perfeita-mcp.svg)](https://www.npmjs.com/package/stack-perfeita-mcp)

## What It Solves

- **Hallucinations** -> `dependency_validate` detects phantom imports
- **Degradation** -> `validate_bad_code` (15 patterns), anti-loop rate limit
- **Empty tokens** -> Behavioral rules block "humm", "understood", filler words
- **Regression** -> OUTPUT-GATE mandatory checklist
- **Global Standardization** -> Script that unifies `.cursorrules` and `.windsurfrules`

---

## Quick Install (Recommended)

If you want to use the repository as a centralized rules hub for all your projects (Single Source of Truth):

```bash
# Clone to your main code folder
git clone https://github.com/GuilhermeFrediani/magnifiqe.git ~/.stack-perfeita
cd ~/.stack-perfeita
npm install

# Install the CLI globally
npm link
```

### How to Link to a New Project
In any project folder where you'll be working, simply run:

```bash
stack-perfeita
```

This will automatically generate `.cursorrules`, `.windsurfrules` and `opencode.json` in the root of that project, with the **Ignition** commands already embedded.

*(See the [PROMPTS.md](./PROMPTS.md) file in the repository root for the exact magic words to use in the chat).*

---

## Native IDE Configuration

### Cursor (most popular)
In Cursor Settings -> MCP -> Add Custom. Add the following configuration (replace the path):

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["C:/Users/YourUser/.stack-perfeita/src/index.js"]
    }
  }
}
```
**Restart Cursor** -> done!

### Windsurf
1. Windsurf -> **Plugins** (sidebar) -> **MCP Marketplace**
2. **Add Custom MCP** -> paste the configuration using the same absolute path:

```json
{
  "servers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["/absolute/path/to/.stack-perfeita/src/index.js"]
    }
  }
}
```

### Claude Desktop / Claude Code
```bash
claude mcp add stack-perfeita --command "node /absolute/path/.stack-perfeita/src/index.js"
```

### VS Code + GitHub Copilot
Place `.github/copilot-instructions.md` in your project root. The `stack-perfeita` CLI does this automatically.

### Antigravity (Google)
Antigravity auto-detects local MCP servers, just pass the rules file.

---

## How to Instruct the LLM (Magic Prompts)

We have a file just for the prompts you should paste in the chat. **[Read PROMPTS.md](./PROMPTS.md)**.
In summary:

**Prompt 1: IGNITION (Project Opening)**
Whenever starting a new project, paste in the chat:
> "STACK-PERFEITA MCP ACTIVE. Call `list_rules`, read `AGENTS.md` at root. OUTPUT-GATE MANDATORY."

**Prompt 2: CHECKPOINT (Maintenance)**
If the AI starts rambling or producing bad code:
> "CHECKPOINT MCP. Stop rambling. Call `validate_bad_code` on the last block and ensure ZERO FLUFF."

---

## Exposed Tools (14 tools)

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
| `run_command(name, args)` | Runs a structured script from `ai-rules/commands` |
| `compress_markdown(path)` | Minifies markdown in-memory to save input tokens |

---

## Architecture

```
src/
  index.js          # Entry point (~100 lines): config, server init, connect
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
```

Each module stays under 300 lines (per the project's own `09-bad-patterns-halt.md` rule).

---

## Why It's Different (vs other MCPs)

- **PASS/HALT** — doesn't suggest, it **STOPS** bad code and returns error via JSON-RPC.
- **Excitation tokens BLOCKED** — Forces the LLM to stop saying "Understood, I'll do that!"
- **OUTPUT-GATE** — mandatory checklist before the AI sends the final response.
- **Session System** — the AI remembers learnings via `save_observation`.
- **Context Engineering** — `compress_markdown` + semantic summarization for long sessions.
- **Python Support** — bad patterns for Python code too (empty except, print debug, TODO).

---

## Contributing

1. **New pattern in `validate_bad_code`** -> PR in `src/config.js` (BAD_PATTERNS array)
2. **New rule** -> `ai-rules/12-new-rule.md`
3. **New Slash Command** -> `ai-rules/commands/`

**Star if it helped your workflow!**
