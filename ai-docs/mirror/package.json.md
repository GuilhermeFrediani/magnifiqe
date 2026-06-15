# package.json

- kind: json
- lines: 56
- bytes: 1385

## Summary
No inline summary detected

## Imports
- none

## Exports
- none

## Source
```json
{
  "name": "stack-perfeita-mcp",
  "version": "4.5.0",
  "description": "MCP server that disciplines coding agents with validation, state checkpoints, context control, AI-first Markdown mirrors, and a real 5-bot Council plus Chairman.",
  "type": "module",
  "main": "src/index.js",
  "bin": {
    "stack-perfeita": "./bin/setup-ide.js",
    "stack-perfeita-mcp": "./src/index.js"
  },
  "files": [
    "src/",
    "bin/",
    "scripts/",
    "ai-rules/",
    "ai-docs/",
    ".claude/skills/",
    "README.md",
    "PROMPTS.md",
    "opencode.json",
    "package.json"
  ],
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "node --test test/*.test.js",
    "test:watch": "node --test --watch test/*.test.js",
    "test:smoke:council": "node test-smoke-council.mjs",
    "docs:ai": "node scripts/export-ai-markdown.js",
    "validate": "npm test && npm run test:smoke:council && npm run docs:ai"
  },
  "keywords": [
    "mcp",
    "cursor",
    "copilot",
    "ai-rules",
    "llm",
    "coding-standards",
    "context-engineering",
    "agent-runtime",
    "markdown-export",
    "council"
  ],
  "license": "MIT",
  "dependencies": {
    "@babel/parser": "^7.29.7",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "acorn": "^8.16.0",
    "acorn-loose": "^8.5.2",
    "zod": "^3.25.0"
  },
  "engines": {
    "node": ">=18"
  }
}

```
