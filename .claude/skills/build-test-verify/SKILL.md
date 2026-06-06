---
name: build-test-verify
description: Execute comandos de lint, typecheck e testes. Use esta skill SEMPRE APÓS finalizar uma modificação ou refatoração para garantir que nada foi quebrado.
compatibility: claude-code, opencode
---

# Verificação de Build e Testes (Build-Test-Verify)

Você acabou de modificar um arquivo? PARE TUDO e valide.
A execução dos comandos abaixo é **obrigatória** antes de dizer ao humano que o trabalho está pronto.

## 1. Regras de Execução de Comandos
- NUNCA assuma qual é o comando do repositório. Leia o `package.json`, `Makefile` ou `README.md` primeiro se não souber.
- Sempre rode o Linter (`npm run lint`, `eslint`, `ruff check .`).
- Sempre rode o Typecheck (ex: `tsc --noEmit`, `mypy`).
- Sempre rode a suíte de testes unitários ou o teste específico do arquivo alterado (ex: `jest arquivo.test.ts`).

## 2. Tratamento de Falhas (Anti-Loop)
- Se o Linter/Teste falhar com um erro, **pare e leia o erro (apenas as últimas 50 linhas)**. 
- Tente consertar o erro apenas UMA vez de forma consciente.
- Se o mesmo erro ocorrer pela **segunda vez consecutiva**, ative o Protocolo de Intervenção Humana: pare de modificar o arquivo e explique ao usuário o motivo da falha dupla.

## 3. Resumo de Progresso e Validação Caveman
Após a validação ser bem sucedida, faça um resumo de 2 a 3 linhas informando os próximos passos que restam na tarefa e garanta que você atendeu ao `00-project-overview.md`.
