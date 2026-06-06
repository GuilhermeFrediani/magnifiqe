/**
 * Test suite for src/config.js (BAD_PATTERNS)
 * Tests: pattern detection, false positives, Python support
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BAD_PATTERNS } from '../src/config.js';

describe('BAD_PATTERNS', () => {
  it('should detect TypeScript any', () => {
    const code = 'const data: any = fetchData()';
    const anyPattern = BAD_PATTERNS.find(p => p.id === 'any');
    assert.ok(anyPattern.regex.test(code));
  });

  it('should detect empty catch blocks', () => {
    const code1 = 'try { foo() } catch (e) {}';
    const code2 = 'try { foo() } catch {}';
    const emptyCatchPatterns = BAD_PATTERNS.filter(p => p.id === 'empty-catch');
    assert.ok(emptyCatchPatterns.some(p => p.regex.test(code1)));
    assert.ok(emptyCatchPatterns.some(p => p.regex.test(code2)));
  });

  it('should detect blind console.log but allow structured logging', () => {
    const blindLog = 'console.log("got here")';
    const structuredLog = 'console.log({ msg: "error", userId, error: String(err) })';
    const consolePattern = BAD_PATTERNS.find(p => p.id === 'console-log');
    assert.ok(consolePattern.regex.test(blindLog));
    assert.ok(!consolePattern.regex.test(structuredLog));
  });

  it('should detect var usage', () => {
    const code = 'var x = 10';
    const varPattern = BAD_PATTERNS.find(p => p.id === 'var');
    assert.ok(varPattern.regex.test(code));
  });

  it('should detect eval', () => {
    const code = 'eval("dangerous code")';
    const evalPattern = BAD_PATTERNS.find(p => p.id === 'eval');
    assert.ok(evalPattern.regex.test(code));
  });

  it('should detect innerHTML', () => {
    const code = 'element.innerHTML = userInput';
    const innerHTMLPattern = BAD_PATTERNS.find(p => p.id === 'innerhtml');
    assert.ok(innerHTMLPattern.regex.test(code));
  });

  it('should detect inline TODO/FIXME', () => {
    const code1 = '// TODO: fix this later';
    const code2 = '// FIXME: broken logic';
    const todoPattern = BAD_PATTERNS.find(p => p.id === 'todo-inline');
    assert.ok(todoPattern.regex.test(code1));
    assert.ok(todoPattern.regex.test(code2));
  });

  it('should detect Python empty except', () => {
    const code = 'try:\n    foo()\nexcept:\n    pass';
    const exceptPattern = BAD_PATTERNS.find(p => p.id === 'empty-except');
    assert.ok(exceptPattern.regex.test(code));
  });

  it('should detect Python print debug', () => {
    const code = 'print("debug value:", x)';
    const printPattern = BAD_PATTERNS.find(p => p.id === 'print-debug');
    assert.ok(printPattern.regex.test(code));
  });
});
