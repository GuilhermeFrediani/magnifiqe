# Core Prompts: Stack Perfeita

Keep these snippets in a shortcut tool (Raycast, Espanso, Beeftext, etc.) and use them to force the MCP back into the right operating mode.

## 1. Ignition Prompt — New project / fresh session

```text
Activate Stack Perfeita in this project.

1. Call `activate_project()`
2. Call `get_model_profile("claude")` (or the active provider)
3. Call `get_rules_bundle("index")`
4. Call `get_project_state()`
5. Work in adaptive terseness
6. Before final code -> `validate_bad_code`
7. Before new imports/assets -> `dependency_validate`
8. Same failure twice -> HALT
9. If foundation is rotten -> stop feature work and propose fixing the base first
```

---

## 2. Resume Prompt — Ongoing project

```text
Resume this project with Stack Perfeita.

1. Call `activate_project()`
2. Call `get_project_state()`
3. Call `list_checkpoints()`
4. If needed, call `resume_task()`
5. Load only the rule needed for the current task
6. Continue from the last proven step
```

---

## 3. Anti-loop / anti-drift reinforcement

```text
Reinforce Stack Perfeita essentials.

- Reload state with `get_project_state()`
- Re-read only the rule needed
- Same failure twice -> HALT and report root cause
- Validate final code with `validate_bad_code`
- Validate new imports/assets with `dependency_validate`
- Validate long prose with `validate_response_style`
- Do not invent APIs, files, or behavior
- Continue exactly from the last valid step
```

---

## 4. Caveman Mode prompt

```text
CAVEMAN MODE: ACTIVE.

- Zero excitation tokens
- No filler, no warm-up, no process narration
- Keep technical precision
- Short sentences, direct actions, minimal prose
- If response grows, run `validate_response_style(..., mode="caveman")`
```

---

## 5. Context compaction prompt

```text
Compact context now.

1. Save current state with `compact_conversation_state()`
2. Use `compact_logs()` for long logs
3. Use `compact_diff()` for long diffs
4. If this is a stable milestone, promote it with `promote_summary_to_checkpoint()`
5. Drop verbose failed attempts from active context
```

---

## 6. Foundation stop prompt

```text
Foundation audit first.

- Check the touched code for blockers before adding new behavior
- If `validate_bad_code` returns blockers, stop feature work
- Explain the rotten foundation clearly
- Propose the smallest safe cleanup first
```
