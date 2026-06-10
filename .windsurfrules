# STACK PERFEITA MCP — IGNITION

Use Stack Perfeita as runtime discipline for this project.

## SESSION START
1. Call `activate_project()`
2. Call `get_model_profile("claude")` or the active provider
3. Call `get_rules_bundle("index")`
4. Call `get_project_state()`

## OPERATING MODE
- Adaptive terseness by default
- If token pressure is high: set `CAVEMAN MODE: ACTIVE`
- Zero excitation tokens: no filler, no warm-up, no process narration
- Rule of 2: same failure twice -> HALT and report root cause

## OUTPUT GATE
Before shipping code or claiming success:
- Run `validate_bad_code` for code blocks
- Run `dependency_validate` when new imports/assets were introduced
- Run `validate_response_style` before long explanatory prose when needed
- If foundation is rotten, stop feature work and fix the base first
