/**
 * Stack Perfeita MCP — Memory tools
 * save_observation, search_observations.
 * Uses JSON file persistence with simple dedupe + trimming.
 */

import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { MEMORY_FILE, STATE_LIMITS } from "./config.js";

function normalizeMemory(data) {
  if (!Array.isArray(data)) return [];
  const unique = [];
  const seen = new Set();

  for (const item of data) {
    const text = String(item?.text || "").trim();
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    unique.push({
      timestamp: item?.timestamp || new Date().toISOString(),
      text,
    });
  }

  return unique.slice(-STATE_LIMITS.maxObservations);
}

function loadMemory(filePath = MEMORY_FILE) {
  if (!existsSync(filePath)) return [];
  try {
    return normalizeMemory(JSON.parse(readFileSync(filePath, "utf-8")));
  } catch {
    return [];
  }
}

function saveMemory(data, filePath = MEMORY_FILE) {
  try {
    const dir = dirname(resolve(filePath));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(normalizeMemory(data), null, 2), "utf-8");
  } catch (e) {
    process.stderr.write(`Failed to save memory: ${e.message}\n`);
  }
}

export function registerMemoryTools(server) {
  server.tool(
    "save_observation",
    "Saves an observation, learning, or architectural decision to persistent session memory. Duplicate entries are deduped.",
    { observation: z.string().describe("Observation text to save.") },
    async ({ observation }) => {
      const memory = loadMemory();
      memory.push({ timestamp: new Date().toISOString(), text: observation });
      saveMemory(memory);
      return {
        content: [{ type: "text", text: "Observation saved to session memory." }],
      };
    }
  );

  server.tool(
    "search_observations",
    "Searches saved observations using a keyword query.",
    { query: z.string().describe("Keyword to search for in memory.") },
    async ({ query }) => {
      const memory = loadMemory();
      const results = memory.filter((entry) => entry.text.toLowerCase().includes(query.toLowerCase()));

      if (results.length === 0) {
        return { content: [{ type: "text", text: `No observations found matching: \"${query}\"` }] };
      }

      const lines = results.map((entry) => `[${entry.timestamp}] ${entry.text}`);
      return {
        content: [{ type: "text", text: `## Observations matching \"${query}\"\n\n${lines.join("\n")}` }],
      };
    }
  );
}
