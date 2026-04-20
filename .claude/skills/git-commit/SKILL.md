---
name: git-commit
description: Uma ferramenta automática para criação de commits rigorosos, semânticos, baseados no Conventional Commits e no fluxo Caveman. Use sempre que o usuário disser "faça um commit" ou "adicione as mudanças".
compatibility: claude-code, opencode
---

# Criação de Commits (Git-Commit)

> **META:** Nenhuma IA está isenta de cometer erros na geração de commits. É terminantemente proibido enviar um "Update arquivos" ou fazer commits gigantes com dezenas de mudanças soltas. Aja como um DevOps Sênior.

## 1. Verificação Antes do Commit
Antes de rodar `git add` ou `git commit`, garanta que você já executou a skill `build-test-verify` e o `self-review-checklist` para o código não ir quebrado. 
- Use a ferramenta bash: `git status` para ver o que será comitado.
- Use a ferramenta bash: `git diff` e veja todas as linhas alteradas.

## 2. Conventional Commits (A Regra de Formatação)
O seu commit **deve** usar este padrão exato:
`<tipo>(<escopo opcional>): <descrição curta no imperativo>`

Tipos permitidos:
- `feat`: Uma nova feature.
- `fix`: Uma correção de bug.
- `docs`: Atualizações de documentação.
- `style`: Formatação, ponto e vírgula, falta de espaços, etc.
- `refactor`: Refatoração (não conserta bug nem adiciona feature).
- `perf`: Mudança de código que melhora a performance.
- `test`: Adição ou correção de testes.
- `chore`: Atualização de pacotes, build, etc.

Exemplo Certo: `fix(auth): prevent stale closure on token refresh`
Exemplo Errado: `Updated auth.js to fix bug`

## 3. O Corpo do Commit (Body)
Se a alteração for complexa, adicione uma linha em branco após a descrição curta e crie um parágrafo longo detalhando o "Porquê" da mudança, e não o "Como".
- Se você fechou uma issue, inclua no final: `Closes #123`.

## 4. Proibição Suprema (Push e Main)
- **NUNCA** execute `git push --force`.
- **NUNCA** crie commits diretamente na branch `main` ou `master` sem autorização humana expressa. Sempre pergunte se o usuário deseja que você crie uma branch nova (`git checkout -b <tipo>/<nome-da-feature>`).
