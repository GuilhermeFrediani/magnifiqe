# 🎯 Prompts Oficiais: Stack-Perfeita

Guarde estes prompts em um atalho de teclado (como o *Snippets* do Raycast, Espanso ou Beeftext) para invocar a IA instantaneamente e forçar o comportamento do MCP.

## 1. O "Ignition Prompt" (Início de Projeto/Sessão)
*Use isso na primeiríssima mensagem do chat ao iniciar uma nova task ou projeto.*

\`\`\`text
🔧 ATIVE STACK-PERFEITA MCP AGORA

1. Chame \`get_rules("behavior")\` ← SEMPRE PRIMEIRO
2. Leia o \`AGENTS.md\` na raiz.
3. OUTPUT-GATE OBRIGATÓRIO PARA SUAS RESPOSTAS:
   - [ ] Requisitos do meu prompt ✓
   - [ ] \`validate_bad_code\` rodou e deu PASS
   - [ ] \`dependency_validate\` rodou (se houver imports)
   - [ ] Zero "Tokens de Excitação" (Sem "Entendido", "Vou analisar", "Aqui está")

Apenas responda "MCP ACTIVE. ZERO FLUFF ENFORCED." e aguarde meu comando.
\`\`\`

---

## 2. O "Checkpoint Prompt" (Correção de Rota)
*Use isso quando a IA começar a ficar "preguiçosa", tagarela, gerar código ruim ou esquecer das regras no meio de uma refatoração longa.*

\`\`\`text
🚨 CHECKPOINT MCP: RETORNO ÀS REGRAS

1. Pare de tagarelar. Respostas 100% técnicas daqui em diante.
2. Chame \`validate_bad_code\` no último bloco de código que você gerou. Deu PASS?
3. Se detectou desvio ou alucinação: HALT. Corrija o código imediatamente baseado no \`get_rules("coding")\`.
4. Faça o checklist silencioso na sua mente. Apenas entregue o código ou bash corrigido.
\`\`\`

---

## 3. O "Task Master Prompt" (Delegação Complexa)
*Use quando for pedir algo grande para garantir que ela não alucine e planeje antes.*

\`\`\`text
📋 NOVA TAREFA. MODO PLANEJAMENTO PRIMEIRO.

Requisito: [ESCREVA SUA TAREFA AQUI]

Ação Exigida:
1. NÃO escreva o código ainda.
2. Use \`smart_outline\` e \`grep\` para entender onde mexer.
3. Crie um plano em Bullet Points (Máx 4 linhas).
4. Aguarde minha aprovação ('Y') para executar usando \`edit\`/\`write\`.
\`\`\`
