/**
 * Stack Perfeita MCP — Rate Limiter
 * Prevents tool call loops by enforcing a max-calls-per-window policy.
 */

const rateLimiter = {
  counters: {},
  windowMs: 60000,
  maxCalls: 20,

  check(toolName) {
    const now = Date.now();
    if (!this.counters[toolName] || now - this.counters[toolName].start > this.windowMs) {
      this.counters[toolName] = { start: now, count: 1 };
      return null;
    }
    this.counters[toolName].count += 1;
    if (this.counters[toolName].count > this.maxCalls) {
      return `HALT: rate limit — tool "${toolName}" called ${this.counters[toolName].count}x in 60s. Possible loop.`;
    }
    return null;
  },
};

export { rateLimiter };
