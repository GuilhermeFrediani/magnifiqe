---
name: core-conventions
description: Regras finas de estilo Caveman resumidas. Consulte quando houver dúvida sobre nomenclatura, estrutura ou padrão de código.
compatibility: claude-code, opencode
---

# Convenções de Código (Core Conventions)

> **META:** Resumo executivo do Estilo Caveman. Para detalhes, leia `ai-rules/02-coding-standards.md`.

## 1. Nomenclatura
- Variáveis: `userList`, `isActive`, `maxRetries` — nunca `data`, `flag`, `tmp`
- Funções: `calculateTax()`, `handleSubmit()` — nunca `process()`, `doStuff()`
- Constantes: `MAX_RETRIES`, `API_BASE_URL` — UPPER_SNAKE

## 2. Estrutura
- Early Return sempre. Happy path por último, sem `else`.
- `const` por padrão. `let` só em loops/acumuladores. `var` proibido.
- Try/catch específico. Catch vazio = HALT.

## 3. Tamanho
- Funções: ≤ 20 linhas. Se passar, dividir.
- Arquivos: ≤ 300 linhas. Se passar, modularizar.
- Parâmetros: ≤ 4. Se passar, usar objeto/DTO.

## 4. Proibido
- `any`, `as unknown`, `eval`, `innerHTML=`, `==` (usar `===`), `var`
- God Functions, arrow code, side effects ocultos
- Comentários que explicam COMO (código explica). Comente o PORQUÊ.
