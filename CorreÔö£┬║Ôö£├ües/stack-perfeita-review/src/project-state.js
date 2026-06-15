/**
 * Stack Perfeita MCP — Project State tools
 * get_project_state, save_project_state, checkpoint_task, list_checkpoints, resume_task
 */

import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { PROJECT_STATE_FILE, STATE_LIMITS } from "./config.js";
import { rateLimiter } from "./rate-limiter.js";

const VALID_SECTIONS = [
  "objective",
  "constraints",
  "decisions",
  "files_changed",
  "next_steps",
  "open_questions",
  "risks",
  "last_error",
];

const ARRAY_SECTIONS = new Set([
  "constraints",
  "decisions",
  "files_changed",
  "next_steps",
  "open_questions",
  "risks",
]);

export function defaultState() {
  return {
    objective: "",
    constraints: [],
    decisions: [],
    files_changed: [],
    next_steps: [],
    open_questions: [],
    risks: [],
    last_error: null,
    checkpoints: [],
    compaction_history: [],
    updated_at: new Date().toISOString(),
  };
}

function sanitizeState(state) {
  const safe = { ...defaultState(), ...state };

  for (const section of ARRAY_SECTIONS) {
    const values = Array.isArray(safe[section]) ? safe[section] : [];
    const unique = [];
    const seen = new Set();
    for (const value of values) {
      const normalized = String(value).trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      unique.push(normalized);
    }
    safe[section] = unique.slice(-STATE_LIMITS.maxArrayItems);
  }

  safe.checkpoints = Array.isArray(safe.checkpoints)
    ? safe.checkpoints.slice(-STATE_LIMITS.maxCheckpoints)
    : [];

  safe.compaction_history = Array.isArray(safe.compaction_history)
    ? safe.compaction_history.slice(-STATE_LIMITS.maxCompactionHistory)
    : [];

  safe.objective = String(safe.objective || "").trim();
  safe.last_error = safe.last_error ? String(safe.last_error).trim() : null;
  safe.updated_at = new Date().toISOString();

  return safe;
}

export function loadState(filePath = PROJECT_STATE_FILE) {
  if (!existsSync(filePath)) return defaultState();
  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return sanitizeState(data);
  } catch {
    return defaultState();
  }
}

export function saveState(state, filePath = PROJECT_STATE_FILE) {
  try {
    const targetDir = dirname(resolve(filePath));
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    const sanitized = sanitizeState(state);
    writeFileSync(filePath, JSON.stringify(sanitized, null, 2), "utf-8");
  } catch (e) {
    process.stderr.write(`Failed to save project state: ${e.message}\n`);
  }
}

function formatState(state, section) {
  if (section) {
    const value = state[section];
    if (value === undefined) return `Section "${section}" not found.`;
    if (Array.isArray(value)) {
      return value.length === 0
        ? `## ${section}\n\n(empty)`
        : `## ${section}\n\n${value.map((entry, index) => `${index + 1}. ${entry}`).join("\n")}`;
    }
    return `## ${section}\n\n${value ?? "(empty)"}`;
  }

  const lines = ["## Project State", `*Updated: ${state.updated_at}*`, ""];

  for (const key of VALID_SECTIONS) {
    const value = state[key];
    lines.push(`### ${key}`);
    if (Array.isArray(value)) {
      if (value.length === 0) lines.push("(empty)");
      else value.forEach((entry, index) => lines.push(`${index + 1}. ${entry}`));
    } else {
      lines.push(value ?? "(empty)");
    }
    lines.push("");
  }

  lines.push("### checkpoints", `${state.checkpoints?.length ?? 0} checkpoint(s) saved`, "");
  lines.push("### compaction_history", `${state.compaction_history?.length ?? 0} compacted summary(ies) saved`);

  return lines.join("\n");
}

function formatCheckpointList(checkpoints) {
  if (!checkpoints || checkpoints.length === 0) {
    return "No checkpoints found. Use checkpoint_task(label) to create one first.";
  }

  const lines = checkpoints
    .slice()
    .reverse()
    .map((checkpoint, index) => {
      const objective = checkpoint.snapshot?.objective || "(no objective)";
      return `${index + 1}. ${checkpoint.label} — ${checkpoint.timestamp}\n   objective: ${objective}`;
    });

  return `## Checkpoints (${checkpoints.length})\n\n${lines.join("\n")}`;
}

export function registerProjectStateTools(server) {
  server.tool(
    "get_project_state",
    "Returns the current project state or one specific section. Use before resuming work or making risky changes.",
    {
      section: z.enum(VALID_SECTIONS).optional().describe("Specific section to retrieve. Omit for the full state."),
    },
    async ({ section }) => {
      const rateLimitHit = rateLimiter.check("get_project_state");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const state = loadState();
      return {
        content: [{ type: "text", text: formatState(state, section) }],
      };
    }
  );

  server.tool(
    "save_project_state",
    "Updates one section of the project state. Array sections are appended with dedupe; scalar sections are replaced.",
    {
      section: z.enum(VALID_SECTIONS).describe("Which section to update."),
      content: z.string().describe("Content to save for that section."),
    },
    async ({ section, content }) => {
      const rateLimitHit = rateLimiter.check("save_project_state");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const state = loadState();
      if (ARRAY_SECTIONS.has(section)) {
        state[section] = [...state[section], content];
      } else {
        state[section] = content;
      }
      saveState(state);

      const fresh = loadState();
      return {
        content: [{
          type: "text",
          text: `Project state updated: ${section}.\n\n${formatState(fresh, section)}`,
        }],
      };
    }
  );

  server.tool(
    "checkpoint_task",
    "Creates a labeled snapshot of the current project state. Use before risky edits, refactors, or context resets.",
    {
      label: z.string().describe("Short checkpoint label, e.g. 'before-refactor' or 'auth-done'."),
    },
    async ({ label }) => {
      const rateLimitHit = rateLimiter.check("checkpoint_task");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const state = loadState();
      const { checkpoints: _ignored, ...rest } = state;
      const snapshot = JSON.parse(JSON.stringify(rest));

      state.checkpoints = state.checkpoints || [];
      state.checkpoints.push({
        label,
        timestamp: new Date().toISOString(),
        snapshot,
      });
      saveState(state);

      return {
        content: [{
          type: "text",
          text: `Checkpoint saved: \"${label}\".\n\n${formatCheckpointList(loadState().checkpoints)}`,
        }],
      };
    }
  );

  server.tool(
    "list_checkpoints",
    "Lists saved checkpoints in reverse chronological order with labels, timestamps, and snapshot objectives.",
    {},
    async () => {
      const rateLimitHit = rateLimiter.check("list_checkpoints");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const state = loadState();
      return {
        content: [{ type: "text", text: formatCheckpointList(state.checkpoints) }],
      };
    }
  );

  server.tool(
    "resume_task",
    "Restores project state from a checkpoint. If label is omitted, restores the most recent checkpoint.",
    {
      label: z.string().optional().describe("Checkpoint label to restore. Omit for most recent."),
    },
    async ({ label }) => {
      const rateLimitHit = rateLimiter.check("resume_task");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const state = loadState();
      const checkpoints = state.checkpoints || [];
      if (checkpoints.length === 0) {
        return {
          content: [{ type: "text", text: "No checkpoints found. Use checkpoint_task(label) to create one first." }],
        };
      }

      const checkpoint = label
        ? checkpoints.find((entry) => entry.label === label)
        : checkpoints[checkpoints.length - 1];

      if (!checkpoint) {
        return {
          content: [{ type: "text", text: `Checkpoint \"${label}\" not found.\n\n${formatCheckpointList(checkpoints)}` }],
        };
      }

      const restored = { ...defaultState(), ...checkpoint.snapshot, checkpoints };
      saveState(restored);

      return {
        content: [{
          type: "text",
          text: `Resumed from checkpoint: \"${checkpoint.label}\" (${checkpoint.timestamp}).\n\n${formatState(loadState())}`,
        }],
      };
    }
  );
}

export { VALID_SECTIONS };
