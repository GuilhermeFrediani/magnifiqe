# README.md

- kind: md
- lines: 273
- bytes: 8202

## Summary
[Stack Perfeita MCP](https://github.com/GuilhermeFrediani/magnifiqe)

## Imports
- none

## Exports
- none

## Source
```md
# [Stack Perfeita MCP](https://github.com/GuilhermeFrediani/magnifiqe)

**MCP server para agentes de código com validação executável, checkpoints, compactação de contexto, leitura inteligente e Council real com 5 bots + Chairman.**

[![Cursor](https://img.shields.io/badge/Cursor-Ready-purple)](https://cursor.com)
[![Windsurf](https://img.shields.io/badge/Windsurf-Ready-blue)](https://windsurf.com)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Ready-orange)](https://claude.ai)
[![VS Code](https://img.shields.io/badge/VS_Code-Ready-blue)](https://code.visualstudio.com)

---

## O que foi revisado nesta versão

- Council corrigido para **5 bots reais**: Contrarian, First Principles Thinker, Expansionist, Outsider e Executor.
- **Chairman explícito** na síntese final.
- Fila de peer review continua embaralhada, mas agora cobre os 5 bots.
- Camada **AI-first Markdown** adicionada via `npm run docs:ai`.
- `README.md`, `opencode.json` e scripts de projeto atualizados.
- Fluxo de validação pronto em um comando: `npm run validate`.

---

## Resposta curta à pergunta principal

### Dá para passar o projeto para Markdown?
Sim. O caminho mais seguro **não é substituir os arquivos-fonte por `.md`**, porque isso quebraria o runtime do MCP. O melhor é manter o código executável e gerar uma **camada paralela em Markdown** com índice compacto, mapa por arquivo e espelho opcional do conteúdo.

### Isso ajuda as AIs e IDEs?
Sim, por três motivos:
1. a IA consegue começar por um índice compacto em vez de abrir arquivos grandes;
2. a navegação fica hierárquica, então o agente lê só o que precisa;
3. o espelho em Markdown pode ser minificado ou resumido antes de entrar no contexto.

### Isso reduz custo?
**Pode reduzir bastante**, desde que o agente consuma primeiro os arquivos compactos (`ai-docs/compact-index.md`, `ai-docs/index.md`) e só abra os espelhos detalhados quando necessário. Se a IA abrir o código completo convertido para Markdown, o custo cai pouco. O ganho vem da **camada de leitura**, não da troca cega de extensão.

---

## Council auditado

### Bots presentes agora
- **Bot 1 — The Contrarian**: procura falhas no raciocínio e riscos não pagos.
- **Bot 2 — The First Principles Thinker**: reconstrói a solução do zero.
- **Bot 3 — The Expansionist**: encontra oportunidades ignoradas.
- **Bot 4 — The Outsider**: questiona o framing sem viés herdado.
- **Bot 5 — The Executor**: transforma a direção escolhida em plano executável.
- **Chairman**: sintetiza consenso, discordâncias, ideias descartadas, ranking de risco, evidências faltantes e próximo passo recomendado.

### O que ficou melhor
- o Council deixou de ser “4-bot only”;
- o Chairman agora aparece de forma explícita na saída;
- a fila de revisão entre pares continua embaralhada, mas cobre o conjunto correto;
- a síntese final registra **evidência faltante**, não apenas consenso.

---

## Camada AI-first Markdown

Após rodar:

```bash
npm run docs:ai
```

será gerada a pasta `ai-docs/` com:

- `ai-docs/compact-index.md` — índice ultracompacto para a IA começar pelo menor custo
- `ai-docs/index.md` — mapa de módulos, fluxos e ordem de leitura recomendada
- `ai-docs/mirror/...` — espelho em Markdown dos arquivos relevantes do projeto
- `ai-docs/manifest.json` — inventário automatizado do pacote documental

### Ordem recomendada para agentes
1. `README.md`
2. `ai-docs/compact-index.md`
3. `ai-docs/index.md`
4. `ai-rules/12-council-deliberation.md`
5. só então abrir `ai-docs/mirror/...` ou `src/...` específicos

---

## Instalação

```bash
npm install
npm run docs:ai
```

### Execução local do MCP

```bash
npx stack-perfeita-mcp --rules-dir ./ai-rules
```

### Setup assistido para IDEs

```bash
npm install -g stack-perfeita-mcp
stack-perfeita init
```

---

## Scripts principais

```bash
npm test                 # suíte unitária/e2e
npm run test:smoke:council
npm run docs:ai          # gera documentação Markdown AI-first
npm run validate         # teste + smoke + docs
npm start                # inicia o servidor MCP
npm run dev              # watch mode
```

---

## Configuração rápida por IDE

### Cursor / VS Code / clientes MCP compatíveis

```json
{
  "mcpServers": {
    "stack-perfeita": {
      "command": "npx",
      "args": ["stack-perfeita-mcp", "--rules-dir", "./ai-rules"]
    }
  }
}
```

### Claude Code / Claude Desktop

```bash
claude mcp add stack-perfeita --command "npx stack-perfeita-mcp --rules-dir ./ai-rules"
```

### OpenCode
Use o `opencode.json` deste repositório. Ele já aponta para:
- `README.md`
- `ai-docs/compact-index.md`
- regras essenciais em `ai-rules/`
- o MCP local `stack-perfeita`

---

## O que o projeto entrega

### Runtime de disciplina
- validação de código ruim (`validate_bad_code`)
- validação de imports e assets (`dependency_validate`)
- validação de estilo de resposta (`validate_response_style`)
- checkpoints e retomada formal de estado
- compactação de logs, diff e contexto

### Leitura inteligente
- `smart_outline`
- `smart_unfold`
- `smart_read`
- `compress_markdown`

### Operação guiada
- `activate_project`
- `get_model_profile`
- `activate_role`
- `start_task_contract`
- `assert_step_evidence`

### Council deliberation
- `council_gate`
- `start_council_session`
- `get_council_session`
- `record_council_position`
- `record_council_review`
- `synthesize_council`

---

## Arquitetura resumida

```text
src/
  index.js                 # entrypoint MCP
  config.js                # constantes e catálogos
  helpers.js               # leitura segura e token minify
  validators.js            # bad code + response style + dependency validation
  code-reading.js          # outline/unfold/read inteligente
  project-state.js         # estado formal + checkpoints
  compaction.js            # compactação de logs/diffs/state
  activation.js            # manifesto de projeto
  council.js               # gate, sessões, peer review e Chairman synthesis
  ...

ai-rules/
  00-12 *.md              # regras modulares sob demanda

ai-docs/
  compact-index.md        # entrada barata para IA
  index.md                # mapa geral
  mirror/                 # espelho Markdown dos arquivos
```

---

## Como reduzir tokens de verdade

### Faça isso
- carregue primeiro `ai-docs/compact-index.md`
- abra só o módulo necessário
- use `compress_markdown` em regras ou documentos grandes
- use `activate_project()` como prefixo estável de contexto
- registre progresso com checkpoints e compactions

### Evite isso
- despejar todos os `src/*.js` no contexto de uma vez
- abrir README + todas as regras + todo o código na primeira mensagem
- usar o Council em tarefas triviais
- transformar o projeto inteiro em Markdown e sempre ler tudo

---

## Observações de design

- A camada Markdown foi pensada para **leitura**, não para substituir o runtime.
- O Council agora está alinhado com a técnica pedida: **5 bots + Chairman**.
- A síntese final continua determinística e auditável.
- A ordem de revisão entre pares é embaralhada por sessão para reduzir viés mecânico.

---

## Fluxo recomendado de uso

```text
1. activate_project()
2. get_model_profile(...)
3. activate_role(...)
4. start_task_contract(...)
5. council_gate(...) se houver ambiguidade/blast radius
6. start_council_session(...) quando fizer sentido
7. executar trabalho
8. assert_step_evidence(...)
9. validate_bad_code / dependency_validate
10. checkpoint_task(...)
```

---

## Publicação e empacotamento

O pacote agora inclui:
- `src/`
- `bin/`
- `scripts/`
- `ai-rules/`
- `ai-docs/`
- `.claude/skills/`
- `README.md`
- `PROMPTS.md`
- `opencode.json`

---

## Próximos passos bons

- adicionar um bundle temático por domínio em `ai-docs/bundles/`
- incluir scorecard de Council em JSON para consumo externo
- adicionar comparação de custo estimado antes/depois da camada Markdown
- opcionalmente separar `src/council.js` em `council-core.js`, `council-format.js` e `council-tools.js`

---

## Fonte
Projeto original auditado e revisado: [GuilhermeFrediani/magnifiqe](https://github.com/GuilhermeFrediani/magnifiqe)

```
