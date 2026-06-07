# Project Agent Guide (Stack Perfeita MCP)

Use este arquivo como contexto de integração para sessões neste repositório.

## 1. Por que
Este projeto busca máxima precisão técnica, sem alucinações, com código modular, seguro, testado e econômico em tokens.

## 2. O que
- `ai-rules/` — Regras profundas de arquitetura, fluxo, segurança, debugging e comportamento.
- `.claude/skills/` — Playbooks reutilizáveis para tarefas operacionais.
- `src/` — Código do MCP server, organizado por responsabilidade.

## 3. Como
- **Zero tokens de excitação:** sem preâmbulo vazio, sem “vou analisar”, sem aquecimento verbal.
- **Fundação Podre:** se a base estiver ruim, pare a feature e proponha corrigir a base antes.
- **Rule of 2:** se falhar duas vezes pelo mesmo motivo, pare e reporte a causa raiz.
- **Provas reais:** não declare sucesso sem teste, leitura do arquivo alterado, build, lint ou outra evidência concreta.
- **Requirement lock:** antes de entregar, confira requisitos atendidos e pendências reais.
- **State-aware:** use `activate_project()`, `get_project_state()`, `checkpoint_task()` e `list_checkpoints()` em tarefas longas.
- **Caveman mode:** pode ser ativado explicitamente quando pressão de tokens estiver alta, mas sem perder precisão técnica.

## 4. Divulgação progressiva
Não carregue tudo de uma vez. Leia apenas a regra necessária para a tarefa atual:
- Segurança -> `ai-rules/04-security-secrets.md`
- Debugging -> `ai-rules/05-debugging-mastery.md`
- Frontend -> `ai-rules/07-frontend-semantic.md`
- CI/CD e testes -> `ai-rules/06-ci-cd-testing.md`
- Fundação podre -> `ai-rules/09-bad-patterns-halt.md`
- Estilo de código -> `ai-rules/02-coding-standards.md`
- Economia de tokens -> `ai-rules/03-token-economy.md`
- Comportamento LLM -> `ai-rules/10-llm-behavioral-rules.md`
- Debugging sistemático -> `ai-rules/11-systematic-debugging.md`

Use *skills* para fluxo operacional quando fizer sentido:
- `build-test-verify`
- `create-pull-request`
- `core-conventions`
- `git-commit`
- `self-review-checklist`

## 5. Regra prática de sessão
- Se o escopo estiver claro -> execute.
- Se estiver ambíguo, arriscado ou irreversível -> confirme.
- Antes de código final -> `validate_bad_code`.
- Antes de explicação longa -> `validate_response_style`.
- Antes de retomar trabalho antigo -> `list_checkpoints()` e, se necessário, `resume_task()`.
