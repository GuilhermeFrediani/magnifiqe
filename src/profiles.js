/**
 * Stack Perfeita MCP — Model Profiles
 * get_model_profile MCP tool registration.
 * Adapts verbosity, caching, strictness and tool style per LLM provider.
 */

import { z } from "zod";

const PROFILES = {
  claude: {
    name: "Claude (Anthropic)",
    verbosity: "Terse by default. Expand when debugging, testing, or ambiguity is high. Use bullet points over paragraphs.",
    citations: "Always reference rule file names (e.g., 'per 02-coding-standards.md') when applying rules.",
    compaction: "Use compress_markdown before reading docs > 100 lines. Use compact_conversation_state at natural breakpoints.",
    caching: "Static rules and tool definitions should be at the start of context (cache-friendly prefix). Avoid re-injecting rules every turn.",
    context_limit: "200K tokens. Keep active state under 10K. Use compaction when approaching 50% context usage.",
    strictness: "High for security and validation (never skip validate_bad_code). Adaptive for style and naming.",
    tool_style: "Call tools before asserting facts. Verify after mutations. Use checkpoint_task before risky operations.",
    cache_tool: "Call get_rules_bundle('index') at session start. Use as stable prefix for prompt caching.",
  },
  gpt: {
    name: "GPT (OpenAI)",
    verbosity: "Concise responses. Avoid preamble. Use structured output (JSON, tables) when the user needs data.",
    citations: "Reference rule names when relevant. Use function calling for tool invocations.",
    compaction: "Summarize long context before processing. Use compact_logs after build/test output.",
    caching: "System prompt should contain static rules (OpenAI caches system prompt prefixes automatically).",
    context_limit: "128K tokens (GPT-4o). Keep system prompt stable for cache hits. Rotate context via compaction.",
    strictness: "High for output schema and security. Moderate for code style (allow framework conventions).",
    tool_style: "Prefer function calling over free-text tool descriptions. Always verify tool results before responding.",
    cache_tool: "Call get_rules_bundle('index') at session start. System prompt caching is automatic — keep rules in stable prefix.",
  },
  gemini: {
    name: "Gemini (Google)",
    verbosity: "Direct and factual. Avoid hedging language. Use code blocks for all code output.",
    citations: "Reference rule file paths when applying rules. Use grounded responses with source attribution.",
    compaction: "Use context caching for stable rules. Compress documentation before reading.",
    caching: "Gemini supports context caching natively. Place static rules and project manifest in cached prefix.",
    context_limit: "1M tokens (Gemini 1.5 Pro). Larger context available but compaction still recommended for cost.",
    strictness: "High for security validation. Adaptive for style. Use validate_bad_code as gate.",
    tool_style: "Use function declarations for all tools. Verify file existence before operations.",
    cache_tool: "Call get_rules_bundle('index') at session start. Gemini supports context caching natively — place rules in cached prefix.",
  },
};

export function registerProfilesTools(server) {
  server.tool(
    "get_model_profile",
    "Returns recommended configuration for a specific LLM provider (Claude, GPT, Gemini). Covers verbosity, citations, compaction strategy, caching, context limits, strictness, and tool style. Use at session start to calibrate behavior.",
    {
      model: z.enum(["claude", "gpt", "gemini"]).describe("LLM provider to get profile for."),
    },
    async ({ model }) => {
      const profile = PROFILES[model];
      if (!profile) {
        return {
          content: [{
            type: "text",
            text: `Unknown model: ${model}. Available: ${Object.keys(PROFILES).join(", ")}`,
          }],
        };
      }

      const lines = [
        `## Profile: ${profile.name}`,
        "",
        `### Verbosity`,
        profile.verbosity,
        "",
        `### Citations`,
        profile.citations,
        "",
        `### Compaction`,
        profile.compaction,
        "",
        `### Caching`,
        profile.caching,
        "",
        `### Context Limit`,
        profile.context_limit,
        "",
        `### Strictness`,
        profile.strictness,
        "",
        `### Tool Style`,
        profile.tool_style,
        "",
        `### Cache Strategy`,
        profile.cache_tool,
      ];

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    }
  );
}

export { PROFILES };
