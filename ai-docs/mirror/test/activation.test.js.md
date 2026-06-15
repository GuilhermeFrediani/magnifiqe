# test/activation.test.js

- kind: js
- lines: 25
- bytes: 768

## Summary
Test suite for src/activation.js Tests: module loads, registerActivationTools is a function

## Imports
- `node:test`
- `node:assert`
- `../src/activation.js`

## Exports
- none

## Source
```js
/**
 * Test suite for src/activation.js
 * Tests: module loads, registerActivationTools is a function
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { registerActivationTools } from '../src/activation.js';

describe('activation module', () => {
  it('should export registerActivationTools as a function', () => {
    assert.strictEqual(typeof registerActivationTools, 'function');
  });

  it('should call registerActivationTools without throwing', () => {
    const mockServer = {
      tool: (name, desc, schema, handler) => {
        assert.strictEqual(name, 'activate_project');
        assert.ok(typeof handler === 'function');
      },
    };
    assert.doesNotThrow(() => registerActivationTools(mockServer));
  });
});

```
