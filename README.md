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
- **Padronização Global** → Script que unifica `.cursorrules` e `.windsurfrules`

---

## 🚀 Instalação Rápida (Recomendada)

Se você quer apenas usar o repositório como um centralizador de regras para todos os seus projetos (Opção "Fonte Única de Verdade"):

```bash
# Clone na sua pasta principal de código
git clone https://github.com/GuilhermeFrediani/magnifiqe.git ~/.stack-perfeita
cd ~/.stack-perfeita
npm install

# Instale o script CLI globalmente
npm link
```

### Como vincular a um novo projeto
Em qualquer pasta de projeto que você for trabalhar, simplesmente rode:

```bash
stack-perfeita
```

Isso irá gerar automaticamente os arquivos `.cursorrules`, `.windsurfrules` e `opencode.json` na raiz daquele projeto, com os comandos de **Ignition** já embutidos. 

*(Veja o arquivo [PROMPTS.md](./PROMPTS.md) na raiz deste repositório para ver as palavras mágicas exatas a serem usadas no chat).*

---

## 🚀 Configuração Nativa por IDE

### Cursor (mais popular)
No Cursor Settings → MCP → Add Custom. Adicione a seguinte configuração (substitua o caminho):

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["C:/Users/SeuUsuario/.stack-perfeita/src/index.js"]
    }
  }
}
```
**Restart Cursor** → pronto!

### Windsurf
1. Windsurf → **Plugins** (sidebar) → **MCP Marketplace**
2. **Add Custom MCP** → cole as configurações usando o mesmo caminho absoluto:

```json
{
  "servers": {
    "stack-perfeita": {
      "command": "node",
      "args": ["/caminho/absoluto/para/.stack-perfeita/src/index.js"]
    }
  }
}
```

### Claude Desktop / Claude Code
```bash
claude mcp add stack-perfeita --command "node /caminho/absoluto/.stack-perfeita/src/index.js"
```

### Antigravity (Google)
Antigravity auto-detecta MCP servers locais, basta passar o arquivo de rules.

---

## 🎭 Como Instruir a LLM (Prompts Mágicos)

Temos um arquivo só para os prompts que você deve jogar no chat. **[Leia o PROMPTS.md](./PROMPTS.md)**.
Mas em resumo:

**Prompt 1: IGNITION (Abertura de Projeto)**
Sempre que iniciar um projeto novo, cole no chat:
> "🔧 ATIVE STACK-PERFEITA MCP AGORA. Chame \`get_rules('behavior')\`, leia o \`AGENTS.md\` na raiz. OUTPUT-GATE OBRIGATÓRIO."

**Prompt 2: CHECKPOINT (Manutenção)**
Se a IA começar a vacilar, tagarelar ou mandar código ruim:
> "🚨 CHECKPOINT MCP. Pare de tagarelar. Chame \`validate_bad_code\` no último bloco e garanta ZERO FLUFF."

---

## 🛠️ Ferramentas Expostas (10 tools)

| Tool | O que faz |
|---|---|
| `get_rules(topic)` | Lê regras centrais (`behavior`, `coding`, `bad`...) |
| `list_skills()` | Lista scripts/playbooks específicos em `.claude/skills` |
| `get_skill(name)` | Carrega instruções para uma tarefa específica |
| `validate_bad_code(code)` | **11 padrões** → PASS/HALT (ex: any, console.log cego) |
| `dependency_validate(path)`| Imports existem ou ela alucinou o caminho? |
| `smart_outline(path)` | Lista todas as funções e assinaturas do arquivo |
| `smart_unfold(path, name)` | Extrai só uma função específica de um arquivo longo |
| `save_observation(obs)` | Salva decisões arquiteturais entre diferentes chats |
| `search_observations(q)` | Busca memória do projeto |
| `run_command(name)` | Roda um script estruturado de `ai-rules/commands` |

## 📊 Por que é diferente (vs outros MCPs)

- **PASS/HALT** — não sugere, **PARA** código ruim e devolve erro via JSON-RPC.
- **Tokens de excitação BLOQUEADOS** — Foca em forçar a LLM a parar de dizer "Entendido, vou fazer isso!".
- **OUTPUT-GATE** — checklist obrigatório antes da IA mandar a resposta final.
- **Sistema de Sessão** — a IA lembra de aprendizados via `save_observation`.

## 🤝 Contribua

1. **Novo padrão no `validate_bad_code`** → PR em `src/index.js`
2. **Nova regra** → `ai-rules/12-nova-regra.md`
3. **Novo Slash Command** → `ai-rules/commands/`

**⭐ Star se ajudou seu workflow!**
