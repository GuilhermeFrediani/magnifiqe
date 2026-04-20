#!/usr/bin/env node
/**
 * stack-perfeita-mcp
 * MCP server that exposes project AI rules as tools for any IDE/agent.
 *
 * Usage in Cursor / Claude Code / VS Code:
 *   npx stack-perfeita-mcp --rules-dir /path/to/your/project/ai
 *
 * Tools exposed:
 *   list_rules()              → lists all available rule files
 *   get_rules(topic)          → returns content of a specific rules file
 *   get_context(module_path)  → returns CONTEXT.md for a given module path
 *   validate_snippet(code)    → checks code against loaded standards (heuristic)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve, basename } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const rulesDirFlag = args.indexOf("--rules-dir");
const RULES_DIR = rulesDirFlag !== -1
  ? resolve(args[rulesDirFlag + 1])
  : resolve(process.cwd(), "ai");

const SRC_DIR = resolve(RULES_DIR, "../src");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readFile(filePath) {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function listRuleFiles() {
  try {
    return readdirSync(RULES_DIR)
      .filter(f => f.endsWith(".md"))
      .sort();
  } catch {
    return [];
  }
}

function getRuleByTopic(topic) {
  const files = listRuleFiles();

  // Exact filename match
  const exact = files.find(f => f === topic || f === `${topic}.md`);
  if (exact) return { file: exact, content: readFile(join(RULES_DIR, exact)) };

  // Fuzzy: topic keyword in filename
  const fuzzy = files.find(f => f.toLowerCase().includes(topic.toLowerCase()));
  if (fuzzy) return { file: fuzzy, content: readFile(join(RULES_DIR, fuzzy)) };

  return null;
}

// ─── Topic index (keyword → filename mapping) ─────────────────────────────

const TOPIC_MAP = {
  "overview": "00-project-overview.md",
  "project": "00-project-overview.md",
  "glossary": "01-domain-glossary.md",
  "domain": "01-domain-glossary.md",
  "terms": "01-domain-glossary.md",
  "coding": "02-coding-standards.md",
  "standards": "02-coding-standards.md",
  "naming": "02-coding-standards.md",
  "variables": "02-coding-standards.md",
  "loops": "02-coding-standards.md",
  "architecture": "03-architecture-rules.md",
  "arch": "03-architecture-rules.md",
  "structure": "03-architecture-rules.md",
  "testing": "04-testing-strategy.md",
  "tests": "04-testing-strategy.md",
  "workflow": "05-ai-workflow-rules.md",
  "flow": "05-ai-workflow-rules.md",
  "process": "05-ai-workflow-rules.md",
  "bad": "06-bad-patterns.md",
  "patterns": "06-bad-patterns.md",
  "blacklist": "06-bad-patterns.md",
  "antipatterns": "06-bad-patterns.md",
};

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "stack-perfeita-mcp",
  version: "1.0.0",
});

// Tool 1: list_rules
server.tool(
  "list_rules",
  "Lists all available AI rule files in the project. Use this first to know what rules exist.",
  {},
  async () => {
    const files = listRuleFiles();

    if (files.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No rule files found in: ${RULES_DIR}\n\nCreate markdown files in an 'ai/' folder next to your source code.`,
        }],
      };
    }

    const descriptions = {
      "00-project-overview.md": "Project domain, stack, and non-functional requirements",
      "01-domain-glossary.md": "Business terms and their code equivalents",
      "02-coding-standards.md": "Naming, variables, loops, functions, clean code rules",
      "03-architecture-rules.md": "Folder structure, layers, dependency rules",
      "04-testing-strategy.md": "Test types, naming, coverage expectations",
      "05-ai-workflow-rules.md": "How the AI must think and act (the brain)",
      "06-bad-patterns.md": "Blacklisted patterns, names, and behaviors",
    };

    const lines = files.map(f => {
      const desc = descriptions[f] || "Custom rule file";
      return `- **${f}** — ${desc}`;
    });

    return {
      content: [{
        type: "text",
        text: `## Available rule files in: ${RULES_DIR}\n\n${lines.join("\n")}\n\nUse get_rules(topic) to read any of these files.`,
      }],
    };
  }
);

// Tool 2: get_rules
server.tool(
  "get_rules",
  "Returns the content of a specific rules file. Use topic keywords like: coding, architecture, workflow, testing, bad, glossary, overview.",
  { topic: z.string().describe("Topic keyword or filename. Examples: 'coding', 'workflow', 'bad', '02-coding-standards.md'") },
  async ({ topic }) => {
    // Try topic map first
    const mappedFile = TOPIC_MAP[topic.toLowerCase()];
    const targetFile = mappedFile || null;

    let result = null;

    if (targetFile) {
      const filePath = join(RULES_DIR, targetFile);
      const content = readFile(filePath);
      if (content) result = { file: targetFile, content };
    }

    // Fallback: fuzzy search in actual files
    if (!result) {
      result = getRuleByTopic(topic);
    }

    if (!result) {
      const files = listRuleFiles();
      return {
        content: [{
          type: "text",
          text: `No rules found for topic: "${topic}"\n\nAvailable files:\n${files.map(f => `- ${f}`).join("\n")}\n\nTopic keywords: ${Object.keys(TOPIC_MAP).join(", ")}`,
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: `## ${result.file}\n\n${result.content}`,
      }],
    };
  }
);

// Tool 3: get_context
server.tool(
  "get_context",
  "Returns the CONTEXT.md file for a specific module/feature folder. Always call this before editing files in a module.",
  { module_path: z.string().describe("Module folder name or path relative to src/. Examples: 'orders', 'users', 'payments'") },
  async ({ module_path }) => {
    // Try relative to src/
    const candidates = [
      join(SRC_DIR, module_path, "CONTEXT.md"),
      join(resolve(process.cwd(), "src"), module_path, "CONTEXT.md"),
      join(resolve(process.cwd()), module_path, "CONTEXT.md"),
      resolve(module_path, "CONTEXT.md"),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        const content = readFile(candidate);
        return {
          content: [{
            type: "text",
            text: `## CONTEXT.md — ${module_path}\n\n${content}`,
          }],
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `No CONTEXT.md found for module: "${module_path}"\n\nSearched in:\n${candidates.map(c => `- ${c}`).join("\n")}\n\nCreate a CONTEXT.md in the module folder using the template from the stack-perfeita repository.`,
      }],
    };
  }
);

// Tool 4: get_all_rules
server.tool(
  "get_all_rules",
  "Returns ALL rule files concatenated. Use only when you need full context. Prefer get_rules(topic) for specific topics to save tokens.",
  {},
  async () => {
    const files = listRuleFiles();

    if (files.length === 0) {
      return {
        content: [{ type: "text", text: `No rule files found in: ${RULES_DIR}` }],
      };
    }

    const sections = files.map(f => {
      const content = readFile(join(RULES_DIR, f));
      return `${"=".repeat(60)}\n## ${f}\n${"=".repeat(60)}\n\n${content}`;
    });

    return {
      content: [{
        type: "text",
        text: `# Full Project Rules\n\nSource: ${RULES_DIR}\n\n${sections.join("\n\n")}`,
      }],
    };
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(`stack-perfeita-mcp started\nRules dir: ${RULES_DIR}\n`);
