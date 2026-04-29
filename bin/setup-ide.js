#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.cwd();

// O "Ignition Prompt" embutido direto nas regras da IDE
const IGNITION_PROMPT = `
# ⚡ STACK-PERFEITA MCP - CORE INSTRUCTIONS ⚡

You are operating under the "Stack-Perfeita" strict ruleset.
You MUST use the connected MCP server for codebase validation.

## 🔴 IGNITION SEQUENCE (DO THIS FIRST)
Before answering the first user prompt in a new session:
1. Call \`stack-perfeita_get_rules({ topic: "10-llm-behavioral-rules.md", mode: "summary" })\`
2. Call \`stack-perfeita_list_skills()\`

## 🔴 CAVEMAN MODE (ZERO FLUFF)
- NEVER use conversational filler ("Humm", "Here is the code", "Entendido").
- BE EXTREMELY TERSE. Use fragments. Drop articles. Use arrows (->) for causality.
- THE "RULE OF 2": If a command/test fails TWICE for the same reason, HALT. Do not try a 3rd time blindly.
- ALWAYS run \`stack-perfeita_validate_bad_code\` BEFORE outputting any code block.
- ALWAYS run \`stack-perfeita_dependency_validate\` AFTER suggesting new imports.

## 🔴 OUTPUT-GATE
Do not deliver a response without checking:
- [ ] Requirements met?
- [ ] validate_bad_code: PASS?
- [ ] dependency_validate: PASS?
- [ ] Caveman Mode / Zero tokens de excitação?
`;

const configs = [
  {
    file: '.cursorrules',
    content: IGNITION_PROMPT
  },
  {
    file: '.windsurfrules',
    content: IGNITION_PROMPT
  },
  {
    file: '.github/copilot-instructions.md',
    content: IGNITION_PROMPT,
    preDir: '.github'
  },
  {
    file: 'opencode.json',
    content: JSON.stringify({
      name: "Stack-Perfeita Agent",
      description: "Strict Caveman Style coding agent.",
      instructions: IGNITION_PROMPT
    }, null, 2)
  }
];

console.log('⚡ Conectando projeto atual ao MCP Stack-Perfeita...');

configs.forEach(({ file, content, preDir }) => {
  if (preDir) {
    const dirPath = path.join(PROJECT_DIR, preDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  const filePath = path.join(PROJECT_DIR, file);
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log(`[✓] Arquivo gerado: ${file}`);
});

console.log('\n🚀 Integração concluída! Sua IDE agora está forçada a seguir as regras do MCP.');
