# Stack Perfeita 🎯

> Sair do vibe coding para engenharia disciplinada — uma pasta que leva qualquer IDE + LLM ao máximo.

## O que é isso

Um template de projeto com:
- **Arquivos de regras** (`ai/`) que qualquer IDE com LLM lê como contexto fixo
- **AGENTS.md** para agentes autônomos (Claude Code, Aider, OpenCode)
- **`.cursorrules`** para Cursor IDE
- **`copilot-instructions.md`** para GitHub Copilot / VS Code
- **`CONTEXT.md`** por módulo para eliminar a maior fonte de alucinação: falta de contexto local
- **MCP server** para distribuir as regras como ferramentas instaláveis em qualquer projeto

## Estrutura

```
├── AGENTS.md                          # Agentes autônomos
├── .cursorrules                       # Cursor IDE
├── .github/
│   └── copilot-instructions.md        # GitHub Copilot
├── ai/                                # Regras para LLM
│   ├── 00-project-overview.md         # Domínio, stack, NFRs
│   ├── 01-domain-glossary.md          # Termos do negócio → nomes no código
│   ├── 02-coding-standards.md         # Naming, variáveis, loops, funções
│   ├── 03-architecture-rules.md       # Estrutura de pastas, camadas, dependências
│   ├── 04-testing-strategy.md         # Tipos, naming, o que cobrir
│   ├── 05-ai-workflow-rules.md        # ← O CÉREBRO. Leia primeiro.
│   └── 06-bad-patterns.md             # Lista negra de padrões proibidos
├── src/
│   └── [modulo]/
│       └── CONTEXT.md                 # Contexto local do módulo
└── mcp/                               # MCP server distribuível
    ├── package.json
    └── src/index.js
```

## Como usar agora (sem MCP)

1. Clone este repo ou copie a pasta `ai/` para a raiz do seu projeto.
2. Edite `ai/00-project-overview.md` com os dados do seu projeto.
3. Edite `ai/01-domain-glossary.md` com os termos do seu domínio.
4. A partir daí, o Cursor, Claude Code e Copilot já leem automaticamente.

## Como usar o MCP

O MCP expõe as regras como ferramentas que o agente pode consultar sob demanda.

### Instalação local (em desenvolvimento)

```bash
cd mcp
npm install
node src/index.js --rules-dir /caminho/para/seu/projeto/ai
```

### Configuração no Cursor

Adicione em `~/.cursor/mcp.json` ou `.cursor/mcp.json` no projeto:

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["/caminho/para/stack-perfeita/mcp/src/index.js", "--rules-dir", "./ai"],
      "cwd": "/caminho/para/seu/projeto"
    }
  }
}
```

### Configuração no Claude Code

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["/caminho/para/mcp/src/index.js", "--rules-dir", "./ai"]
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
      "args": ["./mcp/src/index.js", "--rules-dir", "./ai"]
    }
  }
}
```

## Ferramentas do MCP

| Ferramenta | O que faz |
|------------|-----------|
| `list_rules()` | Lista todos os arquivos de regras disponíveis |
| `get_rules(topic)` | Retorna o conteúdo de um arquivo específico. Topics: `coding`, `workflow`, `architecture`, `testing`, `bad`, `glossary`, `overview` |
| `get_context(module_path)` | Retorna o `CONTEXT.md` de um módulo específico |
| `get_all_rules()` | Retorna todas as regras concatenadas (use com moderação) |

## Prioridade de leitura por IDE

| IDE / Agente | Arquivo principal lido |
|--------------|----------------------|
| Cursor | `.cursorrules` → aponta para `ai/` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code | `AGENTS.md` → aponta para `ai/` |
| Aider | `AGENTS.md` |
| OpenCode | `AGENTS.md` |
| Qualquer agente MCP | Ferramentas do MCP server |

## Por que funciona

LLMs imitam padrões do contexto que recebem. Arquivos de regras claros:
- Preenchem os gaps antes de a LLM inventar algo
- Forçam classificação do código antes de editar (BASE BOA / RUIM)
- Bloqueiam abstrações desnecessárias via `06-bad-patterns.md`
- Reduzem iterações porque o agente sabe o que é esperado antes de gerar

## Contribuindo

PRs bem-vindos. Issues para discutir adições às regras.
