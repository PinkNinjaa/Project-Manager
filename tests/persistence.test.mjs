import assert from 'node:assert/strict';
import { after, test } from 'node:test';

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

after(() => {
  delete globalThis.localStorage;
});

test('repository data survives a simulated page reload', async () => {
  globalThis.localStorage = new FakeStorage();

  const first = await import('../js/repository.js?reload=first');
  await first.reset();

  const project = await first.createProject({
    name: 'Persisted project',
    description: 'Should survive a reload.',
    status: 'in_progress',
    priority: 'high',
    type: 'product'
  });
  const task = await first.createTask({
    projectId: project.id,
    title: 'Persisted task'
  });
  await first.rerouteTask(task.id, {
    assigneeEmail: 'alicia.moreau@contoso.com',
    mode: 'temporary',
    reason: 'Persistence test'
  });
  await first.updateSettings({ theme: 'dark', compactTables: true });

  // A fresh module instance simulates loading the app again.
  const second = await import('../js/repository.js?reload=second');
  const projects = await second.listProjects();
  const tasks = await second.listTasks({ projectId: project.id });
  const settings = await second.getSettings();

  assert.ok(projects.some((item) => item.id === project.id));
  assert.ok(tasks.some((item) => item.id === task.id));
  assert.equal(tasks[0].assigneeEmail, 'alicia.moreau@contoso.com');
  assert.equal(tasks[0].rerouteReturnTo.email, 'jordan.mitchell@contoso.com');
  assert.equal(settings.theme, 'dark');
  assert.equal(settings.compactTables, true);

  // Reset clears the saved snapshot and restores the seed data.
  await second.reset();
  const third = await import('../js/repository.js?reload=third');
  assert.equal((await third.listProjects()).some((item) => item.id === project.id), false);
  assert.equal((await third.getSettings()).theme, 'light');
});
