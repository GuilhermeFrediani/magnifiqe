/**
 * Test suite for src/profiles.js
 * Tests: PROFILES structure, content validation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PROFILES } from '../src/profiles.js';

describe('PROFILES', () => {
  it('should have claude, gpt, and gemini profiles', () => {
    assert.ok(PROFILES.claude);
    assert.ok(PROFILES.gpt);
    assert.ok(PROFILES.gemini);
  });

  it('should have all required fields in each profile', () => {
    const requiredFields = ['name', 'verbosity', 'citations', 'compaction', 'caching', 'context_limit', 'strictness', 'tool_style'];
    for (const [key, profile] of Object.entries(PROFILES)) {
      for (const field of requiredFields) {
        assert.ok(profile[field], `Profile ${key} missing field: ${field}`);
        assert.ok(typeof profile[field] === 'string', `Profile ${key}.${field} should be a string`);
        assert.ok(profile[field].length > 0, `Profile ${key}.${field} should not be empty`);
      }
    }
  });

  it('should have correct profile names', () => {
    assert.ok(PROFILES.claude.name.includes('Claude'));
    assert.ok(PROFILES.gpt.name.includes('GPT'));
    assert.ok(PROFILES.gemini.name.includes('Gemini'));
  });

  it('should mention context limits with numbers', () => {
    assert.ok(/\d+K/.test(PROFILES.claude.context_limit));
    assert.ok(/\d+K/.test(PROFILES.gpt.context_limit));
    assert.ok(/\d+[KM]/.test(PROFILES.gemini.context_limit));
  });
});
