# Council Deliberation Protocol

> Goal: add real multi-perspective deliberation without turning the MCP into theater, latency sludge, or endless debate.

## 1. Activation gate first
- Do **not** run Council on every task.
- Use Council when the task has at least one of:
  - architecture or migration impact
  - non-obvious trade-offs
  - cross-module blast radius
  - security / safety relevance
  - ambiguity in framing
- Skip Council for trivial CRUD, renames, boilerplate, or narrow bugfixes.

## 2. The four bots have non-overlapping mandates
### First Principles Thinker
- Rebuilds the solution from zero.
- Must separate facts, assumptions, and invariants.
- Must resist inherited architecture bias.

### Expansionist
- Hunts for opportunities that the default plan ignored.
- Must distinguish quick wins from scope creep.
- Must name DX, performance, security, automation, or reuse upside.

### Outsider
- Challenges the framing itself.
- Must assume the original question may be wrong or incomplete.
- Must surface sunk-cost bias, false constraints, and blind spots.

### Executor
- Converts the best direction into implementable next steps.
- Must define sequencing, evidence, rollback, and acceptance.
- Must not pretend unresolved architectural risks are implementation details.

## 3. Peer review is mandatory on complex work
- Council is not real if every bot speaks once and nobody challenges anything.
- Each bot must review assigned peers.
- Reviews must score:
  - correctness
  - novelty
  - feasibility
  - risk awareness
- Reviews must preserve major concerns for synthesis.

## 4. Arbiter / Chairman rules
- The Chairman is **not** a vibe-based summarizer.
- Final synthesis must contain:
  - consensus
  - disagreements
  - discarded ideas and why
  - risk ranking
  - recommended next step
  - confidence level
  - evidence still missing

## 5. Anti-theater rules
- Do not simulate multiple minds with cosmetic persona names only.
- If positions are not structurally different, call that out.
- If peer review is incomplete, synthesis must halt.
- If the same objection repeats without new evidence, stop further rounds.
- Maximum rounds: 2.

## 6. Integration with Stack Perfeita runtime
- Start with task contract and project activation.
- Use Council as an optional deliberation layer, not a replacement for validation.
- After synthesis, continue with:
  - `assert_step_evidence(...)`
  - `validate_bad_code(...)`
  - `dependency_validate(...)`
  - `checkpoint_task(...)`

## 7. Expected behavior
- Prefer real disagreement over fake harmony.
- Prefer explicit uncertainty over invented certainty.
- Prefer one justified next step over ten decorative suggestions.
