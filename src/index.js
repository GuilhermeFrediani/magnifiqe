import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");
const AI_RULES_DIR = path.join(ROOT_DIR, "ai-rules");

// Inicializa o Servidor MCP (The Efficient Frontier)
const server = new Server(
  {
    name: "stack-perfeita-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// ==========================================
// 1. RECURSOS (Resources)
// Permite que o LLM leia ativamente os guias em ai-rules/
// ==========================================
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const files = await fs.readdir(AI_RULES_DIR);
    const resources = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => ({
        uri: `file://${path.join(AI_RULES_DIR, file).replace(/\\/g, "/")}`,
        name: `Regra: ${file}`,
        mimeType: "text/markdown",
        description: `Guia técnico e comportamental do AIPIHKAL Protocol - ${file}`,
      }));

    return { resources };
  } catch (error) {
    console.error("Erro ao listar recursos:", error);
    return { resources: [] };
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const filePath = uri.replace("file://", "");

  if (!filePath.includes("ai-rules")) {
    throw new Error("Acesso negado: Este MCP só serve arquivos da pasta ai-rules/");
  }

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Recurso não encontrado: ${filePath}`);
  }
});

// ==========================================
// 2. FERRAMENTAS (Tools)
// Ações ativas para o LLM se autovalidar e seguir a regra "Zero Alucinação"
// ==========================================
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "validate_bad_code",
        description:
          "Envia um pedaço de código para o MCP verificar se contém 'Bad Code' (ex: tipagem ANY, catch vazio, console.log perdido). Use ANTES de submeter a alteração real ao arquivo.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "O trecho de código JavaScript/TypeScript que você quer validar.",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "validate_git_commit",
        description:
          "Verifica se a mensagem do seu commit atende ao formato Conventional Commits (ex: 'feat: add button', 'fix: bug'). Use SEMPRE antes de gerar o commit real.",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "A mensagem do commit que você quer testar.",
            },
          },
          required: ["message"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "validate_bad_code") {
    const code = String(request.params.arguments?.code || "");
    const errors = [];

    // Checagens Baseadas na Filosofia Caveman & Fundação Podre
    if (/\bany\b/.test(code)) {
      errors.push("❌ DETECTADO: Uso da palavra-chave 'any'. Proibido usar tipagem preguiçosa. Inferir tipo correto.");
    }
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code) || /catch\s*\{\s*\}/.test(code)) {
      errors.push("❌ DETECTADO: Bloco Catch vazio (engolindo erros silenciosamente). Lidar com a falha (Fail Fast).");
    }
    if (/console\.log\(/.test(code)) {
      errors.push("❌ DETECTADO: Uso de console.log() cru. Utilize Logger estruturado ou debugger (Regra 05).");
    }

    if (errors.length > 0) {
      return {
        content: [
          {
            type: "text",
            text: `Rejeitado! O código contém anti-padrões e viola o 'AIPIHKAL Protocol':\n\n${errors.join("\n")}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: "✅ Aprovado! O código não possui anti-padrões explícitos (Caveman Style aprovado). Pode prosseguir.",
        },
      ],
    };
  }

  if (request.params.name === "validate_git_commit") {
    const message = String(request.params.arguments?.message || "");
    const commitRegex = /^(feat|fix|docs|style|refactor|perf|test|chore)(\([^)]+\))?:\s.+/;

    if (commitRegex.test(message)) {
      return {
        content: [
          {
            type: "text",
            text: "✅ Mensagem válida no padrão Conventional Commits. Você pode prosseguir com o commit.",
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: "❌ Mensagem rejeitada. A mensagem NÃO segue o formato 'tipo(escopo): descrição'.\nTipos válidos: feat, fix, docs, style, refactor, perf, test, chore.",
          },
        ],
      };
    }
  }

  throw new Error(`Ferramenta desconhecida: ${request.params.name}`);
});

// ==========================================
// 3. INICIALIZAÇÃO VIA STDIO
// ==========================================
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stack Perfeita MCP Server (AIPIHKAL Protocol) is running on stdio");
}

run().catch((error) => {
  console.error("Server falhou ao inicializar:", error);
  process.exit(1);
});
