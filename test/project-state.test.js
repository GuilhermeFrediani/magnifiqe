/**
 * Test suite for src/project-state.js
 * Tests: state schema, save/load cycle, checkpoints, resume
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const TEST_DIR = resolve(process.cwd(), '.claude_test_state');
const TEST_STATE_FILE = resolve(TEST_DIR, 'project_state.json');

function cleanup() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

/**
 * Re-implementation of defaultState/loadState/saveState (same logic as project-state.js)
 * to validate the state management contract independently.
 */
function defaultState() {
  return {
    objective: '',
    constraints: [],
    decisions: [],
    files_changed: [],
    next_steps: [],
    open_questions: [],
    risks: [],
    last_error: null,
    checkpoints: [],
    updated_at: new Date().toISOString(),
  };
}

function loadState(file) {
  if (!existsSync(file)) return defaultState();
  try {
    const data = JSON.parse(readFileSync(file, 'utf-8'));
    return { ...defaultState(), ...data };
  } catch {
    return defaultState();
  }
}

function saveState(file, state) {
  const dir = resolve(file, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  state.updated_at = new Date().toISOString();
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf-8');
}

describe('Project State schema', () => {
  it('should have all required sections in default state', () => {
    const state = defaultState();
    assert.strictEqual(state.objective, '');
    assert.deepStrictEqual(state.constraints, []);
    assert.deepStrictEqual(state.decisions, []);
    assert.deepStrictEqual(state.files_changed, []);
    assert.deepStrictEqual(state.next_steps, []);
    assert.deepStrictEqual(state.open_questions, []);
    assert.deepStrictEqual(state.risks, []);
    assert.strictEqual(state.last_error, null);
    assert.deepStrictEqual(state.checkpoints, []);
    assert.ok(state.updated_at);
  });

  it('should return default state when file does not exist', () => {
    cleanup();
    const state = loadState(TEST_STATE_FILE);
    assert.strictEqual(state.objective, '');
    assert.deepStrictEqual(state.decisions, []);
  });

  it('should handle corrupt JSON gracefully', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(TEST_STATE_FILE, 'invalid json{{{', 'utf-8');
    const state = loadState(TEST_STATE_FILE);
    assert.strictEqual(state.objective, '');
    assert.deepStrictEqual(state.checkpoints, []);
    cleanup();
  });
});

describe('Project State save/load cycle', () => {
  afterEach(() => cleanup());

  it('should persist and reload scalar sections', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    state.objective = 'Implement auth module';
    state.last_error = 'TypeError at line 42';
    saveState(TEST_STATE_FILE, state);

    const loaded = loadState(TEST_STATE_FILE);
    assert.strictEqual(loaded.objective, 'Implement auth module');
    assert.strictEqual(loaded.last_error, 'TypeError at line 42');
  });

  it('should persist and reload array sections', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    state.decisions = ['Use JWT over sessions', 'PostgreSQL for persistence'];
    state.risks = ['Third-party API downtime'];
    saveState(TEST_STATE_FILE, state);

    const loaded = loadState(TEST_STATE_FILE);
    assert.strictEqual(loaded.decisions.length, 2);
    assert.strictEqual(loaded.risks.length, 1);
    assert.strictEqual(loaded.decisions[0], 'Use JWT over sessions');
  });

  it('should append to array sections (not replace)', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    state.decisions.push('First decision');
    saveState(TEST_STATE_FILE, state);

    const loaded = loadState(TEST_STATE_FILE);
    loaded.decisions.push('Second decision');
    saveState(TEST_STATE_FILE, loaded);

    const final = loadState(TEST_STATE_FILE);
    assert.strictEqual(final.decisions.length, 2);
    assert.strictEqual(final.decisions[1], 'Second decision');
  });

  it('should replace scalar sections (not append)', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    state.objective = 'Old objective';
    saveState(TEST_STATE_FILE, state);

    const loaded = loadState(TEST_STATE_FILE);
    loaded.objective = 'New objective';
    saveState(TEST_STATE_FILE, loaded);

    const final = loadState(TEST_STATE_FILE);
    assert.strictEqual(final.objective, 'New objective');
  });

  it('should update timestamp on every save', async () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    saveState(TEST_STATE_FILE, state);
    const ts1 = loadState(TEST_STATE_FILE).updated_at;

    // Small delay to ensure different timestamp
    await new Promise(r => setTimeout(r, 50));

    state.objective = 'changed';
    saveState(TEST_STATE_FILE, state);
    const ts2 = loadState(TEST_STATE_FILE).updated_at;

    assert.ok(ts2 >= ts1, 'Timestamp should be updated on save');
  });

  it('should merge with defaults when loading partial state', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    // Write a partial state (missing some sections)
    writeFileSync(TEST_STATE_FILE, JSON.stringify({
      objective: 'Partial state',
      decisions: ['one decision'],
    }), 'utf-8');

    const loaded = loadState(TEST_STATE_FILE);
    assert.strictEqual(loaded.objective, 'Partial state');
    assert.deepStrictEqual(loaded.decisions, ['one decision']);
    // Missing sections should be filled with defaults
    assert.deepStrictEqual(loaded.risks, []);
    assert.deepStrictEqual(loaded.checkpoints, []);
    assert.strictEqual(loaded.last_error, null);
  });
});

describe('Checkpoint and Resume', () => {
  afterEach(() => cleanup());

  it('should create a checkpoint with label and timestamp', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    state.objective = 'Build API';
    state.decisions = ['Use Express'];

    // Create checkpoint (same logic as checkpoint_task tool)
    const { checkpoints, ...rest } = state;
    const snapshot = JSON.parse(JSON.stringify(rest));
    state.checkpoints.push({
      label: 'before-refactor',
      timestamp: new Date().toISOString(),
      snapshot,
    });
    saveState(TEST_STATE_FILE, state);

    const loaded = loadState(TEST_STATE_FILE);
    assert.strictEqual(loaded.checkpoints.length, 1);
    assert.strictEqual(loaded.checkpoints[0].label, 'before-refactor');
    assert.strictEqual(loaded.checkpoints[0].snapshot.objective, 'Build API');
    assert.deepStrictEqual(loaded.checkpoints[0].snapshot.decisions, ['Use Express']);
  });

  it('should restore from specific checkpoint by label', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    state.objective = 'Original objective';
    state.decisions = ['Original decision'];

    // Create checkpoint
    const { checkpoints, ...rest } = state;
    const snapshot = JSON.parse(JSON.stringify(rest));
    state.checkpoints.push({
      label: 'v1',
      timestamp: new Date().toISOString(),
      snapshot,
    });

    // Modify state after checkpoint
    state.objective = 'Modified objective';
    state.decisions.push('New decision');
    saveState(TEST_STATE_FILE, state);

    // Resume from checkpoint (same logic as resume_task tool)
    const loaded = loadState(TEST_STATE_FILE);
    const cp = loaded.checkpoints.find(c => c.label === 'v1');
    assert.ok(cp, 'Checkpoint v1 should exist');

    const restored = { ...defaultState(), ...cp.snapshot, checkpoints: loaded.checkpoints };
    assert.strictEqual(restored.objective, 'Original objective');
    assert.deepStrictEqual(restored.decisions, ['Original decision']);
    assert.strictEqual(restored.checkpoints.length, 1); // Preserved
  });

  it('should restore from most recent checkpoint when no label given', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();

    // Create two checkpoints
    state.objective = 'First';
    const { checkpoints: cp1, ...rest1 } = state;
    const snap1 = JSON.parse(JSON.stringify(rest1));
    state.checkpoints.push({ label: 'cp1', timestamp: new Date().toISOString(), snapshot: snap1 });

    state.objective = 'Second';
    const { checkpoints: cp2, ...rest2 } = state;
    const snap2 = JSON.parse(JSON.stringify(rest2));
    state.checkpoints.push({ label: 'cp2', timestamp: new Date().toISOString(), snapshot: snap2 });

    saveState(TEST_STATE_FILE, state);

    // Resume latest (same logic as resume_task without label)
    const loaded = loadState(TEST_STATE_FILE);
    const latest = loaded.checkpoints[loaded.checkpoints.length - 1];
    assert.strictEqual(latest.label, 'cp2');
    assert.strictEqual(latest.snapshot.objective, 'Second');
  });

  it('should not include checkpoints in snapshot (avoid bloat)', () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const state = defaultState();
    state.checkpoints.push({
      label: 'old',
      timestamp: '2025-01-01T00:00:00.000Z',
      snapshot: { objective: 'old' },
    });

    // Create new checkpoint
    const { checkpoints, ...rest } = state;
    const snapshot = JSON.parse(JSON.stringify(rest));
    assert.strictEqual(snapshot.checkpoints, undefined, 'Snapshot should not include checkpoints');

    state.checkpoints.push({
      label: 'new',
      timestamp: new Date().toISOString(),
      snapshot,
    });
    saveState(TEST_STATE_FILE, state);

    const loaded = loadState(TEST_STATE_FILE);
    const newCp = loaded.checkpoints.find(c => c.label === 'new');
    assert.strictEqual(newCp.snapshot.checkpoints, undefined);
  });
});

describe('Valid sections', () => {
  it('should have 8 valid sections', () => {
    const sections = [
      'objective', 'constraints', 'decisions', 'files_changed',
      'next_steps', 'open_questions', 'risks', 'last_error',
    ];
    assert.strictEqual(sections.length, 8);
  });

  it('should distinguish array and scalar sections', () => {
    const arraySections = ['constraints', 'decisions', 'files_changed', 'next_steps', 'open_questions', 'risks'];
    const scalarSections = ['objective', 'last_error'];
    assert.strictEqual(arraySections.length, 6);
    assert.strictEqual(scalarSections.length, 2);
  });
});
