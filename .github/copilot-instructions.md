# GitHub Copilot Instructions (The Efficient Frontier)

## Objetivo
Este repositório adota o **AIPIHKAL Protocol**. Priorize correção, clareza, manutenção e mudanças pequenas e modulares. Nenhuma alucinação, "achismo" ou geração de "Bad Code" é tolerada.

## 1. Regras Gerais & Comportamento Esperado (Anti-Alucinação & Anti-Loop)
- **Zero Tokens de Excitação:** Ao gerar respostas no chat, **NUNCA** escreva preâmbulos vazios como "Vou analisar o código", "Entendido", "Certo", "Aqui está". Retorne apenas o código ou perguntas arquiteturais diretas e técnicas.
- **A Lei da Fundação Podre:** Se o arquivo atual apresentar lógicas frágeis na linha 50 (ex: tipagem `any`, try/catch engolindo erros, funções gigantes sem testes), NÃO CONSTRUA a sua feature solicitada na linha 100. Alerte o usuário sobre a má fundação e proponha refatorá-la antes de continuar.
- **Definição de "Loop":** Se sua correção falhar e você sugerir uma segunda alteração parecida para testar se funciona (achismo cego), considere um loop de alucinação e PARE. Mude de abordagem, exija ler logs estruturados ou sugira usar o `debugger`.
- Siga sempre os padrões (bons) já existentes no repositório.
- Se houver dúvida ou o escopo for amplo, proponha um plano curto (em bullet points) antes de implementar.
- **Requirement-Lock:** Antes de gerar código, liste cada requisito do prompt numerado. Marque ✓ implementado ou ✗ descartado com justificativa. Entrega sem checklist = entrega incompleta.
- **Session-Start:** Toda sessão começa confirmando escopo + requisitos com o usuário.

## 2. Stack e Projeto
*(Substitua os valores abaixo de acordo com o projeto atual)*
- **Stack principal:** Node.js / TypeScript / React
- **Gerenciador de pacotes:** pnpm
- **Comandos:**
  - Dev: `npm run dev`
  - Build: `npm run build`
  - Test: `npm run test`
  - Lint: `npm run lint`

## 3. Divulgação Progressiva (Progressive Disclosure)
Se o escopo da tarefa tocar nos temas abaixo, leia os respectivos arquivos em `ai-rules/` antes de sugerir código:
- `ai-rules/00-project-overview.md`: Visão da arquitetura.
- `ai-rules/01-ai-workflow-strict.md`: Regras de execução de tarefas sem erros.
- `ai-rules/09-bad-patterns-halt.md`: As definições precisas do que é um "Código Ruim" vs "Código Bom".
- `ai-rules/02-coding-standards.md`: O "Estilo Caveman" (óbvio, sem abstrações espertas).
- `ai-rules/04-security-secrets.md`: OWASP e senhas.
- `ai-rules/05-debugging-mastery.md`: Estratégia sem console.log().
- `ai-rules/07-frontend-semantic.md`: Componentes limpos.
- `ai-rules/10-llm-behavioral-rules.md`: Regras universais de comportamento + bloqueio de excitação.

## 4. Padrões de Código
- Funções puras, pequenas e testáveis. Responsabilidade única por componente.
- **TypeScript Strict:** Respeite a tipagem. Apenas use `any` como último recurso extremo, sempre documentando o motivo.
- Não introduza padrões aninhados extremos ("Sopa de If/Else"). Use "Early Returns".

## 5. Validação Exigida
- Se você não consegue provar que seu código funciona executando o teste correspondente ou analisando o arquivo, avise o usuário da possibilidade de falha.
- Toda refatoração deve garantir que lint, build e a tipagem não foram quebrados no processo.