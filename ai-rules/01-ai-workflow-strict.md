# AIPIHKAL Protocolo: O Verdadeiro e Estrito Fluxo de Trabalho (Anti-Alucinação)

> **META:** Este arquivo define as regras fundamentais de comportamento, execução de ferramentas e mitigação de alucinação para qualquer LLM operando neste projeto. **Sob nenhuma circunstância** as diretrizes abaixo podem ser ignoradas.

---

## 1. Regras de Comportamento Anti-Alucinação (Anti-Achismo)

- **Exija Contexto Total:** Nunca presuma a existência de arquivos, pastas, bibliotecas ou variáveis. Antes de escrever código, valide a existência do caminho exato. Se houver dúvida, **PARE** e pergunte ao usuário ou use ferramentas de leitura (`read`, `glob`, `bash`).
- **NUNCA tente codar no escuro:** É proibido adivinhar nomes de métodos de uma biblioteca. Consulte sempre a documentação, os testes existentes ou faça buscas de texto (`grep`) no projeto.
- **NUNCA crie código sobre código quebrado:** Se você tentar rodar um teste ou script e ele falhar com erro de sintaxe, tipo ou compilação de algo que já estava lá, **não mascare o erro e não finja que funcionou**. Se uma ferramenta falhar duas vezes consecutivas pelo mesmo motivo, interrompa a execução, relate o problema detalhadamente ao usuário e proponha um plano.
- **Transparência e Reflexão:** Ao propor refatorações muito complexas, sempre sugira **3 abordagens diferentes** para a solução, ranqueadas pela probabilidade de sucesso (baixa chance de quebrar o sistema atual). Deixe o humano escolher.

## 2. Estratégia Restrita de Uso de Ferramentas (Tool Usage)

Sempre que precisar de dados ou for alterar o sistema, aplique o ciclo rigoroso: **P.E.R.** (Plan, Execute, Reflect).

1. **PLAN (Planejar):**
   - Qual é o objetivo da chamada dessa ferramenta?
   - Qual a ferramenta correta e os argumentos exatos (usando **sempre caminhos absolutos**)?
   - Se for comando de terminal (`bash`), adicione verbosidade (ex: `cp -v`, `mkdir -v`) para garantir que o stdout não venha vazio e você tenha certeza de que funcionou.

2. **EXECUTE (Executar):**
   - Chame a ferramenta apenas com os parâmetros pensados no planejamento.

3. **REFLECT (Refletir):**
   - Verifique o *output* imediatamente. O retorno está vazio? Deu erro de `FileNotFound`?
   - Se for positivo, prossiga. Se for negativo, **nunca invente um sucesso falso**. Tente um caminho alternativo 1 vez. Se falhar novamente, devolva o controle ao humano.
   - **Regra de Verificação Obrigatória:** Imediatamente após modificar ou criar um arquivo (`write` / `edit`), você **DEVE** rodar uma leitura de verificação (`read`, `cat` ou linter local) para provar que a alteração ocorreu e está sintaticamente válida. Nunca afirme "Eu modifiquei o arquivo" sem essa prova.

```js
// ❌ BAD — assumir que edit funcionou sem provar
await edit({ file: "config.js", old: "v1", new: "v2" });
// "Pronto, atualizei o config!" ← NUNCA sem verificar

// ✅ GOOD — ler o arquivo após editar para provar
await edit({ file: "config.js", old: "v1", new: "v2" });
const result = await read("config.js");
assert(result.includes("v2")); // prova real
```

## 3. Gestão de Tarefas (Task Management) & Zero Loop

- **Passo a Passo (One Step at a Time):** Ao receber um pedido complexo, quebre-o em uma lista (todo list). Resolva estritamente **um item de cada vez**. 
- Se encontrar um erro durante um passo e a tentativa de correção não funcionar rapidamente, **NÃO ENTRE EM LOOP DE TENTATIVAS CEGAS**. Reverta a mudança daquele passo e aborte, comunicando o bloqueio ao usuário.
- O humano é o **Árbitro Final de Estado**. Em caso de desastre (ex: apagar algo acidentalmente ou quebrar dependências no bash), avise imediatamente e peça que o usuário execute `git status` ou testes para validar o dano.

## 4. Estrutura e Modificações de Arquivos

- **Patch Mínimo:** Ao editar, altere o mínimo de arquivos necessários para cumprir o objetivo.
- Proíba edições gigantescas através de regex (`sed` ou `awk`) cegas. Use ferramentas exatas de edição e substituição (`edit`).
- Ao adicionar lógica complexa, em vez de documentar o que o código faz, documente o **porquê** (ex: `// Reason: work around para bug no Safari 14`).
- Nunca crie arquivos com mais de 300 linhas de código (ou o limite estabelecido pelo projeto). Se uma modificação fizer o arquivo ultrapassar esse limite, sua primeira ação deve ser propor a divisão modular (refatoração).

## 5. Resumo Semântico (Token Compression)

- Não regurgite grandes blocos de código que já estão visíveis no editor.
- Ao final de uma longa sessão de *troubleshooting* com o usuário, condense o estado atual da tarefa em, no máximo, 3 a 4 bullet points, para não sobrecarregar seu próprio limite de contexto.
