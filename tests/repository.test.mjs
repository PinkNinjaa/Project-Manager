import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import * as repo from '../js/repository.js';
import { isoDate, todayISO } from '../js/domain.js';

beforeEach(async () => {
  await repo.reset();
});

describe('repository session and seed data', () => {
  test('exposes the fictional current user and default settings', async () => {
    const session = await repo.getSession();
    assert.equal(session.user.name, 'Jordan Mitchell');
    assert.equal(session.user.email, 'jordan.mitchell@contoso.com');
    assert.equal(session.settings.theme, 'light');
    assert.equal(session.settings.defaultView, 'dashboard');
    assert.ok(session.directory.length >= 10);
  });

  test('starts with the seeded projects, tasks, and activity', async () => {
    assert.equal((await repo.listProjects()).length, 9);
    assert.equal((await repo.listTasks()).length, 40);
    assert.equal((await repo.listActivity()).length, 29);
  });
});

describe('projects', () => {
  test('creates a project, normalizes input, and logs activity', async () => {
    const project = await repo.createProject({
      name: '  Test Project  ',
      description: 'A project created by the test suite.',
      type: 'product',
      status: 'in_progress',
      priority: 'high',
      ownerEmail: 'jordan.mitchell@contoso.com',
      startDate: todayISO(),
      dueDate: isoDate(10),
      budget: '1234',
      team: ['Jordan Mitchell', 'Grace Lin', 'Grace Lin'],
      tags: 'Alpha, Beta, Alpha'
    });

    assert.match(project.id, /^PRJ-\d{4}-\d{3}$/);
    assert.equal(project.name, 'Test Project');
    assert.equal(project.ownerName, 'Jordan Mitchell');
    assert.equal(project.budget, 1234);
    assert.deepEqual(project.team, ['Jordan Mitchell', 'Grace Lin']);
    assert.deepEqual(project.tags, ['Alpha', 'Beta']);

    const fetched = await repo.getProject(project.id);
    assert.deepEqual(fetched, project);

    const activity = await repo.listActivity({ projectId: project.id });
    assert.equal(activity.length, 1);
    assert.equal(activity[0].type, 'created');
  });

  test('updates status and records completion activity', async () => {
    const updated = await repo.updateProject('PRJ-2026-101', { status: 'completed' });
    assert.equal(updated.status, 'completed');
    assert.equal(updated.completedAt, todayISO());

    const activity = await repo.listActivity({ projectId: 'PRJ-2026-101' });
    assert.ok(activity.some((record) => record.type === 'status' && record.message.includes('Completed')));

    const reopened = await repo.updateProject('PRJ-2026-101', { status: 'in_progress' });
    assert.equal(reopened.completedAt, null);
  });

  test('deletes a project and cascades to its tasks and activity', async () => {
    assert.equal(await repo.deleteProject('PRJ-2026-101'), true);
    assert.equal(await repo.getProject('PRJ-2026-101'), null);
    assert.equal((await repo.listTasks({ projectId: 'PRJ-2026-101' })).length, 0);
    assert.equal((await repo.listActivity({ projectId: 'PRJ-2026-101' })).length, 0);
    assert.equal(await repo.deleteProject('PRJ-2026-101'), false);
  });

  test('rejects invalid projects', async () => {
    await assert.rejects(() => repo.createProject({ name: '   ' }), /Project name is required/);
    await assert.rejects(
      () =>
        repo.createProject({
          name: 'Bad dates',
          startDate: isoDate(5),
          dueDate: isoDate(1)
        }),
      /Target date cannot be before the start date/
    );
    await assert.rejects(
      () => repo.createProject({ name: 'Bad budget', budget: -5 }),
      /Budget must be zero or more/
    );
  });
});

describe('tasks', () => {
  test('creates, completes, and reopens a task with activity', async () => {
    const task = await repo.createTask({
      projectId: 'PRJ-2026-101',
      title: 'Test task',
      description: 'Created by the test suite.',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'not_started',
      priority: 'high',
      dueDate: todayISO()
    });

    assert.match(task.id, /^TSK-\d+$/);
    assert.equal(task.assigneeName, 'Jordan Mitchell');

    const completed = await repo.updateTask(task.id, { status: 'completed' });
    assert.equal(completed.status, 'completed');
    assert.equal(completed.completedAt, todayISO());

    const reopened = await repo.updateTask(task.id, { status: 'in_progress' });
    assert.equal(reopened.completedAt, null);

    const messages = (await repo.listActivity({ projectId: 'PRJ-2026-101' })).map(
      (record) => record.message
    );
    assert.ok(messages.some((message) => message.includes('Completed “Test task”')));
    assert.ok(messages.some((message) => message.includes('Reopened “Test task”')));
  });

  test('filters tasks and deletes a task', async () => {
    const mine = await repo.listTasks({ assigneeEmail: 'jordan.mitchell@contoso.com' });
    assert.ok(mine.length > 0);
    assert.ok(mine.every((task) => task.assigneeEmail === 'jordan.mitchell@contoso.com'));

    const open = await repo.listTasks({ open: true });
    assert.ok(open.every((task) => task.status !== 'completed' && task.status !== 'cancelled'));

    assert.equal(await repo.deleteTask('TSK-1001'), true);
    assert.equal(await repo.getTask('TSK-1001'), null);
    assert.equal(await repo.deleteTask('TSK-1001'), false);
  });

  test('rejects tasks without a valid project or title', async () => {
    await assert.rejects(
      () => repo.createTask({ projectId: 'missing', title: 'Orphan' }),
      /Project could not be found/
    );
    await assert.rejects(
      () => repo.createTask({ projectId: 'PRJ-2026-101', title: ' ' }),
      /Task title is required/
    );
  });

  test('temporarily reroutes a task and returns it to its original assignee on completion', async () => {
    const rerouted = await repo.rerouteTask('TSK-1001', {
      assigneeEmail: 'alicia.moreau@contoso.com',
      mode: 'temporary',
      reason: 'Covering while Jordan is away'
    });

    assert.equal(rerouted.assigneeEmail, 'alicia.moreau@contoso.com');
    assert.deepEqual(rerouted.rerouteReturnTo, {
      name: 'Jordan Mitchell',
      email: 'jordan.mitchell@contoso.com'
    });
    assert.equal(rerouted.rerouteHistory.at(-1).reason, 'Covering while Jordan is away');

    const completed = await repo.updateTask('TSK-1001', { status: 'completed' });
    assert.equal(completed.assigneeEmail, 'jordan.mitchell@contoso.com');
    assert.equal(completed.rerouteReturnTo, null);
    assert.ok(completed.rerouteHistory.at(-1).returnedAt);

    const activity = await repo.listActivity({ projectId: 'PRJ-2026-101' });
    assert.ok(activity.some((record) => record.message.includes('Temporarily rerouted')));
    assert.ok(activity.some((record) => record.message.includes('Temporary delegation returned')));
  });

  test('bulk reroutes tasks atomically and supports permanent transfers', async () => {
    const rerouted = await repo.rerouteTasks(['TSK-1001', 'TSK-1002'], {
      assigneeEmail: 'alicia.moreau@contoso.com',
      mode: 'transfer',
      reason: 'Transferred to the design owner'
    });

    assert.equal(rerouted.length, 2);
    assert.ok(rerouted.every((task) => task.assigneeEmail === 'alicia.moreau@contoso.com'));
    assert.ok(rerouted.every((task) => task.rerouteReturnTo === null));

    await assert.rejects(
      () =>
        repo.rerouteTasks(['TSK-1004', 'TSK-1005'], {
          assigneeEmail: 'mike.chen@contoso.com',
          mode: 'temporary',
          reason: 'Should not partially apply'
        }),
      /already owns at least one selected task/
    );
    assert.equal((await repo.getTask('TSK-1004')).assigneeEmail, 'mike.chen@contoso.com');
    assert.equal((await repo.getTask('TSK-1005')).assigneeEmail, 'jordan.mitchell@contoso.com');
  });

  test('rejects invalid reroutes and closed tasks', async () => {
    await assert.rejects(
      () => repo.rerouteTask('TSK-1001', { assigneeEmail: 'unknown@example.com', reason: 'Cover' }),
      /Choose an assignee from the directory/
    );
    await assert.rejects(
      () =>
        repo.rerouteTask('TSK-1001', {
          assigneeEmail: 'alicia.moreau@contoso.com',
          reason: ' '
        }),
      /Reroute reason is required/
    );
    await assert.rejects(
      () =>
        repo.rerouteTask('TSK-1003', {
          assigneeEmail: 'jordan.mitchell@contoso.com',
          reason: 'Closed task'
        }),
      /Only open tasks can be rerouted/
    );
  });
});

describe('reads, settings, and reset', () => {
  test('returns clones so callers cannot mutate stored records', async () => {
    const projects = await repo.listProjects();
    projects[0].name = 'Mutated in a test';

    const fresh = await repo.listProjects();
    assert.notEqual(fresh[0].name, 'Mutated in a test');

    const tasks = await repo.listTasks();
    tasks[0].title = 'Mutated task';
    assert.notEqual((await repo.listTasks())[0].title, 'Mutated task');
  });

  test('updates settings and restores defaults on reset', async () => {
    const settings = await repo.updateSettings({
      theme: 'dark',
      defaultView: 'reports',
      emailNotifications: false
    });

    assert.equal(settings.theme, 'dark');
    assert.equal(settings.defaultView, 'reports');
    assert.equal(settings.emailNotifications, false);

    await repo.reset();
    const reset = await repo.getSettings();
    assert.equal(reset.theme, 'light');
    assert.equal(reset.defaultView, 'dashboard');
    assert.equal(reset.emailNotifications, true);
  });

  test('rejects unknown settings values', async () => {
    await assert.rejects(() => repo.updateSettings({ theme: 'neon' }), /Theme is not valid/);
    await assert.rejects(
      () => repo.updateSettings({ defaultView: 'somewhere' }),
      /Default view is not valid/
    );
  });
});
