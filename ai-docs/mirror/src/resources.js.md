# src/resources.js

- kind: js
- lines: 49
- bytes: 1325

## Summary
Stack Perfeita MCP — MCP Resource registrations Exposes ai-rules/*.md as MCP resources for discovery and reading.

## Imports
- `./config.js`
- `./helpers.js`

## Exports
- `registerResources`

## Source
```js
/**
 * Stack Perfeita MCP — MCP Resource registrations
 * Exposes ai-rules/*.md as MCP resources for discovery and reading.
 */

import { RULES_DIR, RULE_DESCRIPTIONS } from "./config.js";
import { safeResolvePath, readFile, listRuleFiles } from "./helpers.js";

export function registerResources(server) {
  // Resource: ai-rules-list
  server.resource(
    "ai-rules-list",
    "ai-rules://list",
    async () => {
      const files = listRuleFiles();
      const lines = files.map(f => {
        const desc = RULE_DESCRIPTIONS[f] || "Custom rule file";
        return `- **${f}** — ${desc}`;
      });
      return {
        contents: [{
          uri: "ai-rules://list",
          mimeType: "text/markdown",
          text: `## Available rule files\n\n${lines.join("\n")}`,
        }],
      };
    }
  );

  // Resource: individual rule files
  for (const file of listRuleFiles()) {
    const desc = RULE_DESCRIPTIONS[file] || "Custom rule file";
    server.resource(
      desc,
      `ai-rules://${file}`,
      async () => {
        const content = readFile(safeResolvePath(RULES_DIR, file));
        return {
          contents: [{
            uri: `ai-rules://${file}`,
            mimeType: "text/markdown",
            text: content || `File not found: ${file}`,
          }],
        };
      }
    );
  }
}

```
