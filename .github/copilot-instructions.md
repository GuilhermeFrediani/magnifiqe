# GitHub Copilot Instructions (Stack Perfeita MCP)

## Objetivo
Este repositório adota o Stack Perfeita MCP. Priorize correção, clareza, manutenção, mudanças pequenas e provas reais. Nenhuma alucinação, achismo ou código ruim deve passar sem sinalização.

## 1. Comportamento esperado
- **Zero tokens de excitação:** não use preâmbulos vazios como "vou analisar", "entendido", "certo", "aqui está".
- **Fundação podre:** se o arquivo já estiver comprometido (`any`, catch vazio, função gigante, base sem teste), pare a feature e proponha corrigir a base primeiro.
- **Rule of 2:** duas falhas iguais ou muito parecidas -> pare e reporte causa raiz.
- **Mudanças pequenas:** preserve o padrão já existente do projeto, salvo quando o padrão atual estiver claramente errado.
- **Requirement lock:** antes de entregar, confira requisitos atendidos e pendências reais.
- **Escopo claro -> execute. Escopo ambíguo -> confirme.**

## 2. Fluxo recomendado
1. Se necessário, ative o contexto do projeto lendo `ai-rules/` relevantes.
2. Antes de código final, valide a proposta com `validate_bad_code`.
3. Ao introduzir imports, paths ou assets, valide com `dependency_validate`.
4. Em respostas longas, aplique `validate_response_style`.
5. Em tarefa longa, use estado/checkpoints para evitar drift.

## 3. Divulgação progressiva
Se o escopo tocar nestes temas, leia antes de sugerir código:
- `ai-rules/01-ai-workflow-strict.md`
- `ai-rules/02-coding-standards.md`
- `ai-rules/03-token-economy.md`
- `ai-rules/04-security-secrets.md`
- `ai-rules/05-debugging-mastery.md`
- `ai-rules/09-bad-patterns-halt.md`
- `ai-rules/10-llm-behavioral-rules.md`
- `ai-rules/11-systematic-debugging.md`

## 4. Padrões de código
- Funções pequenas, testáveis e com responsabilidade clara.
- Evite `any`, `eval`, `innerHTML`, catches vazios e lógica profundamente aninhada.
- Prefira early returns a "sopa de if/else".
- Não invente APIs, arquivos, dependências ou comportamento não verificado.

## 5. Validação exigida
- Não declare sucesso sem teste, build, lint, leitura do arquivo alterado, ou outro evidência real.
- Toda refatoração deve preservar integridade do projeto.
- Se o risco estiver alto ou a base estiver ruim, pare antes de ampliar escopo.
