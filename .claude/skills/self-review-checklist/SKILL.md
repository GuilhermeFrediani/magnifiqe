---
name: self-review-checklist
description: Execute um checklist rigoroso de auto-revisão ANTES de considerar que uma tarefa de código (nova feature ou correção de bug) está pronta. Use para garantir que todas as regras de projeto foram aplicadas.
compatibility: claude-code, opencode
---

# Checklist de Auto-Revisão (Self-Review)

> **META:** Nenhuma IA está isenta de cometer erros, esquecer imports ou introduzir débitos técnicos. Você é obrigado a rodar este checklist mental (ou fisicamente, gerando um pequeno relatório de texto) antes de declarar "Feito".

## 1. Verificação de Código e Arquitetura
- [ ] Eu li o `00-project-overview.md` e garanti que a linguagem e o framework estão 100% corretos para o domínio atual?
- [ ] Minha alteração obedece a Regra da Fundação Podre (`09-bad-patterns-halt.md`) ou eu simplesmente codifiquei por cima de algo ruim?
- [ ] O código adota o Estilo Caveman (`02-coding-standards.md`)? Evitei criar abstrações geniais, regex difíceis e tipagem `any` preguiçosa?

## 2. Validação Técnica Obrigatória
- [ ] Eu executei a ferramenta `build-test-verify` para checar sintaxe, linter e testes? (Se não, rode agora).
- [ ] Eu verifiquei manualmente (lendo o arquivo com `read`) se o meu `edit` / `write` não deletou acidentalmente outras partes do código ao redor?
- [ ] Tratei todos os casos de borda e erros possíveis (try/catch seguro)?

## 3. Segurança e Performance
- [ ] Eu criei senhas, tokens, conexões de DB ou URIs expostas diretamente no código em texto claro? (Se sim, reverta e use `.env`).
- [ ] Se eu alterei o banco de dados, eu usei transações, evitei vazamento de logs e me preveni de N+1 queries?
- [ ] Se eu alterei o Frontend, eu usei tags HTML Semânticas corretas e evitei `<div>` soup?
- [ ] Este código está pronto para ir para produção hoje?

Se alguma destas respostas for "Não", volte ao código e corrija silenciosamente antes de responder ao humano. Se todas forem "Sim", resuma em 2 linhas o que foi validado e declare a tarefa pronta.
