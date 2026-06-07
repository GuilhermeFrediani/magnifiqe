/**
 * Stack Perfeita MCP — Project State tools
 * get_project_state, save_project_state, checkpoint_task, resume_task
 * Formal state management for long coding sessions: objective, decisions, risks, checkpoints.
 */

import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { PROJECT_STATE_FILE } from "./config.js";
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

export function loadState() {
  if (!existsSync(PROJECT_STATE_FILE)) return defaultState();
  try {
    const data = JSON.parse(readFileSync(PROJECT_STATE_FILE, "utf-8"));
    // Merge with defaults to ensure all sections exist
    return { ...defaultState(), ...data };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    const claudeDir = resolve(process.cwd(), ".claude");
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    state.updated_at = new Date().toISOString();
    writeFileSync(PROJECT_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
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
        : `## ${section}\n\n${value.map((v, i) => `${i + 1}. ${v}`).join("\n")}`;
    }
    return `## ${section}\n\n${value ?? "(empty)"}`;
  }

  const lines = ["## Project State", `*Updated: ${state.updated_at}*`, ""];

  for (const key of VALID_SECTIONS) {
    const value = state[key];
    if (Array.isArray(value)) {
      lines.push(`### ${key}`);
      if (value.length === 0) {
        lines.push("(empty)");
      } else {
        value.forEach((v, i) => lines.push(`${i + 1}. ${v}`));
      }
    } else {
      lines.push(`### ${key}`);
      lines.push(value ?? "(empty)");
    }
    lines.push("");
  }

  const cpCount = state.checkpoints?.length ?? 0;
  lines.push(`### checkpoints`);
  lines.push(`${cpCount} checkpoint(s) saved`);

  return lines.join("\n");
}

export function registerProjectStateTools(server) {
  // Tool: get_project_state
  server.tool(
    "get_project_state",
    "Returns the current project state (objective, decisions, risks, next_steps, etc.) or a specific section. Use this to understand where the project stands before making changes.",
    {
      section: z
        .enum(VALID_SECTIONS)
        .optional()
        .describe("Specific section to retrieve. Omit for full state."),
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

  // Tool: save_project_state
  server.tool(
    "save_project_state",
    "Updates a specific section of the project state. Use after significant decisions, file changes, or when risks/questions arise. Arrays are appended to (not replaced).",
    {
      section: z.enum(VALID_SECTIONS).describe("Which section to update."),
      content: z
        .string()
        .describe(
          "Content to save. For array sections (decisions, risks, etc.), this is appended. For scalar sections (objective, last_error), this replaces."
        ),
    },
    async ({ section, content }) => {
      const rateLimitHit = rateLimiter.check("save_project_state");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const state = loadState();

      const arraySections = [
        "constraints",
        "decisions",
        "files_changed",
        "next_steps",
        "open_questions",
        "risks",
      ];

      if (arraySections.includes(section)) {
        state[section].push(content);
      } else {
        state[section] = content;
      }

      saveState(state);

      return {
        content: [
          {
            type: "text",
            text: `Project state updated: ${section}.\n\n${formatState(state, section)}`,
          },
        ],
      };
    }
  );

  // Tool: checkpoint_task
  server.tool(
    "checkpoint_task",
    "Creates a snapshot of the current project state with a label. Use before starting risky operations or at natural breakpoints to enable rollback via resume_task.",
    {
      label: z
        .string()
        .describe("Short label for this checkpoint (e.g., 'before-refactor', 'auth-done')."),
    },
    async ({ label }) => {
      const rateLimitHit = rateLimiter.check("checkpoint_task");
      if (rateLimitHit) {
        return { content: [{ type: "text", text: rateLimitHit }] };
      }

      const state = loadState();

      // Snapshot = state without checkpoints, deep-cloned to avoid shared references
      const { checkpoints: _cp, ...rest } = state;
      const snapshot = JSON.parse(JSON.stringify(rest));

      const checkpoint = {
        label,
        timestamp: new Date().toISOString(),
        snapshot,
      };

      state.checkpoints = state.checkpoints || [];
      state.checkpoints.push(checkpoint);
      saveState(state);

      return {
        content: [
          {
            type: "text",
            text: `Checkpoint saved: "${label}" (${state.checkpoints.length} total).\n\nUse resume_task(label="${label}") to restore this state.`,
          },
        ],
      };
    }
  );

  // Tool: resume_task
  server.tool(
    "resume_task",
    "Restores project state from a checkpoint. If label is provided, restores that specific checkpoint. If omitted, restores the most recent checkpoint. Use when resuming a session or after a failed operation.",
    {
      label: z
        .string()
        .optional()
        .describe("Checkpoint label to restore. Omit for most recent."),
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
          content: [
            {
              type: "text",
              text: "No checkpoints found. Use checkpoint_task(label) to create one first.",
            },
          ],
        };
      }

      let checkpoint;
      if (label) {
        checkpoint = checkpoints.find((cp) => cp.label === label);
        if (!checkpoint) {
          const available = checkpoints.map((cp) => `- ${cp.label} (${cp.timestamp})`).join("\n");
          return {
            content: [
              {
                type: "text",
                text: `Checkpoint "${label}" not found.\n\nAvailable checkpoints:\n${available}`,
              },
            ],
          };
        }
      } else {
        checkpoint = checkpoints[checkpoints.length - 1];
      }

      // Restore snapshot into current state, keep checkpoints history
      const restored = { ...defaultState(), ...checkpoint.snapshot, checkpoints };
      saveState(restored);

      return {
        content: [
          {
            type: "text",
            text: `Resumed from checkpoint: "${checkpoint.label}" (${checkpoint.timestamp}).\n\n${formatState(restored)}`,
          },
        ],
      };
    }
  );
}
