# src/task-runtime.js

- kind: js
- lines: 145
- bytes: 4954

## Summary
Stack Perfeita MCP — Task runtime start_task_contract and assert_step_evidence MCP tool registrations.

## Imports
- `zod`
- `fs`
- `path`

## Exports
- `registerTaskRuntimeTools`
- `TASK_RUNTIME_FILE`
- `defaultTaskRuntime`
- `loadTaskRuntime`
- `saveTaskRuntime`

## Source
```js
/**
 * Stack Perfeita MCP — Task runtime
 * start_task_contract and assert_step_evidence MCP tool registrations.
 */

import { z } from "zod";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const TASK_RUNTIME_FILE = resolve(process.cwd(), ".claude", "task_runtime.json");

function defaultTaskRuntime() {
  return {
    current_contract: null,
    contracts_history: [],
    evidence_log: [],
    updated_at: new Date().toISOString(),
  };
}

function loadTaskRuntime(filePath = TASK_RUNTIME_FILE) {
  if (!existsSync(filePath)) return defaultTaskRuntime();
  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return {
      ...defaultTaskRuntime(),
      ...data,
      contracts_history: Array.isArray(data.contracts_history) ? data.contracts_history : [],
      evidence_log: Array.isArray(data.evidence_log) ? data.evidence_log : [],
    };
  } catch {
    return defaultTaskRuntime();
  }
}

function saveTaskRuntime(state, filePath = TASK_RUNTIME_FILE) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const sanitized = {
    ...defaultTaskRuntime(),
    ...state,
    contracts_history: Array.isArray(state.contracts_history) ? state.contracts_history.slice(-20) : [],
    evidence_log: Array.isArray(state.evidence_log) ? state.evidence_log.slice(-100) : [],
    updated_at: new Date().toISOString(),
  };
  writeFileSync(filePath, JSON.stringify(sanitized, null, 2), "utf-8");
}

function formatContract(contract) {
  if (!contract) return "(no active contract)";
  return [
    `- Objective: ${contract.objective}`,
    `- Inputs: ${contract.inputs}`,
    `- Outputs: ${contract.outputs}`,
    `- Non-goals: ${contract.non_goals}`,
    `- Acceptance criteria: ${contract.acceptance_criteria}`,
    `- Risks: ${contract.risks}`,
    `- Minimum evidence: ${contract.minimum_evidence}`,
    `- Created at: ${contract.created_at}`,
  ].join("\n");
}

function formatEvidence(entry) {
  return [
    `- Hypothesis: ${entry.hypothesis}`,
    `- Evidence: ${entry.evidence}`,
    `- Verification: ${entry.verification}`,
    `- Status: ${entry.status}`,
    `- Timestamp: ${entry.timestamp}`,
  ].join("\n");
}

export function registerTaskRuntimeTools(server) {
  server.tool(
    "start_task_contract",
    "Creates or updates a formal task contract with objective, inputs, outputs, non-goals, acceptance criteria, risks, and minimum evidence.",
    {
      objective: z.string().describe("Primary objective for the task."),
      inputs: z.string().describe("Important inputs, dependencies, or context."),
      outputs: z.string().describe("Expected deliverable or result."),
      non_goals: z.string().describe("What this task must not try to solve."),
      acceptance_criteria: z.string().describe("Concrete conditions required for completion."),
      risks: z.string().describe("Known risks or failure modes."),
      minimum_evidence: z.string().describe("Minimum proof required before claiming success."),
    },
    async ({ objective, inputs, outputs, non_goals, acceptance_criteria, risks, minimum_evidence }) => {
      const state = loadTaskRuntime();
      const contract = {
        objective,
        inputs,
        outputs,
        non_goals,
        acceptance_criteria,
        risks,
        minimum_evidence,
        created_at: new Date().toISOString(),
      };

      state.current_contract = contract;
      state.contracts_history = [...state.contracts_history, contract];
      saveTaskRuntime(state);

      return {
        content: [{
          type: "text",
          text: `## Task contract started\n\n${formatContract(contract)}`,
        }],
      };
    }
  );

  server.tool(
    "assert_step_evidence",
    "Registers step-level evidence with hypothesis, evidence, verification action, and status. Use to avoid claiming progress without proof.",
    {
      hypothesis: z.string().describe("What you think is true right now."),
      evidence: z.string().describe("Concrete evidence gathered so far."),
      verification: z.string().describe("What was executed or checked to verify the hypothesis."),
      status: z.enum(["pending", "verified", "falsified"]).describe("Current status of the step hypothesis."),
    },
    async ({ hypothesis, evidence, verification, status }) => {
      const state = loadTaskRuntime();
      const entry = {
        hypothesis,
        evidence,
        verification,
        status,
        timestamp: new Date().toISOString(),
      };

      state.evidence_log = [...state.evidence_log, entry];
      saveTaskRuntime(state);

      return {
        content: [{
          type: "text",
          text: `## Step evidence recorded\n\n${formatEvidence(entry)}\n\nEvidence log size: ${state.evidence_log.length}`,
        }],
      };
    }
  );
}

export { TASK_RUNTIME_FILE, defaultTaskRuntime, loadTaskRuntime, saveTaskRuntime };

```
