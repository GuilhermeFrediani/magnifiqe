# opencode.json

- kind: json
- lines: 27
- bytes: 635

## Summary
No inline summary detected

## Imports
- none

## Exports
- none

## Source
```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "./README.md",
    "./ai-docs/compact-index.md",
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
      "command": [
        "npx",
        "stack-perfeita-mcp",
        "--rules-dir",
        "./ai-rules"
      ],
      "enabled": true
    }
  }
}

```
