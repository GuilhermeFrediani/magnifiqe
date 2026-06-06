/**
 * Stack Perfeita MCP — Memory tools
 * save_observation, search_observations MCP tool registrations.
 * Uses JSON file for persistence (no SQLite dependency).
 */

import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { MEMORY_FILE } from "./config.js";

function loadMemory() {
  if (!existsSync(MEMORY_FILE)) return [];
  try {
    return JSON.parse(readFileSync(MEMORY_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveMemory(data) {
  try {
    const claudeDir = resolve(process.cwd(), ".claude");
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    process.stderr.write(`Failed to save memory: ${e.message}\n`);
  }
}

export function registerMemoryTools(server) {
  // Tool: save_observation
  server.tool(
    "save_observation",
    "Saves an observation, learning, or architectural decision to the session memory. This persists across sessions.",
    { observation: z.string().describe("The text of the observation to save.") },
    async ({ observation }) => {
      const mem = loadMemory();
      mem.push({ timestamp: new Date().toISOString(), text: observation });
      saveMemory(mem);
      return {
        content: [{ type: "text", text: "Observation saved successfully to session memory." }],
      };
    }
  );

  // Tool: search_observations
  server.tool(
    "search_observations",
    "Searches previously saved observations in the session memory using a keyword query.",
    { query: z.string().describe("Keyword to search for in memory.") },
    async ({ query }) => {
      const mem = loadMemory();
      const results = mem.filter(o => o.text.toLowerCase().includes(query.toLowerCase()));
      if (results.length === 0) {
        return { content: [{ type: "text", text: `No observations found matching: "${query}"` }] };
      }
      const lines = results.map(o => `[${o.timestamp}] ${o.text}`);
      return {
        content: [{ type: "text", text: `## Observations matching "${query}"\n\n${lines.join("\n")}` }],
      };
    }
  );
}
