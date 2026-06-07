# Core Prompts: Stack Perfeita

Keep these prompts in a keyboard shortcut (like Raycast Snippets, Espanso or Beeftext) to invoke the AI instantly and enforce MCP behavior.

## 1. Ignition Prompt (Session Start)
*Use this on the very first message when starting a new task or project.*

```text
STACK-PERFEITA MCP ACTIVE.

1. Call `list_rules` -> see available rules
2. Call `get_rules("behavior", mode="summary")` -> read behavioral rules
3. Call `get_project_state()` -> check existing state or start fresh
4. MODE: Adaptive Terseness (concise by default, expand when risk/debugging requires)
5. RULE OF 2 (Anti-Loop): If you fail twice the same way -> HALT -> Report.

OUTPUT-GATE MANDATORY (At the end of every response):
- [ ] My prompt requirements met
- [ ] `validate_bad_code` = PASS
- [ ] `dependency_validate` = PASS
- [ ] Concise and precise (no filler)
```

---

## 2. Checkpoint Prompt (Course Correction)
*Use this when the AI starts rambling, producing lower quality output, or failing the Rule of 2.*

```text
CHECKPOINT MCP: RETURN TO CONCISE MODE.

1. Return to Rules -> `get_rules("behavior")`.
2. Call `checkpoint_task("before-next-step")` to save current state.
3. Call `validate_bad_code` on the last code block. Did it PASS?
4. Root cause of previous failure -> Exact fix. No blind attempts.
5. Respond with corrected code or bash command. No preamble.
```

---

## 3. State Recovery Prompt (Resume Session)
*Use when resuming a session and you need to pick up where you left off.*

```text
RESUME SESSION.

1. Call `get_project_state()` to see current state.
2. If state is empty or stale, call `resume_task()` to restore from last checkpoint.
3. Review `next_steps` and `open_questions` sections.
4. Continue from where we left off.
```

---

## 4. Context Compaction
*Use when context is filling up with long texts, to save input tokens.*

```text
TOKEN OPTIMIZATION.

Use the `compress_markdown("path/to/file.md")` tool before reading any long documentation in this task. Never use regular `read` on docs larger than 100 lines.

After compression, summarize what you learned in 2-3 bullet points and discard the original verbose content from your mental context.
```

---

## 5. Session Memory
*Use when you need to recall or persist decisions and architectural choices.*

```text
MEMORY MANAGEMENT.

Use `search_observations("keyword")` to find previously saved decisions or learnings.
Use `save_observation("decision text")` to persist important decisions for future reference.
Use `save_project_state("decisions", "description")` to update formal project state.
```
