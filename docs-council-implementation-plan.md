# Council Implementation Plan

## Objetivo
Adicionar uma camada de deliberação real ao Stack Perfeita MCP sem transformar o sistema em teatro de personas, mantendo o core atual modular e auditável.

## Princípios
1. **Cirúrgico** — módulo novo, sem reescrever o core.
2. **Opcional** — Council não roda em toda tarefa.
3. **Auditável** — posições e revisões ficam persistidas.
4. **Determinístico** — síntese computa scorecards e consenso estrutural.
5. **Anti-loop** — no máximo 2 rodadas.

## Arquitetura
- `src/council.js`
  - gate heurístico
  - criação de sessão persistida
  - submissão de posições
  - revisão cruzada
  - síntese determinística
- `.claude/council_state.json`
  - persistência das sessões
- `ai-rules/12-council-deliberation.md`
  - protocolo operacional
- `.claude/skills/council-deliberation/SKILL.md`
  - playbook de uso

## Fluxo
1. `council_gate(...)`
2. `start_council_session(...)`
3. `record_council_position(...)` x4
4. `record_council_review(...)` xN
5. `synthesize_council(...)`
6. continuar com `assert_step_evidence`, validadores e checkpoint

## Testes necessários
- gate recomenda `full` em cenário complexo
- persistência de sessão em disco
- síntese gera scorecard, consenso e próximo passo
- E2E stdio lista os novos tools

## Critério de pronto
- ferramentas registradas no MCP
- testes automatizados verdes
- documentação atualizada
- pacote exportável para download
