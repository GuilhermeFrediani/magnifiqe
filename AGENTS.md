# Project Agent Guide (AIPIHKAL & EFFICIENT FRONTIER)

Use este arquivo como o contexto de integração padrão para todas as sessões do OpenCode / Claude Code neste repositório.

## 1. Por que (Why)
Este projeto exige o mais alto rigor técnico e zero tolerância a alucinações (delírios) e Tokens de Excitação de IAs. Nosso objetivo é código modular, seguro, fundamentado em testes práticos, tipos estritos e máxima economia de tokens (Sem enchimento).

## 2. O que (Project Map)
- `ai-rules/` -> Manuais profundos de arquitetura, segurança e fluxo (Carregados sob demanda).
- `.claude/skills/` -> Playbooks de tarefas específicas (Carregados quando a tarefa corresponder).

## 3. Como (Sempre Aplicar - The Core Loop)
- **Bloqueio de Tokens Inúteis:** NUNCA inicie respostas com "Humm, deixa eu pensar", "Entendido", "Vou analisar", "Aqui está". Seja estoico. Retorne apenas o código, o comando bash ou perguntas técnicas cruas e diretas.
- **Não Construa Sobre Fundações Podres (Bad Code):** Nunca aceite escrever na linha 100 de um arquivo, se você detectar lógica frágil (God Classes, Try/Catches mudos, tipagem `any`) na linha 50. Pare, avise o humano, e proponha corrigir a fundação primeiro (leia `ai-rules/09-bad-patterns-halt.md`).
- **Modo PLAN antes do BUILD:** Antes de gerar lógicas complexas, proponha um plano em bullet points e aguarde aprovação.
- **Decomposição e Combate ao Loop:** Quebre tarefas longas. Se uma tentativa de código ou bash falhar duas vezes com o mesmo erro, ative a regra Anti-Loop: Pare de codificar imediatamente e peça intervenção humana. Não tente adivinhar.
- **Sem Achismos:** Nunca tente corrigir código usando `console.log("aqui")`. Use logs estruturados ou um `debugger;` de verdade (leia `ai-rules/05-debugging-mastery.md`).
- **Provas Reais:** Sempre valide modificações rodando um linter local, typecheck ou lendo (`read`) o arquivo final modificado para atestar que o `edit` ocorreu de verdade.
- **Citações:** Ao propor um padrão, mencione qual arquivo do projeto o inspirou.

## 4. Divulgação Progressiva (Progressive Disclosure)
NÃO carregue todas as regras de uma vez. Para economizar sua janela de contexto:
Leia os guias em `ai-rules/` usando a ferramenta `read` apenas quando o contexto atual exigir:
- **Segurança/Senhas:** `ai-rules/04-security-secrets.md`
- **Debugging JS/TS:** `ai-rules/05-debugging-mastery.md`
- **Frontend Semântico:** `ai-rules/07-frontend-semantic.md`
- **CI/CD e Testes:** `ai-rules/06-ci-cd-testing.md`
- **Fundações e Padrões Ruins:** `ai-rules/09-bad-patterns-halt.md`
- **Código Honesto:** `ai-rules/02-coding-standards.md`
- **Economia de Tokens:** `ai-rules/03-token-economy.md`

Use *Skills* (localizadas em `.claude/skills/`) para tarefas de fluxo:
- `build-test-verify`: Para testar ou lintar alterações.
- `create-pull-request`: Para formatar PRs.
- `core-conventions`: Para regras finas de estilo.

## 5. Branching
Use branches de feature. Nunca envie `push` diretamente para a `main`. Siga os padrões da skill `git-commit`.
