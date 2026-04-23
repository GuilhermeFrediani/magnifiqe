# Stack Perfeita MCP ⭐

**Engenharia disciplinada para qualquer IDE + LLM.** Sai do vibe coding para regras + validação ativa.

[![Cursor](https://img.shields.io/badge/Cursor-✅-purple)](https://cursor.com)
[![Windsurf](https://img.shields.io/badge/Windsurf-✅-blue)](https://windsurf.com)
[![Claude Code](https://img.shields.io/badge/Claude_Code-✅-orange)](https://claude.ai)
[![VS Code](https://img.shields.io/badge/VS_Code-✅-blue)](https://code.visualstudio.com)

## 🎯 O que resolve

- **Alucinações** → `dependency_validate` detecta imports fantasmas
- **Degeneração** → `validate_bad_code` (11 padrões), rate limit anti-loop
- **Tokens vazios** → `10-llm-behavioral-rules.md` bloqueia "humm", "entendido"
- **Regressão** → OUTPUT-GATE checklist obrigatório

## 🚀 Instalação por IDE (2min)

### Cursor (mais popular)

```bash
# 1. Clone no projeto
git clone https://github.com/GuilhermeFrediani/stack-perfeita .stack-perfeita
cd .stack-perfeita && npm install

# 2. Cursor Settings → MCP → Add Custom
# Cole isso:
```

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "node",
      "args": [".stack-perfeita/src/index.js", "--rules-dir", "./ai-rules"],
      "cwd": ".stack-perfeita"
    }
  }
}
```

**Restart Cursor** → pronto!

### Windsurf

1. Windsurf → **Plugins** (sidebar) → **MCP Marketplace**
2. **Add Custom MCP** → `.windsurf/mcp_config.json`:

```json
{
  "servers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["./src/index.js", "--rules-dir", "./ai-rules"]
    }
  }
}
```

### Antigravity (Google)

**Nativo via MCP Toolbox** — clone e rode:

```bash
npm install && node src/index.js --rules-dir ./ai-rules
```

Antigravity auto-detecta MCP servers locais.

### Claude Code / OpenCode

```bash
# Global
claude mcp add stack-perfeita --command "node ./src/index.js --rules-dir ./ai-rules"

# Ou .mcp.json no projeto
```

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

### VS Code (Copilot)

`.vscode/mcp.json`:

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

## 🛠️ Ferramentas Expostas (6 tools)

| Tool | O que faz | Keywords |
|---|---|---|
| `list_rules()` | Lista regras | - |
| `get_rules(topic)` | Lê regra | `coding`, `bad`, `behavior`, `tokens`, `security` |
| `validate_bad_code(code)` | **11 padrões** → PASS/HALT | any, God Function, innerHTML, etc. |
| `dependency_validate(path)` | Imports existem? | alucinações de arquivo |
| `validate_git_commit(msg)` | Conventional Commits | git hygiene |

## 🎭 Como Instruir a LLM (prompt mágico)

```
Use MCP stack-perfeita:
  get_rules('behavior') — SEMPRE primeiro
  validate_bad_code(código) — ANTES de submeter
  dependency_validate(path) — arquivos com imports
  OUTPUT-GATE: checklist de features antes de entregar
```

## 📊 Por que é diferente (vs outros MCPs)

- **PASS/HALT** — não sugere, **PARA** código ruim
- **Rate limit** — anti-loop automático
- **Tokens de excitação BLOQUEADOS** — zero fluff
- **OUTPUT-GATE** — checklist obrigatório, zero regressão
- **11 padrões reais** — pega o que realmente quebra

## 🧪 Teste Rápido

```bash
# Terminal do projeto
npm install
node src/index.js --rules-dir ./ai-rules

# Cursor/Claude: "@stack-perfeita list_rules()"
# Deve listar 10 regras + 3 tools de validação
```

## ❌ Problemas Comuns

**"MCP não aparece"**
- Restart completo da IDE
- Verifique `node src/index.js --rules-dir ./ai-rules` roda sem erro

**"Tools não listadas"**
- Cursor: View → Output → MCP (logs)

**Windows path issues**

```json
"args": ["src\\index.js", "--rules-dir", "ai-rules"]
```

## 🤝 Contribua

1. **Novo padrão no `validate_bad_code`** → PR em `src/index.js`
2. **Nova regra** → `ai-rules/11-nova-regra.md`
3. **Exemplo bad/good** → só em `09-bad-patterns-halt.md`

**⭐ Star se ajudou seu workflow!**
