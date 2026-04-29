# AIPIHKAL Protocolo: O Verdadeiro e Estrito Fluxo de Trabalho (Anti-Alucinação)

> **META:** Este arquivo define as regras fundamentais de comportamento, execução de ferramentas e mitigação de alucinação para qualquer LLM operando neste projeto. **Sob nenhuma circunstância** as diretrizes abaixo podem ser ignoradas.

---

## 1. A Regra de 2 (Anti-Loop e Anti-Delírio)
- **O Fim do Tentativa e Erro:** Você está proibido de entrar em loop adivinhando código.
- **Como funciona:** Se você gerar um código, rodar um teste ou script e ele **falhar**, você tem direito a **uma (1) única tentativa de correção** analisando a causa-raiz.
- **Se a tentativa 2 falhar:** Pare de codificar imediatamente (HALT). Devolva a resposta ao humano dizendo: `"🚨 LOOP DETECTADO. Intervenção manual necessária. Falha em X e Y."`.
- **NUNCA** tente uma terceira correção às cegas.

## 2. Regras Anti-Alucinação (Grounded Reality)
- **Exija Contexto Total:** Nunca presuma a existência de arquivos, pastas, bibliotecas ou variáveis.
- **NUNCA tente codar no escuro:** É proibido adivinhar nomes de métodos de uma biblioteca. Consulte a documentação, os testes existentes ou use a tool `dependency_validate` e `smart_read` / `smart_outline`.
- **Prova Obrigatória:** Imediatamente após modificar um arquivo (`write` / `edit`), você **DEVE** rodar uma verificação (Linter, Compilador ou ler o arquivo alterado) para provar que funcionou. Nunca afirme "modifiquei o arquivo" sem a prova de leitura na sequência.

## 3. Gestão de Tarefas (Zero Loop)
- **One Step at a Time:** Resolva estritamente um item de cada vez.
- O humano é o **Árbitro Final de Estado**. Em caso de desastre (ex: quebrar dependências no bash), avise imediatamente e peça que o usuário execute `git status`.

## 4. O Output-Gate OBRIGATÓRIO (Verification Gate)
Antes de entregar qualquer resposta final:

1. Liste os requisitos do prompt.
2. Marque cada um: ✓ implementado | ✗ omitido + motivo.
3. Garanta que ferramentas de checagem rodaram sem erro (`validate_bad_code` e `dependency_validate`).

| Claim | Requer | Insuficiente (Alucinação) |
|-------|--------|-------------|
| "Testes passam" | Output do teste: 0 falhas | "A lógica parece correta" |
| "Build funciona" | Build command: exit 0 | "Linter passou" |
| "Bug corrigido" | Teste do sintoma: passa | "Alterei a variável" |

Sem OUTPUT-GATE preenchido, você falhou no sistema.
