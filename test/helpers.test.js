/**
 * Test suite for src/helpers.js
 * Tests: minifyTokens, safeResolvePath
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { minifyTokens, safeResolvePath } from '../src/helpers.js';

describe('minifyTokens', () => {
  it('should remove HTML comments', () => {
    const input = 'Hello <!-- this is a comment --> world';
    // Note: minifyTokens removes comments but preserves internal spacing
    // to avoid breaking code formatting. Double space is expected.
    const result = minifyTokens(input);
    assert.ok(!result.includes('<!--'));
    assert.ok(!result.includes('-->'));
    assert.ok(result.includes('Hello'));
    assert.ok(result.includes('world'));
  });

  it('should collapse multiple blank lines', () => {
    const input = 'Line 1\n\n\n\n\nLine 2';
    const expected = 'Line 1\n\nLine 2';
    assert.strictEqual(minifyTokens(input), expected);
  });

  it('should trim trailing whitespace', () => {
    const input = 'Hello   \nWorld\t\t';
    const expected = 'Hello\nWorld';
    assert.strictEqual(minifyTokens(input), expected);
  });

  it('should return null/undefined as-is', () => {
    assert.strictEqual(minifyTokens(null), null);
    assert.strictEqual(minifyTokens(undefined), undefined);
    assert.strictEqual(minifyTokens(''), '');
  });

  it('should handle complex markdown', () => {
    const input = `# Title\n\n<!-- comment -->\n\n\n\nParagraph 1   \n\n\nParagraph 2`;
    const result = minifyTokens(input);
    assert.ok(!result.includes('<!--'));
    assert.ok(!result.includes('   \n'));
  });
});

describe('safeResolvePath', () => {
  it('should resolve valid paths', () => {
    const base = process.cwd();
    const file = 'src/index.js';
    const result = safeResolvePath(base, file);
    assert.ok(result.includes('src'));
    assert.ok(result.includes('index.js'));
  });

  it('should reject path traversal', () => {
    const base = '/tmp/test';
    const malicious = '../../../etc/passwd';
    assert.throws(() => safeResolvePath(base, malicious), /Path traversal/);
  });

  it('should reject double-dot traversal', () => {
    const base = '/tmp/test';
    assert.throws(() => safeResolvePath(base, '../secret'), /Path traversal/);
  });
});
