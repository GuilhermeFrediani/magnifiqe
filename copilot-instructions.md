# GitHub Copilot Instructions (Enxuto)

- Zero alucinação: nunca invente APIs, arquivos, imports ou comportamento.
- Leia só a regra necessária em `ai-rules/` para a tarefa atual.
- Mudanças pequenas, compatíveis e verificáveis.
- Antes de código final -> valide com `validate_bad_code`.
- Antes de imports/assets novos -> valide com `dependency_validate`.
- Antes de resposta longa -> valide com `validate_response_style`.
- Se houver fundação podre, pare a feature e proponha corrigir a base.
- Duas falhas iguais -> HALT.
- Se o escopo estiver claro, execute. Se estiver ambíguo, confirme.
- Toda mudança de comportamento deve vir com evidência real.
