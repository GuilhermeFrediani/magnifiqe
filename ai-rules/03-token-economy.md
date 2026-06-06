# 03 - Token Economy & Context Management (2026)

> **META:** LLMs have limited context windows and suffer from attention degradation (lost in the middle). The goal is not just "fewer tokens" but **intentional context management**: cache, compact, clear, and recover.

## 1. Absolute Blocking of "Excitation Tokens" and Filler Words
The AI is **STRICTLY PROHIBITED** from using conversational language, preambles or conclusions.
- **DO NOT USE:** "Humm, let me think...", "I'll analyze the code...", "Got it!", "Here's the updated code", "Right, I'll do that".
- **DIRECT ACTION:** If the user asks "Create function X", the AI should only invoke the edit tool (`edit`/`write`) or return the code block. Zero accompaniment text, unless it's a specifically requested technical explanation.

```
BAD — 40 tokens of noise:
"Humm, let me think... Got it! I'll analyze the code and create the function you asked for. Here it is:"
function calculateTax(amount) { return amount * 0.1; }
"Done! The function was created successfully."

GOOD — 0 tokens of noise:
function calculateTax(amount) { return amount * 0.1; }
```

## 2. Context Management Strategy (2026)
Beyond token counting, modern LLM usage requires **active context lifecycle management**:

- **Cache:** Load rules once at session start via MCP resources. Reuse — don't re-read the same file every turn.
- **Compact:** When context fills up or after a complex task, summarize state into bullet points and discard verbose code/logs from mental context. Use `compress_markdown` tool for long documentation files.
- **Clear:** When switching topics, mentally discard previous task context. Each task gets its own "fresh window" of reasoning.
- **Recover:** If you need previous context that was cleared, use `search_observations` to retrieve saved decisions from session memory.

## 3. Semantic Summarization (Mandatory)
- During long conversations or multi-step tasks, the AI **MUST NOT** carry the complete history of failed attempts.
- **Rule:** Every 4-5 interactions in the same task, or after completing a difficult refactor, generate a short internal summary (e.g., "State: Endpoint X created. Missing Frontend Y") and mentally discard the verbose code and error logs.

## 4. Format Optimization (Structural Optimization)
- For reading or writing internal configuration data or structured plans, **prefer YAML or Markdown Lists over JSON**. JSON consumes 20-30% more tokens due to braces (`{}`) and mandatory double quotes.

## 5. Smart Log Reading (Relevance Filtering)
- **NEVER** read entire log files or error outputs exceeding 100 lines.
- If a build command fails and spits out 500 lines, use `tail -n 50` or the `read` tool with `offset` and `limit` to read only the final stack trace. Focus on the root cause error.
