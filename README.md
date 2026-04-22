# Stack Perfeita

> Sair do vibe coding para engenharia disciplinada — regras + MCP que levam qualquer IDE + LLM ao máximo.

## O que é

Um template de projeto com:
- **Arquivos de regras** (`ai-rules/`) que qualquer IDE com LLM lê como contexto fixo
- **AGENTS.md** para agentes autônomos (Claude Code, Aider, OpenCode)
- **`.cursorrules`** para Cursor IDE
- **`copilot-instructions.md`** para GitHub Copilot / VS Code
- **`CONTEXT.md`** por módulo para eliminar a maior fonte de alucinação: falta de contexto local
- **MCP server** para distribuir as regras como ferramentas instaláveis em qualquer projeto

## Estrutura

```
├── AGENTS.md                          # Agentes autônomos (Claude Code, Aider, OpenCode)
├── .cursorrules                       # Cursor IDE
├── .github/
│   └── copilot-instructions.md        # GitHub Copilot
├── copilot-instructions.md            # VS Code Copilot (raiz)
├── opencode.json                      # OpenCode config
├── ai-rules/                          # Regras para LLM
│   ├── 00-project-overview.md         # Domínio, stack, NFRs (preencha com dados do projeto)
│   ├── 01-ai-workflow-strict.md       # Fluxo P.E.R., anti-alucinação, zero-loop
│   ├── 02-coding-standards.md         # Estilo Caveman: naming, early return, imutabilidade
│   ├── 03-token-economy.md            # Compressão de tokens, bloqueio de filler
│   ├── 04-security-secrets.md         # OWASP 2025/2026, gestão de segredos
│   ├── 05-debugging-mastery.md        # Debug estruturado, sem console.log cego
│   ├── 06-ci-cd-testing.md            # Pipeline como produto, 4 frentes de segurança
│   ├── 07-frontend-semantic.md        # HTML semântico, a11y, CSS moderno, Core Web Vitals
│   ├── 08-backend-architecture.md     # Validação na borda, ACID, stateless, N+1
│   ├── 09-bad-patterns-halt.md        # Lista negra: any, catch vazio, God Function, etc.
│   └── 10-llm-behavioral-rules.md     # Regras universais para qualquer LLM + bloqueio de excitação
├── src/
│   └── index.js                       # MCP server entry point
├── package.json
└── README.md
```

## Como usar (sem MCP)

1. Clone este repo ou copie a pasta `ai-rules/` para a raiz do seu projeto.
2. Edite `ai-rules/00-project-overview.md` com os dados do seu projeto.
3. A partir daí, o Cursor, Claude Code e Copilot já leem automaticamente.

## Como usar o MCP

O MCP expõe as regras como ferramentas que o agente pode consultar sob demanda.

### Instalação local

```bash
npm install
node src/index.js --rules-dir ./ai-rules
```

### Configuração no Cursor

Adicione em `~/.cursor/mcp.json` ou `.cursor/mcp.json` no projeto:

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["./src/index.js", "--rules-dir", "./ai-rules"]
    }
  }
}
```

### Configuração no Claude Code / OpenCode

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["./src/index.js", "--rules-dir", "./ai-rules"]
    }
  }
}
```

### Configuração no VS Code (Copilot)

Adicione em `.vscode/mcp.json`:

```json
{
  "servers": {
    "stack-perfeita": {
      "type": "stdio",
      "command": "node",
      "args": ["./src/index.js", "--rules-dir", "./ai-rules"]
    }
  }
}
```

## Ferramentas do MCP

### Ferramentas de Leitura

| Ferramenta | O que faz |
|------------|-----------|
| `list_rules()` | Lista todos os arquivos de regras disponíveis com descrição |
| `get_rules(topic)` | Retorna o conteúdo de um arquivo por keyword. Topics: `coding`, `workflow`, `bad`, `architecture`, `security`, `tokens`, `behavior`, `frontend`, `backend`, `debugging`, `ci`, `a11y`, `economy`, `llm`, `global`, `excitation`, `hesitation`, `filler` |
| `get_context(module_path)` | Retorna o `CONTEXT.md` de um módulo específico |

### Ferramentas de Validação

| Ferramenta | O que faz |
|------------|-----------|
| `validate_bad_code(code)` | Verifica código contra 11 padrões proibidos (any, catch vazio, console.log, God Function, arrow code, innerHTML, var, ==, TODO, eval). Retorna PASS ou HALT |
| `validate_git_commit(message)` | Valida mensagem de commit no formato Conventional Commits. Retorna PASS ou HALT |
| `dependency_validate(file_path)` | Verifica se imports/referências de um arquivo existem no filesystem. Detecta imports alucinados |

### Segurança Integrada

- **Path traversal protection** em `get_rules` e `get_context`
- **Rate limit** em memória (20 chamadas/tool/60s) para prevenir loops de LLM
- Respostas em formato **PASS/HALT** — processável por qualquer modelo

## Regras Universais para LLMs

O arquivo `ai-rules/10-llm-behavioral-rules.md` contém regras válidas para qualquer LLM moderno (GLM-5, Gemini 3.1 PRO, GPT-5.x, Claude Opus/Sonnet), escritas em termos de comportamento observável:

1. **10 regras globais** — intenção explícita, ambiguidade declarada, não inventar dados, decompor tarefas
2. **Bloqueio de tokens de excitação** — proibido: "humm", "deixa eu pensar", "entendido", "happy to help", etc.
3. **Princípio fundamental** — 3 palavras que resolvem > 30 palavras que explicam

## Como instruir a LLM a usar o MCP

Prompt de abertura sugerido:

```
Você tem acesso ao MCP stack-perfeita com as seguintes ferramentas:
- list_rules() → lista regras disponíveis
- get_rules(topic) → lê regra por tema (ex: "coding", "bad", "behavior")
- validate_bad_code(code) → verifica código antes de submeter
- validate_git_commit(msg) → valida mensagem de commit
- dependency_validate(path) → verifica se imports existem

Antes de escrever código, chame get_rules("behavior") para regras de comportamento.
Antes de submeter alterações, chame validate_bad_code com o código.
```

## Prioridade de leitura por IDE

| IDE / Agente | Arquivo principal lido |
|--------------|----------------------|
| Cursor | `.cursorrules` → aponta para `ai-rules/` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code | `AGENTS.md` → aponta para `ai-rules/` |
| Aider | `AGENTS.md` |
| OpenCode | `opencode.json` + `AGENTS.md` |
| Qualquer agente MCP | Ferramentas do MCP server |

## Por que funciona

LLMs imitam padrões do contexto que recebem. Arquivos de regras claros:
- Preenchem os gaps antes de a LLM inventar algo
- Forçam classificação do código antes de editar (bad/good examples em cada regra)
- Bloqueiam abstrações desnecessárias via `09-bad-patterns-halt.md`
- Impõem constraints ativas via ferramentas de validação (PASS/HALT)
- Reduzem iterações porque o agente sabe o que é esperado antes de gerar

## Contribuindo

PRs bem-vindos. Issues para discutir adições às regras.
