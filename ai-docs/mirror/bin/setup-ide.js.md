# bin/setup-ide.js

- kind: js
- lines: 163
- bytes: 5393

## Summary
stack-perfeita setup script Generates IDE configuration files and can bootstrap starter rules/skills. Usage: stack-perfeita                 # Generate IDE config files only stack-perfeita init            # Generate configs + starter ai-rules + starter skills stack-perfeita --bootstrap     # Same as init stack-perfeita --minimal       # Only .cursorrules stack-perfeita --force         # Overwrite existing files

## Imports
- `fs`
- `path`
- `url`

## Exports
- none

## Source
```js
#!/usr/bin/env node

/**
 * stack-perfeita setup script
 * Generates IDE configuration files and can bootstrap starter rules/skills.
 *
 * Usage:
 *   stack-perfeita                 # Generate IDE config files only
 *   stack-perfeita init            # Generate configs + starter ai-rules + starter skills
 *   stack-perfeita --bootstrap     # Same as init
 *   stack-perfeita --minimal       # Only .cursorrules
 *   stack-perfeita --force         # Overwrite existing files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PROJECT_DIR = process.cwd();
const args = process.argv.slice(2);

const FORCE = args.includes('--force');
const MINIMAL = args.includes('--minimal');
const BOOTSTRAP = args.includes('init') || args.includes('--bootstrap');

const IGNITION_PROMPT = `
# STACK PERFEITA MCP — IGNITION

Use Stack Perfeita as runtime discipline for this project.

## SESSION START
1. Call \`activate_project()\`
2. Call \`get_model_profile("claude")\` or the active provider
3. Call \`get_rules_bundle("index")\`
4. Call \`get_project_state()\`
5. For ambiguous or high-blast work: call \`council_gate(...)\` and start a Council session when recommended

## OPERATING MODE
- Adaptive terseness by default
- If token pressure is high: set \`CAVEMAN MODE: ACTIVE\`
- Zero excitation tokens: no filler, no warm-up, no process narration
- Rule of 2: same failure twice -> HALT and report root cause

## OUTPUT GATE
Before shipping code or claiming success:
- Run \`validate_bad_code\` for code blocks
- Run \`dependency_validate\` when new imports/assets were introduced
- Run \`validate_response_style\` before long explanatory prose when needed
- If foundation is rotten, stop feature work and fix the base first
- Prefer npm run docs:ai to generate the Markdown mirror before long AI/code-review sessions
`;

const OPENCODE_CONFIG = {
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "./ai-rules/00-project-overview.md",
    "./ai-rules/01-ai-workflow-strict.md",
    "./ai-rules/03-token-economy.md",
    "./ai-rules/05-debugging-mastery.md",
    "./ai-rules/10-llm-behavioral-rules.md",
    "./ai-rules/11-systematic-debugging.md",
    "./ai-rules/12-council-deliberation.md"
  ],
  "mcp": {
    "stack-perfeita": {
      "type": "local",
      "command": ["npx", "stack-perfeita-mcp", "--rules-dir", "./ai-rules"],
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

function copyFileSafe(src, dest, description) {
  if (fs.existsSync(dest) && !FORCE) {
    return false;
  }
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  if (description) console.log(`[+] Copied: ${description}`);
  return true;
}

function copyDirSafe(srcDir, destDir, description) {
  if (!fs.existsSync(srcDir)) return false;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirSafe(srcPath, destPath);
    } else {
      copyFileSafe(srcPath, destPath);
    }
  }

  if (description) console.log(`[+] Bootstrapped: ${description}`);
  return true;
}

console.log('Stack Perfeita MCP - IDE Setup\n');

writeFileSafe(path.join(PROJECT_DIR, '.cursorrules'), IGNITION_PROMPT, '.cursorrules');

if (!MINIMAL) {
  writeFileSafe(path.join(PROJECT_DIR, '.windsurfrules'), IGNITION_PROMPT, '.windsurfrules');

  const copilotPath = path.join(PROJECT_DIR, '.github', 'copilot-instructions.md');
  if (!fs.existsSync(copilotPath) || FORCE) {
    writeFileSafe(copilotPath, IGNITION_PROMPT, '.github/copilot-instructions.md');
  } else {
    console.log(`[~] Skipped (project-specific version exists): ${copilotPath}`);
  }

  writeFileSafe(
    path.join(PROJECT_DIR, 'opencode.json'),
    JSON.stringify(OPENCODE_CONFIG, null, 2),
    'opencode.json'
  );
}

if (BOOTSTRAP) {
  copyDirSafe(path.join(PACKAGE_ROOT, 'ai-rules'), path.join(PROJECT_DIR, 'ai-rules'), 'ai-rules/ starter pack');
  copyDirSafe(path.join(PACKAGE_ROOT, '.claude', 'skills'), path.join(PROJECT_DIR, '.claude', 'skills'), '.claude/skills starter pack');
} else if (!fs.existsSync(path.join(PROJECT_DIR, 'ai-rules'))) {
  console.log('[!] ai-rules/ not found. Run `stack-perfeita init` to bootstrap starter rules.');
}

console.log('\nSetup complete.');
if (MINIMAL) {
  console.log('- Minimal mode: only .cursorrules generated');
}
if (BOOTSTRAP) {
  console.log('- Bootstrap mode: starter ai-rules and skills copied');
}
console.log('- MCP server command for IDEs: npx stack-perfeita-mcp --rules-dir ./ai-rules');
console.log('- Optional AI docs build: npm run docs:ai');

```
