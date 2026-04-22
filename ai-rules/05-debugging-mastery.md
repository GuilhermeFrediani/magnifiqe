# 05 - Maestria em Debugging (Anti-Achismo JS/TS)

> **META:** Chega de tentar a sorte com "console.log('aqui')". Em JavaScript, TypeScript, Node ou React moderno, o debugging deve ser sistemático, científico e baseado em provas.

## 1. Mindset "Reproduza, Reduza, Prove"
- **NUNCA tente codar uma correção baseada em suposições (achismos).**
- Antes de propor uma mudança, você deve provar onde o invariante foi violado.
- Reduza o escopo: teste apenas a menor parte do código ou função afetada. Isole o estado de erro.

## 2. Abandono do `console.log` cego
- Proibido usar log cego tipo `console.log("entrou aqui")` ou `console.log(err)`.
- Use **Logs Estruturados (Structured Logging)**:
  ```javascript
  // ❌ BAD — log cego, sem contexto parseável
  console.log('User', userId, 'failed with', err);
  console.log('entrou aqui');
  console.log(err);
  
  // ✅ GOOD — log estruturado, parseável, com contexto
  console.log({ msg: 'user_fetch_failed', userId, error: String(err) });
  // OU use debugger; para parar e inspecionar estado real
  ```
- **Preferência Absoluta:** Ao ajudar o usuário a debugar, sugira a inserção da palavra-chave `debugger;` ou ferramentas como o Inspector do Node (`--inspect`). Use Logpoints ou Breakpoints Condicionais se estiver codando junto na IDE.

## 3. Padrões de Falha Comuns (E como não cair neles)
Ao encontrar os seguintes erros, aplique as soluções abaixo em vez de tentar remendos fáceis:

- **`Cannot read property 'x' of undefined`:**
  - Diagnóstico: Problema no contrato de dados.
  - Ação: Vá à origem da variável. Proponha _Guards_ (ex: `if (!user) return;`) ou Type Guards. Nunca apenas envolva em um `try/catch` genérico sem tratar o porquê do dado estar vazio.
- **Missing `await` (Erros Assíncronos):**
  - Se um teste/UI está avançando antes da requisição acabar ou retornando Promise pendente, o primeiro palpite não deve ser "mudar a lógica toda". Procure um `await` ausente ou mal encadeado em blocos assíncronos não tratados.
- **Race Conditions (UI desincronizada):**
  - Se o problema for de cliques duplos rápidos ou sobreposição, não reinvente o `useEffect` (em React). Use `AbortController` nas requisições (`fetch`) para cancelar chamadas anteriores.
- **Stale Closures em React:**
  - Se um evento não tem acesso ao estado atualizado, use o update funcional (ex: `setCount(c => c + 1)`) ou revise o array de dependências.

## 4. O Checklist do Debugger Sênior (Use esse fluxo)
1. Qual o comportamento esperado vs atual?
2. Em qual limite exato (fronteira) o estado correto se torna incorreto?
3. Execute o script ou teste. O stacktrace está limpo (source maps)? Se não, leia o stacktrace assíncrono.
4. Aplique a correção menor e mais segura possível. Rode os testes para provar que a correção não introduziu regressão.