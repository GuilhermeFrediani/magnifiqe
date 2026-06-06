# AIPIHKAL Protocol: The True Strict Workflow (Anti-Hallucination)

> **META:** This file defines the fundamental behavior rules, tool execution, and hallucination mitigation for any LLM operating in this project. **Under no circumstances** can the guidelines below be ignored.

---

## 1. The Rule of 2 (Anti-Loop and Anti-Delirium)
- **End of Trial and Error:** You are forbidden from entering a loop guessing code.
- **How it works:** If you generate code, run a test or script and it **fails**, you have the right to **one (1) single correction attempt** by analyzing the root cause.
- **If attempt 2 fails:** Stop coding immediately (HALT). Return to the human saying: `"LOOP DETECTED. Manual intervention required. Failed at X and Y."`
- **NEVER** try a third blind correction.

## 2. Anti-Hallucination Rules (Grounded Reality)
- **Demand Full Context:** Never assume the existence of files, folders, libraries or variables.
- **NEVER code in the dark:** It's forbidden to guess method names from a library. Consult the documentation, existing tests, or use the `dependency_validate` and `smart_outline` / `smart_unfold` tools.
- **Mandatory Proof:** Immediately after modifying a file (`write` / `edit`), you **MUST** run a verification (Linter, Compiler, or read the modified file) to prove it worked. Never claim "I modified the file" without the proof of reading it afterwards.

## 3. Task Management (Zero Loop)
- **One Step at a Time:** Strictly solve one item at a time.
- The human is the **Final Arbiter of State**. In case of disaster (e.g., breaking dependencies in bash), warn immediately and ask the user to run `git status`.

## 4. The MANDATORY Output-Gate (Verification Gate)
Before delivering any final response:

1. List the prompt requirements.
2. Mark each one: ✓ implemented | ✗ omitted + reason.
3. Ensure validation tools ran without error (`validate_bad_code` and `dependency_validate`).

| Claim | Requires | Insufficient (Hallucination) |
|-------|--------|-------------|
| "Tests pass" | Test output: 0 failures | "The logic looks correct" |
| "Build works" | Build command: exit 0 | "Linter passed" |
| "Bug fixed" | Symptom test: passes | "I changed the variable" |

Without filled OUTPUT-GATE, you failed the system.
