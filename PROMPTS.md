# Official Prompts: Stack-Perfeita (CAVEMAN EDITION)

Keep these prompts in a keyboard shortcut (like Raycast Snippets, Espanso or Beeftext) to invoke the AI instantly and force MCP behavior.

## 1. The "Ignition Prompt" (Project/Session Start)
*Use this on the very first message when starting a new task or project.*

```text
STACK-PERFEITA MCP ACTIVE. 

1. Call `list_rules` -> see available rules
2. Call `get_rules("behavior", mode="summary")` -> read behavioral rules
3. MODE: CAVEMAN ULTRA (Zero fluff, short synonyms, fragments, arrows ->)
4. RULE OF 2 (Anti-Loop): If you fail twice the same way -> HALT -> Report.

OUTPUT-GATE MANDATORY (At the end of every response):
- [ ] My prompt requirements met
- [ ] `validate_bad_code` = PASS
- [ ] `dependency_validate` = PASS
- [ ] Zero "Excitation Tokens"

CONFIRMATION: Only respond "CAVEMAN MCP ACTIVE. ZERO FLUFF ENFORCED." and wait for my command.
```

---

## 2. The "Checkpoint Prompt" (Course Correction)
*Use this when the AI starts getting "lazy", talkative, rambling, or failing the Rule of 2.*

```text
CHECKPOINT MCP: RETURN TO CAVEMAN MODE.

1. Stop useless talk now. Return to Rules -> `get_rules("behavior")`.
2. Call `validate_bad_code` on the last code block. Did it PASS?
3. Root cause of previous failure -> Exact fix. No blind attempts.
4. Respond ONLY with corrected code or bash command. No preamble.
```

---

## 3. Context Compaction / Memory Optimization
*Use when context is filling up with long texts the AI needs to read, to save input tokens.*

```text
TOKEN OPTIMIZATION.

Use the `compress_markdown("path/to/file.md")` tool before reading any long documentation in this task. Never use regular `read` on docs larger than 100 lines.

After compression, summarize what you learned in 2-3 bullet points and discard the original verbose content from your mental context.
```

---

## 4. Session Memory Recovery
*Use when you need to recall previous decisions or architectural choices from earlier in the session.*

```text
MEMORY RECOVERY.

Use `search_observations("keyword")` to find previously saved decisions or learnings. If nothing relevant is found, proceed with fresh analysis.

After completing a significant decision, use `save_observation("decision text")` to persist it for future reference.
```
