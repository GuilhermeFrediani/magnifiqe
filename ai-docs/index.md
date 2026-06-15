# AI Docs Index

## Recommended reading order
1. `README.md`
2. `ai-docs/compact-index.md`
3. `ai-rules/12-council-deliberation.md`
4. open only the needed files in `ai-docs/mirror/...`

## Largest files to treat carefully
- `src/council.js` — 947 lines
- `src/dependency-resolution.js` — 726 lines
- `src/code-reading.js` — 617 lines
- `src/project-state.js` — 338 lines
- `src/validators.js` — 338 lines
- `README.md` — 273 lines
- `src/profiles.js` — 236 lines
- `src/compaction.js` — 214 lines
- `src/activation.js` — 210 lines
- `test/validators.test.js` — 206 lines

## Repository groups
### .claude
- `.claude/skills/build-test-verify/SKILL.md` — Verificação de Build e Testes (Build-Test-Verify)
- `.claude/skills/core-conventions/SKILL.md` — Convenções de Código (Core Conventions)
- `.claude/skills/council-deliberation/SKILL.md` — Council Deliberation
- `.claude/skills/create-pull-request/SKILL.md` — Criação de Pull Request
- `.claude/skills/git-commit/SKILL.md` — Criação de Commits (Git-Commit)
- `.claude/skills/self-review-checklist/SKILL.md` — Checklist de Auto-Revisão (Self-Review)

### (root)
- `README.md` — [Stack Perfeita MCP](https://github.com/GuilhermeFrediani/magnifiqe)
- `PROMPTS.md` — Core Prompts: Stack Perfeita
- `package.json` — No inline summary detected
- `opencode.json` — No inline summary detected

### ai-rules
- `ai-rules/00-project-overview.md` — 00 - Project Overview & Stack Manifest (The Domain Map)
- `ai-rules/01-ai-workflow-strict.md` — AIPIHKAL Protocol: Strict Workflow for Real Tasks
- `ai-rules/02-coding-standards.md` — 02 - Coding Standards (O Estilo Caveman)
- `ai-rules/03-token-economy.md` — 03 - Token Economy & Context Management (2026)
- `ai-rules/04-security-secrets.md` — 04 - Segurança Moderna e OWASP (2025/2026)
- `ai-rules/05-debugging-mastery.md` — 05 - Debugging Mastery (Anti-Guesswork for JS/TS)
- `ai-rules/06-ci-cd-testing.md` — 06 - CI/CD Moderno: Pipeline como Produto (2026)
- `ai-rules/07-frontend-semantic.md` — 07 - Frontend Semântico e Acessibilidade (2026)
- `ai-rules/08-backend-architecture.md` — 08 - Arquitetura de Produção e Backend Semântico (2026)
- `ai-rules/09-bad-patterns-halt.md` — 09 - Fundações Podres e Padrões Ruins (Halt no Bad Code)
- `ai-rules/10-llm-behavioral-rules.md` — 10 - Universal Behavioral Rules for LLMs
- `ai-rules/11-systematic-debugging.md` — 11 - Systematic Debugging (O Método de 4 Fases)
- `ai-rules/12-council-deliberation.md` — Council Deliberation Protocol
- `ai-rules/commands/code-analysis.md` — Code Analysis Command

### bin
- `bin/setup-ide.js` — stack-perfeita setup script Generates IDE configuration files and can bootstrap starter rules/skills. Usage: stack-perfeita                 # Generate IDE config files only stack-perfeita init            # Generate configs + starter ai-rules + starter skills stack-perfeita --bootstrap     # Same as init stack-perfeita --minimal       # Only .cursorrules stack-perfeita --force         # Overwrite existing files

### src
- `src/activation.js` — Stack Perfeita MCP — Project Activation activate_project MCP tool registration. Builds a complete project manifest: stack, rules, skills, state, fingerprint.
- `src/code-reading.js` — Stack Perfeita MCP — Code Reading tools smart_outline, smart_unfold, smart_read MCP tool registrations. Babel parser first, acorn-loose fallback, regex last.
- `src/commands.js` — Stack Perfeita MCP — Command tool run_command MCP tool registration.
- `src/compaction.js` — Stack Perfeita MCP — Compaction tools compact_conversation_state, compact_logs, compact_diff, promote_summary_to_checkpoint Semantic compaction for long sessions: preserve meaning, discard noise.
- `src/config.js` — Stack Perfeita MCP — Configuration All constants, topic maps, rule descriptions, response-style rules, and bad-code patterns.
- `src/council.js` — Stack Perfeita MCP — Council deliberation runtime Real multi-perspective workflow with persisted sessions, peer review, and deterministic synthesis.
- `src/dependency-resolution.js` — Stack Perfeita MCP — Dependency resolution helpers Monorepo/workspace-aware import and asset validation.
- `src/helpers.js` — Stack Perfeita MCP — Helper utilities File reading, path safety, token minification, rule file listing.
- `src/index.js` — stack-perfeita-mcp v4.5.0 MCP server that exposes project AI rules as tools for any IDE/agent. Architecture: Modular — each tool category lives in its own file under src/. This file is the entry point: it wires everything together and starts the server. Usage: node src/index.js --rules-dir /path/to/ai-rules
- `src/memory.js` — Stack Perfeita MCP — Memory tools save_observation, search_observations. Uses JSON file persistence with simple dedupe + trimming.
- `src/profiles.js` — Stack Perfeita MCP — Model Profiles get_model_profile MCP tool registration. Adapts behavior by provider family and operational capability profile.
- `src/project-state.js` — Stack Perfeita MCP — Project State tools get_project_state, save_project_state, checkpoint_task, list_checkpoints, resume_task
- `src/rate-limiter.js` — Stack Perfeita MCP — Rate Limiter Prevents tool call loops by enforcing a max-calls-per-window policy.
- `src/resources.js` — Stack Perfeita MCP — MCP Resource registrations Exposes ai-rules/*.md as MCP resources for discovery and reading.
- `src/roles.js` — Stack Perfeita MCP — Role activation activate_role MCP tool registration. Applies role-specific scaffolding adapted by model capability profile.
- `src/rules.js` — Stack Perfeita MCP — Rules tools list_rules, get_rules, get_context MCP tool registrations.
- `src/skills.js` — Stack Perfeita MCP — Skills tools list_skills and get_skill MCP tool registrations.
- `src/state-compaction.js` — Stack Perfeita MCP — Automatic project state compaction Predictable trimming when state grows beyond configured thresholds.
- `src/task-runtime.js` — Stack Perfeita MCP — Task runtime start_task_contract and assert_step_evidence MCP tool registrations.
- `src/validators.js` — Stack Perfeita MCP — Validator tools validate_bad_code, validate_response_style, validate_git_commit, dependency_validate.

### test
- `test/activation.test.js` — Test suite for src/activation.js Tests: module loads, registerActivationTools is a function
- `test/code-reading-phase2.test.js` — No inline summary detected
- `test/code-reading.test.js` — Test suite for src/code-reading.js Tests: extractSymbols, getFileLang
- `test/compaction.test.js` — Test suite for src/compaction.js Tests: extractErrorsFromLogs, summarizeDiff
- `test/config.test.js` — Test suite for src/config.js Tests: TOPIC_MAP coverage, RULE_DESCRIPTIONS keys, BAD_PATTERNS structure
- `test/council.test.js` — No inline summary detected
- `test/dependency-resolution.test.js` — No inline summary detected
- `test/e2e-stdio.test.js` — No inline summary detected
- `test/helpers.test.js` — Test suite for src/helpers.js
- `test/memory.test.js` — Test suite for src/memory.js Tests: memory file I/O, observation format, search logic
- `test/profiles.test.js` — Test suite for src/profiles.js
- `test/project-state.test.js` — Test suite for src/project-state.js using the real implementation.
- `test/rate-limiter.test.js` — Test suite for src/rate-limiter.js Tests: rate limit check, window reset
- `test/roles.test.js` — No inline summary detected
- `test/skills.test.js` — Test suite for src/skills.js Tests: skill file structure, frontmatter parsing logic
- `test/state-compaction.test.js` — No inline summary detected
- `test/task-runtime.test.js` — No inline summary detected
- `test/validators.test.js` — Test suite for validator internals
