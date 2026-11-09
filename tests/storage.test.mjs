import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import * as storage from '../js/storage.js';

const STORAGE_KEY = 'projectdesk.state.v1';

class FakeStorage {
  constructor() {
    this.items = new Map();
  }

  getItem(key) {
    return this.items.has(key) ? this.items.get(key) : null;
  }

  setItem(key, value) {
    this.items.set(key, String(value));
  }

  removeItem(key) {
    this.items.delete(key);
  }
}

const sample = {
  projects: [{ id: 'PRJ-2026-001', name: 'Sample project' }],
  tasks: [{ id: 'TSK-0001', projectId: 'PRJ-2026-001', title: 'Sample task' }],
  activity: [{ id: 'ACT-0001', projectId: 'PRJ-2026-001', message: 'Created' }],
  settings: { theme: 'dark', defaultView: 'reports' }
};

let fake;

beforeEach(() => {
  fake = new FakeStorage();
  globalThis.localStorage = fake;
});

after(() => {
  delete globalThis.localStorage;
});

describe('storage adapter', () => {
  test('round-trips a valid state snapshot', async () => {
    const result = await storage.saveState(sample);
    assert.equal(result.ok, true);
    assert.equal(result.persistent, true);

    assert.deepEqual(await storage.loadState(), sample);
    assert.equal(storage.getStorageStatus().persistent, true);
  });

  test('returns null when nothing has been saved', async () => {
    assert.equal(await storage.loadState(), null);
  });

  test('ignores corrupt JSON', async () => {
    fake.setItem(STORAGE_KEY, '{not valid json');
    assert.equal(await storage.loadState(), null);
  });

  test('ignores incompatible payload versions', async () => {
    fake.setItem(STORAGE_KEY, JSON.stringify({ version: 99, data: sample }));
    assert.equal(await storage.loadState(), null);
  });

  test('ignores payloads with an invalid shape', async () => {
    fake.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        data: { projects: [], tasks: [], activity: [], settings: null }
      })
    );
    assert.equal(await storage.loadState(), null);
  });

  test('clears the saved snapshot', async () => {
    await storage.saveState(sample);
    await storage.clearState();
    assert.equal(await storage.loadState(), null);
  });

  test('falls back to session storage when localStorage is unavailable', async () => {
    globalThis.localStorage = undefined;
    const result = await storage.saveState(sample);

    assert.equal(result.persistent, false);
    assert.equal(result.ok, true);
    assert.deepEqual(await storage.loadState(), sample);
  });
});
