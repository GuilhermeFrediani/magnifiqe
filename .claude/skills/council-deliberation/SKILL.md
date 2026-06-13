---
name: council-deliberation
description: Execute uma deliberação real com 4 bots, revisão cruzada e síntese auditável. Use quando a tarefa tiver alto impacto, trade-offs ou risco de framing ruim.
compatibility: claude-code, opencode
---

# Council Deliberation

## Quando usar
- arquitetura
- refactor grande
- migração
- decisões com trade-off forte
- tarefas multi-módulo
- quando há risco de a primeira resposta parecer boa mas estar mal enquadrada

## Quando NÃO usar
- bug simples
- CRUD curto
- rename
- boilerplate
- tarefas mecânicas locais

## Sequência obrigatória
1. Rode `council_gate(...)`
2. Se a recomendação for `standard` ou `full`, rode `start_council_session(...)`
3. Preencha as quatro posições com `record_council_position(...)`
4. Execute todas as revisões da fila com `record_council_review(...)`
5. Só então rode `synthesize_council(...)`

## Regras duras
- Não invente consenso.
- Não resuma antes da revisão cruzada.
- Não faça “personas decorativas” com respostas equivalentes.
- Se a síntese apontar conflito importante, preserve o conflito.
- O Executor não pode mascarar risco estrutural como se fosse detalhe de implementação.

## Saída mínima esperada
- consenso
- divergências
- ideias descartadas
- ranking de risco
- próximo passo recomendado
- nível de confiança
