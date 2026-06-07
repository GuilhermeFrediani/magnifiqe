# Project Agent Guide (Stack Perfeita MCP)

Use este arquivo como contexto de integração para sessões neste repositório.

## 1. Por que (Why)
Este projeto busca máxima precisão técnica, sem alucinações, com código modular, seguro, testado e econômico em tokens.

## 2. O que (Project Map)
- `ai-rules/` — Manuais de arquitetura, segurança e fluxo (carregados sob demanda via MCP tools).
- `.claude/skills/` — Playbooks de tarefas específicas (carregados quando a tarefa corresponder).
- `src/` — Código do MCP server (12 módulos, ~24 tools).

## 3. Como (Core Loop)
- **Economia de contexto:** Evite filler ("Humm", "Entendido", "Vou analisar"). Seja direto — código, comandos ou perguntas técnicas.
- **Não construa sobre fundação frágil:** Ao detectar lógica problemática (God Classes, catch vazio, `any`) antes de uma mudança, avise e proponha corrigir a base primeiro (veja `ai-rules/09-bad-patterns-halt.md`).
- **Modo PLAN:** Para lógicas complexas, proponha um plano antes de implementar.
- **Rule of 2 (Anti-Loop):** Se um comando ou teste falhar duas vezes com o mesmo erro, pare e reporte ao usuário. Não tente adivinhar.
- **Debugging estruturado:** Evite `console.log("aqui")` para debugging. Use logs estruturados ou `debugger;` (veja `ai-rules/05-debugging-mastery.md`).
- **Provas reais:** Valide modificações rodando linter, typecheck ou lendo o arquivo final para confirmar que a edição ocorreu.
- **Citações:** Ao propor um padrão, mencione qual arquivo do projeto o inspirou.
- **Requirement-Lock:** Antes de gerar código, liste requisitos. Confirme cada um antes de entregar.
- **State-aware:** Use `get_project_state()` e `checkpoint_task()` para manter contexto em sessões longas.

## 4. Divulgação Progressiva (Progressive Disclosure)
Não carregue todas as regras de uma vez. Leia guias em `ai-rules/` apenas quando o contexto exigir:
- **Segurança/Senhas:** `ai-rules/04-security-secrets.md`
- **Debugging JS/TS:** `ai-rules/05-debugging-mastery.md`
- **Frontend Semântico:** `ai-rules/07-frontend-semantic.md`
- **CI/CD e Testes:** `ai-rules/06-ci-cd-testing.md`
- **Fundações e Padrões Ruins:** `ai-rules/09-bad-patterns-halt.md`
- **Código Honesto:** `ai-rules/02-coding-standards.md`
- **Economia de Tokens:** `ai-rules/03-token-economy.md`
- **Regras Universais LLM:** `ai-rules/10-llm-behavioral-rules.md`
- **Debugging Sistemático:** `ai-rules/11-systematic-debugging.md`

Use *Skills* (`.claude/skills/`) para tarefas de fluxo:
- `build-test-verify`: Para testar ou lintar alterações.
- `create-pull-request`: Para formatar PRs.
- `core-conventions`: Para regras finas de estilo.
- `git-commit`: Para convenções de commit.
- `self-review-checklist`: Para revisão antes de submeter.

## 5. Branching
Use branches de feature. Evite push direto para a `main`. Siga os padrões da skill `git-commit`.
