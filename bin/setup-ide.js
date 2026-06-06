#!/usr/bin/env node

/**
 * stack-perfeita setup script
 * Generates IDE configuration files for Stack Perfeita MCP integration.
 * 
 * Usage:
 *   stack-perfeita           # Generate all config files
 *   stack-perfeita --minimal # Only .cursorrules
 *   stack-perfeita --force   # Overwrite existing files without asking
 */

import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.cwd();
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const MINIMAL = args.includes('--minimal');

// The Ignition Prompt embedded directly in IDE rules
const IGNITION_PROMPT = `
# STACK-PERFEITA MCP - CORE INSTRUCTIONS

You are operating under the "Stack-Perfeita" strict ruleset.
You MUST use the connected MCP server for codebase validation.

## IGNITION SEQUENCE (DO THIS FIRST)
Before answering the first user prompt in a new session:
1. Call \`list_rules()\` to see available rules
2. Call \`get_rules({ topic: "behavior", mode: "summary" })\`

## CAVEMAN MODE (ZERO FLUFF)
- NEVER use conversational filler ("Humm", "Here is the code", "Understood").
- BE EXTREMELY TERSE. Use fragments. Drop articles. Use arrows (->) for causality.
- THE "RULE OF 2": If a command/test fails TWICE for the same reason, HALT. Do not try a 3rd time blindly.
- ALWAYS run \`validate_bad_code\` BEFORE outputting any code block.
- ALWAYS run \`dependency_validate\` AFTER suggesting new imports.

## OUTPUT-GATE
Do not deliver a response without checking:
- [ ] Requirements met?
- [ ] validate_bad_code: PASS?
- [ ] dependency_validate: PASS?
- [ ] Caveman Mode / Zero excitation tokens?
`;

const OPENCODE_CONFIG = {
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "./ai-rules/00-project-overview.md",
    "./ai-rules/01-ai-workflow-strict.md",
    "./ai-rules/03-token-economy.md",
    "./ai-rules/05-debugging-mastery.md",
    "./ai-rules/10-llm-behavioral-rules.md"
  ],
  "mcp": {
    "stack-perfeita": {
      "type": "local",
      "command": ["node", "./src/index.js", "--rules-dir", "./ai-rules"],
      "enabled": true
    }
  }
};

function writeFileSafe(filePath, content, description) {
  if (fs.existsSync(filePath) && !FORCE) {
    console.log(`[~] Skipped (already exists): ${filePath}`);
    return false;
  }
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log(`[+] Generated: ${description}`);
  return true;
}

console.log('Stack Perfeita MCP - IDE Setup\n');

// Always generate .cursorrules
writeFileSafe(
  path.join(PROJECT_DIR, '.cursorrules'),
  IGNITION_PROMPT,
  '.cursorrules'
);

if (!MINIMAL) {
  // .windsurfrules
  writeFileSafe(
    path.join(PROJECT_DIR, '.windsurfrules'),
    IGNITION_PROMPT,
    '.windsurfrules'
  );

  // .github/copilot-instructions.md - ONLY if it doesn't exist
  // (don't overwrite a rich, project-specific version with our generic one)
  const copilotPath = path.join(PROJECT_DIR, '.github', 'copilot-instructions.md');
  if (!fs.existsSync(copilotPath) || FORCE) {
    writeFileSafe(copilotPath, IGNITION_PROMPT, '.github/copilot-instructions.md');
  } else {
    console.log(`[~] Skipped (project-specific version exists): ${copilotPath}`);
  }

  // opencode.json
  writeFileSafe(
    path.join(PROJECT_DIR, 'opencode.json'),
    JSON.stringify(OPENCODE_CONFIG, null, 2),
    'opencode.json'
  );
}

console.log('\nSetup complete! Your IDE is now configured to follow Stack Perfeita rules.');
if (MINIMAL) {
  console.log('(Minimal mode: only .cursorrules generated)');
}
