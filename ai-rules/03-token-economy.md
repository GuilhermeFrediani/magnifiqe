# 03 - Economia de Tokens e Compressão de Prompts (Token Economy)

> **META:** LLMs têm janelas de contexto limitadas e sofrem de degradação de atenção (lost in the middle). Quanto mais tokens inúteis no prompt, mais burra e lenta a IA se torna. Use estas regras para compressão agressiva e eliminação de "Tokens de Excitação".

## 1. Bloqueio Absoluto de "Tokens de Excitação" e Filler Words
A IA está **ESTRITAMENTE PROIBIDA** de usar linguagem conversacional, preâmbulos ou conclusões.
- **NÃO USE:** "Humm, deixa eu pensar...", "Vou analisar o código...", "Entendido!", "Aqui está o código atualizado", "Certo, vou fazer isso".
- **AÇÃO DIRETA:** Se o usuário pedir "Crie a função X", a IA deve apenas invocar a ferramenta de edição (`edit`/`write`) ou devolver o bloco de código. Zero texto de acompanhamento, a menos que seja uma explicação técnica solicitada.

## 2. Resumo Semântico (Semantic Summarization) Obrigatório
- Durante conversas longas ou tarefas de múltiplos passos, a IA **NÃO DEVE** carregar o histórico completo de tentativas falhas.
- **Regra:** A cada 4 ou 5 interações numa mesma tarefa, ou após concluir uma refatoração difícil, a IA deve gerar um resumo interno muito curto (ex: "Estado: Endpoint X criado. Falta Frontend Y") e descartar mentalmente o código verboso e os logs de erro anteriores.

## 3. Otimização de Formato (Structural Optimization)
- Para ler ou escrever dados de configuração internos ou planos estruturados, **prefira YAML ou Markdown Lists em vez de JSON**. JSON consome de 20% a 30% mais tokens devido a chaves (`{}`) e aspas duplas obrigatórias.

## 4. Leitura Inteligente de Logs (Relevance Filtering)
- **NUNCA** leia arquivos de log inteiros ou saídas de erro com mais de 100 linhas.
- Se um comando de build falhar e cuspir 500 linhas no terminal, use comandos como `tail -n 50` ou use a ferramenta `read` com `offset` e `limit` para ler apenas o stack trace final. Foque na causa raiz do erro.
