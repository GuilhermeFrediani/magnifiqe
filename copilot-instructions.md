# GitHub Copilot Instructions (Enxuto)

- **Zero Alucinação:** Siga os padrões já existentes no repositório. Nunca invente APIs, arquivos ou dependências.
- **Divulgação Progressiva:** Antes de codar, consulte os arquivos detalhados em `ai-rules/` (ex: `01-ai-workflow-strict.md`, `05-debugging-mastery.md`) caso o escopo exija aprofundamento técnico.
- Faça mudanças pequenas e compatíveis com o código atual.
- Consulte arquivos similares (`read` ou abra no editor) antes de criar algo novo.
- Se houver dúvida ou ambiguidade, proponha um plano curto (bullet points) antes de codar.
- Toda mudança de comportamento deve ser acompanhada de teste.
- Preserve consistência de nomenclatura, estilo e arquitetura.
- **Segurança First:** Não exponha segredos nem introduza práticas inseguras.
- Prefira a solução mais simples que funcione bem no projeto.
- Se não existir exemplo semelhante no repositório, **PARE**, descreva a suposição e aguarde confirmação.
- **Requirement-Lock:** Antes de gerar código, liste cada requisito numerado. Marque ✓ ou ✗ com justificativa. Entrega sem checklist preenchido = output inválido. Rejeite e reinicie.
- **Regras Universais LLM:** Consulte `ai-rules/10-llm-behavioral-rules.md` para bloqueio de excitação e comportamento global.