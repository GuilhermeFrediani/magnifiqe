/**
 * Stack Perfeita MCP — Rules tools
 * list_rules, get_rules, get_context MCP tool registrations.
 */

import { z } from "zod";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { RULES_DIR, SRC_DIR, TOPIC_MAP, RULE_DESCRIPTIONS } from "./config.js";
import { safeResolvePath, readFile, minifyTokens, listRuleFiles, getRuleByTopic, formatRuleList } from "./helpers.js";
import { rateLimiter } from "./rate-limiter.js";

export function registerRulesTools(server) {
  // Tool: list_rules
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
            text: `No rule files found in: ${RULES_DIR}\n\nCreate markdown files in an 'ai-rules/' folder next to your source code.`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `## Available rule files in: ${RULES_DIR}\n\n${formatRuleList(files)}\n\nUse get_rules(topic) to read any of these files.`,
        }],
      };
    }
  );

  // Tool: get_rules
  server.tool(
    "get_rules",
    "Returns the content of a specific rules file. Use topic keywords like: coding, workflow, bad, architecture, security, tokens, behavior, frontend, backend, debugging, systematic. Mode 'summary' returns description only (~20 tokens); 'full' returns entire content.",
    {
      topic: z.string().describe("Topic keyword or filename. Examples: 'coding', 'workflow', 'bad', 'behavior', '02-coding-standards.md'"),
      mode: z.enum(["summary", "full"]).default("full").describe("Return mode: 'summary' = description only (token-efficient), 'full' = entire file content"),
    },
    async ({ topic, mode }) => {
      const rateLimitHit = rateLimiter.check("get_rules");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const mappedFile = TOPIC_MAP[topic.toLowerCase()];
      let result = null;

      if (mappedFile) {
        const filePath = safeResolvePath(RULES_DIR, mappedFile);
        const content = readFile(filePath);
        if (content) result = { file: mappedFile, content };
      }

      if (!result) {
        const found = getRuleByTopic(topic);
        if (found) {
          safeResolvePath(RULES_DIR, found.file);
          result = found;
        }
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

      if (mode === "summary") {
        const desc = RULE_DESCRIPTIONS[result.file] || "Custom rule file";
        return {
          content: [{
            type: "text",
            text: `## ${result.file}\n\n${desc}\n\nCall get_rules(topic, mode='full') for complete content.`,
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `## ${result.file}\n\n${minifyTokens(result.content)}`,
        }],
      };
    }
  );

  // Tool: get_context
  server.tool(
    "get_context",
    "Returns the CONTEXT.md file for a specific module/feature folder. Always call this before editing files in a module.",
    { module_path: z.string().describe("Module folder name or path relative to src/. Examples: 'orders', 'users', 'payments'") },
    async ({ module_path }) => {
      const safeModule = module_path.replace(/\.\./g, "");
      const candidates = [
        join(SRC_DIR, safeModule, "CONTEXT.md"),
        join(resolve(process.cwd(), "src"), safeModule, "CONTEXT.md"),
        join(resolve(process.cwd()), safeModule, "CONTEXT.md"),
      ];

      for (const candidate of candidates) {
        try {
          safeResolvePath(SRC_DIR, join(safeModule, "CONTEXT.md"));
        } catch {
          continue;
        }
        if (existsSync(candidate)) {
          const content = readFile(candidate);
          return {
            content: [{
              type: "text",
              text: `## CONTEXT.md — ${safeModule}\n\n${content}`,
            }],
          };
        }
      }

      return {
        content: [{
          type: "text",
          text: `No CONTEXT.md found for module: "${safeModule}"\n\nSearched in:\n${candidates.map(c => `- ${c}`).join("\n")}\n\nCreate a CONTEXT.md in the module folder.`,
        }],
      };
    }
  );

  // Tool: get_rules_bundle (cache-aware: stable order for prefix caching)
  server.tool(
    "get_rules_bundle",
    "Returns all project rules concatenated in stable alphabetical order, optimized for prompt caching. Mode 'index' returns filenames + descriptions (~200 tokens). Mode 'full' returns all rule content concatenated. Use at session start as a cache-friendly prefix.",
    {
      mode: z.enum(["index", "full"]).default("index").describe("Return mode: 'index' = filenames + descriptions (token-efficient), 'full' = all rule content concatenated."),
    },
    async ({ mode }) => {
      const rateLimitHit = rateLimiter.check("get_rules_bundle");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const files = listRuleFiles();
      if (files.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No rule files found in: ${RULES_DIR}`,
          }],
        };
      }

      if (mode === "index") {
        const lines = files.map(f => {
          const desc = RULE_DESCRIPTIONS[f] || "Custom rule file";
          return `- **${f}** — ${desc}`;
        });
        return {
          content: [{
            type: "text",
            text: `## Rules Index (${files.length} files)\n\n${lines.join("\n")}\n\nUse get_rules(topic) for full content of any rule.`,
          }],
        };
      }

      // mode=full: concatenate all rules in stable order
      const sections = [];
      for (const file of files) {
        const content = readFile(safeResolvePath(RULES_DIR, file));
        if (content) {
          sections.push(`<!-- rule: ${file} -->\n## ${file}\n\n${minifyTokens(content)}`);
        }
      }

      const totalTokens = sections.reduce((sum, s) => sum + s.length, 0);
      return {
        content: [{
          type: "text",
          text: `## Rules Bundle (${files.length} files, ~${Math.round(totalTokens / 4)} tokens)\n\n${sections.join("\n\n---\n\n")}`,
        }],
      };
    }
  );
}
