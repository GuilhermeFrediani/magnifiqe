#!/usr/bin/env node
/**
 * stack-perfeita-mcp v4.5.0
 * MCP server that exposes project AI rules as tools for any IDE/agent.
 *
 * Architecture: Modular — each tool category lives in its own file under src/.
 * This file is the entry point: it wires everything together and starts the server.
 *
 * Usage:
 *   node src/index.js --rules-dir /path/to/ai-rules
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolve } from "path";

// ─── Modules ─────────────────────────────────────────────────────────────────
import { RULES_DIR } from "./config.js";
import { readFile, minifyTokens } from "./helpers.js";
import { rateLimiter } from "./rate-limiter.js";
import { registerResources } from "./resources.js";
import { registerRulesTools } from "./rules.js";
import { registerValidatorsTools } from "./validators.js";
import { registerSkillsTools } from "./skills.js";
import { registerCodeReadingTools } from "./code-reading.js";
import { registerCommandsTools } from "./commands.js";
import { registerMemoryTools } from "./memory.js";
import { registerProjectStateTools } from "./project-state.js";
import { registerCompactionTools } from "./compaction.js";
import { registerProfilesTools } from "./profiles.js";
import { registerRolesTools } from "./roles.js";
import { registerTaskRuntimeTools } from "./task-runtime.js";
import { registerActivationTools } from "./activation.js";
import { registerCouncilTools } from "./council.js";

// ─── MCP Protocol Protection ─────────────────────────────────────────────────
// stdout is reserved for JSON-RPC. Any console.log breaks the protocol.
const originalConsoleLog = console.log;
console.log = (...args) => process.stderr.write(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n');

// ─── Server ──────────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "stack-perfeita-mcp",
  version: "4.5.0",
});

// ─── Register all tools and resources ─────────────────────────────────────────
registerResources(server);
registerRulesTools(server);
registerValidatorsTools(server);
registerSkillsTools(server);
registerCodeReadingTools(server);
registerCommandsTools(server);
registerMemoryTools(server);
registerProjectStateTools(server);
registerCompactionTools(server);
registerProfilesTools(server);
registerRolesTools(server);
registerTaskRuntimeTools(server);
registerActivationTools(server);
registerCouncilTools(server);

// Tool: compress_markdown (token compression utility)
server.tool(
  "compress_markdown",
  "Reads a markdown file (.md) from disk, removes HTML comments, excess whitespaces, and normalizes blank lines to aggressively save input tokens without altering the original file on disk. Returns the minified string.",
  { path: z.string().describe("Absolute path to the markdown file to compress in-memory.") },
  async ({ path }) => {
    const rateLimitHit = rateLimiter.check("compress_markdown");
    if (rateLimitHit) {
      return { content: [{ type: "text", text: rateLimitHit }] };
    }

    const absPath = resolve(path);
    const { existsSync } = await import("fs");
    if (!existsSync(absPath)) {
      return { content: [{ type: "text", text: `HALT — File not found: ${absPath}` }] };
    }

    const content = readFile(absPath);
    if (!content) {
      return { content: [{ type: "text", text: `HALT — Could not read file: ${absPath}` }] };
    }

    const minified = minifyTokens(content);
    const savings = content.length - minified.length;

    return {
      content: [{ type: "text", text: `[Compressed ${savings} chars away from context]\n\n${minified}` }],
    };
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(`stack-perfeita-mcp v4.5.0 started\nRules dir: ${RULES_DIR}\n`);

// ─── Orphan Detection ────────────────────────────────────────────────────────
// Auto-exit when parent process dies (stdin closed / ppid changed)
// Prevents zombie MCP server processes when IDE exits unexpectedly.

function gracefulExit(reason) {
  process.stderr.write(`stack-perfeita-mcp exiting: ${reason}\n`);
  process.exit(0);
}

process.stdin.on('end', () => gracefulExit('stdin ended (parent closed)'));
process.stdin.on('close', () => gracefulExit('stdin closed'));

// ppid-based orphan detection (Unix only; no-op on Windows)
if (process.platform !== 'win32') {
  const initialPpid = process.ppid;
  const heartbeat = setInterval(() => {
    if (process.ppid !== initialPpid) {
      gracefulExit(`parent died (ppid ${initialPpid} → ${process.ppid})`);
    }
  }, 30_000);
  if (heartbeat.unref) heartbeat.unref();
}
