/**
 * Test suite for src/code-reading.js
 * Tests: extractSymbols, getFileLang
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractSymbols, getFileLang } from '../src/code-reading.js';

describe('getFileLang', () => {
  it('should detect JS/TS files', () => {
    assert.strictEqual(getFileLang('test.js'), 'js');
    assert.strictEqual(getFileLang('test.ts'), 'js');
    assert.strictEqual(getFileLang('test.jsx'), 'js');
    assert.strictEqual(getFileLang('test.tsx'), 'js');
    assert.strictEqual(getFileLang('test.mjs'), 'js');
    assert.strictEqual(getFileLang('test.cjs'), 'js');
  });

  it('should detect Python files', () => {
    assert.strictEqual(getFileLang('test.py'), 'py');
  });

  it('should return null for unsupported files', () => {
    assert.strictEqual(getFileLang('test.rb'), null);
    assert.strictEqual(getFileLang('test.java'), null);
    assert.strictEqual(getFileLang('test.go'), null);
  });
});

describe('extractSymbols', () => {
  it('should extract function declarations', () => {
    const code = `function calculateTax(amount) {
  return amount * 0.1;
}`;
    const symbols = extractSymbols(code, 'js');
    assert.ok(symbols.some(s => s.name === 'calculateTax' && s.kind === 'function'));
  });

  it('should extract arrow functions', () => {
    const code = `const handleSubmit = async (event) => {
  event.preventDefault();
}`;
    const symbols = extractSymbols(code, 'js');
    assert.ok(symbols.some(s => s.name === 'handleSubmit' && s.kind === 'arrow'));
  });

  it('should extract classes', () => {
    const code = `class UserService {
  constructor(db) {
    this.db = db;
  }
}`;
    const symbols = extractSymbols(code, 'js');
    assert.ok(symbols.some(s => s.name === 'UserService' && s.kind === 'class'));
  });

  it('should extract exported functions', () => {
    const code = `export function fetchUsers() {
  return [];
}`;
    const symbols = extractSymbols(code, 'js');
    assert.ok(symbols.some(s => s.name === 'fetchUsers'));
  });

  it('should extract Python functions', () => {
    const code = `def calculate_total(items):
    return sum(item.price for item in items)`;
    const symbols = extractSymbols(code, 'py');
    assert.ok(symbols.some(s => s.name === 'calculate_total' && s.kind === 'function'));
  });

  it('should extract Python classes', () => {
    const code = `class DatabaseConnection:
    def __init__(self, url):
        self.url = url`;
    const symbols = extractSymbols(code, 'py');
    assert.ok(symbols.some(s => s.name === 'DatabaseConnection' && s.kind === 'class'));
  });

  it('should not extract control flow keywords', () => {
    const code = `if (condition) {
  for (let i = 0; i < 10; i++) {
    while (running) {}
  }
}`;
    const symbols = extractSymbols(code, 'js');
    assert.strictEqual(symbols.length, 0);
  });
});
