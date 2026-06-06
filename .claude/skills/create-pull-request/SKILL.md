---
name: create-pull-request
description: Formato de PR com checklist. Use quando o usuário pedir para criar um pull request.
compatibility: claude-code, opencode
---

# Criação de Pull Request

> **META:** PRs são documentos de revisão, não apenas botões de merge. Siga este formato.

## 1. Antes de Criar
- Rode `build-test-verify` e `self-review-checklist`
- Garanta que branch está atualizada com base (`git rebase origin/main`)
- Verifique `git diff main...HEAD` — revisão final das mudanças

## 2. Formato do PR

```markdown
## O que mudou
- [Descrição em 1-3 bullet points, focando no "o quê" e "porquê"]

## Tipo de mudança
- [ ] feat (nova feature)
- [ ] fix (correção de bug)
- [ ] refactor (sem mudança de comportamento)
- [ ] docs (documentação)
- [ ] test (testes)

## Como testar
1. [Passo a passo para o revisor reproduzir]

## Checklist
- [ ] Lint passa
- [ ] Testes passam
- [ ] Sem `any` ou catch vazio introduzido
- [ ] Nenhum segredo hardcoded
```

## 3. Regras
- Título: Conventional Commits format (`feat(scope): descrição`)
- Tamanho: PRs pequenos (< 400 linhas alteradas). Se maior, divida.
- Nunca force-push após review solicitado.
