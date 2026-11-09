/**
 * Local repository for the ProjectDesk mockup.
 *
 * This is the only module that owns mutable demo state. Every read returns a
 * clone, so views cannot accidentally mutate the store, and every write goes
 * through the small async API below. State is persisted through the storage
 * adapter in `storage.js`; a real backend can replace this file without
 * changing the views.
 */

import { createSeedData } from './data/seed.js';
import {
  clearState,
  getStorageStatus as readStorageStatus,
  loadState,
  saveState
} from './storage.js';
import {
  CURRENT_USER,
  DIRECTORY,
  PRIORITY_KEYS,
  STATUS_KEYS,
  TASK_STATUSES,
  TYPE_KEYS,
  isOpenTask,
  todayISO
} from './domain.js';

const DEFAULT_SETTINGS = Object.freeze({
  theme: 'light',
  defaultView: 'dashboard',
  emailNotifications: true,
  weeklyDigest: true,
  compactTables: false
});

const THEMES = ['light', 'dark'];
const DEFAULT_VIEWS = ['dashboard', 'tasks', 'projects', 'reports'];
const TASK_STATUS_KEYS = TASK_STATUSES.map((status) => status.key);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

let state = null;
let ready = null;

function createFreshState() {
  const seed = createSeedData();
  return {
    projects: seed.projects,
    tasks: seed.tasks,
    activity: seed.activity,
    settings: { ...DEFAULT_SETTINGS }
  };
}

function normalizeStoredSettings(input) {
  const settings = { ...DEFAULT_SETTINGS };
  if (input && typeof input === 'object') {
    if (THEMES.includes(input.theme)) settings.theme = input.theme;
    if (DEFAULT_VIEWS.includes(input.defaultView)) settings.defaultView = input.defaultView;
    for (const key of ['emailNotifications', 'weeklyDigest', 'compactTables']) {
      if (typeof input[key] === 'boolean') settings[key] = input[key];
    }
  }
  return settings;
}

function normalizeStoredState(stored) {
  return {
    projects: stored.projects,
    tasks: stored.tasks.map((task) => ({
      ...task,
      rerouteReturnTo: task.rerouteReturnTo || null,
      rerouteHistory: Array.isArray(task.rerouteHistory) ? task.rerouteHistory : []
    })),
    activity: stored.activity,
    settings: normalizeStoredSettings(stored.settings)
  };
}

async function initialize() {
  const stored = await loadState();
  if (stored) {
    state = normalizeStoredState(stored);
    return;
  }

  state = createFreshState();
  await persist();
}

function ensureReady() {
  if (!ready) ready = initialize();
  return ready;
}

async function persist() {
  await saveState(state);
}

function clone(value) {
  return structuredClone(value);
}

function nowISO() {
  return new Date().toISOString();
}

function fail(message) {
  throw new Error(message);
}

function requireText(value, label) {
  const text = String(value ?? '').trim();
  if (!text) fail(`${label} is required.`);
  return text;
}

function normalizeDate(value, label) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).slice(0, 10);
  if (!DATE_PATTERN.test(text)) fail(`${label} must be a valid date.`);
  return text;
}

function normalizeChoice(value, allowed, label, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const text = String(value);
  if (!allowed.includes(text)) fail(`${label} is not valid.`);
  return text;
}

function normalizeBudget(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) fail('Budget must be zero or more.');
  return Math.round(number);
}

function normalizeList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
}

function resolveOwner(input) {
  const byEmail = input.ownerEmail
    ? DIRECTORY.find((person) => person.email.toLowerCase() === String(input.ownerEmail).toLowerCase())
    : null;
  const byName = input.ownerName
    ? DIRECTORY.find((person) => person.name.toLowerCase() === String(input.ownerName).toLowerCase())
    : null;
  const person = byEmail || byName;

  if (person) return { ownerName: person.name, ownerEmail: person.email };
  if (!input.ownerName && !input.ownerEmail) {
    return { ownerName: CURRENT_USER.name, ownerEmail: CURRENT_USER.email };
  }

  const ownerName = requireText(input.ownerName, 'Owner');
  const ownerEmail = String(input.ownerEmail ?? '').trim();
  return { ownerName, ownerEmail };
}

function nextNumber(records, prefix, width) {
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  const highest = records.reduce((max, record) => {
    const match = String(record.id).match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return String(highest + 1).padStart(width, '0');
}

function nextProjectId() {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^PRJ-${year}-(\\d+)$`);
  const highest = state.projects.reduce((max, project) => {
    const match = project.id.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 100);
  return `PRJ-${year}-${String(highest + 1).padStart(3, '0')}`;
}

function nextTaskId() {
  return `TSK-${nextNumber(state.tasks, 'TSK-', 4)}`;
}

function nextActivityId() {
  return `ACT-${nextNumber(state.activity, 'ACT-', 4)}`;
}

function logActivity(projectId, type, message, actor = CURRENT_USER.name) {
  state.activity.push({
    id: nextActivityId(),
    projectId,
    type,
    message,
    actor,
    createdAt: nowISO()
  });
}

function touchProject(projectId) {
  const project = state.projects.find((item) => item.id === projectId);
  if (project) project.updatedAt = nowISO();
}

function normalizeProjectInput(input) {
  const status = normalizeChoice(input.status, STATUS_KEYS, 'Status', 'not_started');
  const startDate = normalizeDate(input.startDate, 'Start date');
  const dueDate = normalizeDate(input.dueDate, 'Target date');

  if (startDate && dueDate && dueDate < startDate) {
    fail('Target date cannot be before the start date.');
  }

  return {
    name: requireText(input.name, 'Project name'),
    description: String(input.description ?? '').trim(),
    status,
    priority: normalizeChoice(input.priority, PRIORITY_KEYS, 'Priority', 'medium'),
    type: normalizeChoice(input.type, TYPE_KEYS, 'Project type', 'client_delivery'),
    ...resolveOwner(input),
    startDate,
    dueDate,
    budget: normalizeBudget(input.budget),
    team: normalizeList(input.team),
    tags: normalizeList(input.tags)
  };
}

function normalizeTaskInput(input) {
  const projectId = requireText(input.projectId, 'Project');
  if (!state.projects.some((project) => project.id === projectId)) {
    fail('Project could not be found.');
  }

  const status = normalizeChoice(input.status, TASK_STATUS_KEYS, 'Status', 'not_started');
  const assigneeEmail = String(input.assigneeEmail ?? '').trim() || CURRENT_USER.email;
  const person =
    DIRECTORY.find((candidate) => candidate.email.toLowerCase() === assigneeEmail.toLowerCase()) ||
    DIRECTORY.find((candidate) => candidate.name === input.assigneeName);

  return {
    projectId,
    title: requireText(input.title, 'Task title'),
    description: String(input.description ?? '').trim(),
    assigneeName: person?.name || requireText(input.assigneeName, 'Assignee'),
    assigneeEmail: person?.email || assigneeEmail,
    status,
    priority: normalizeChoice(input.priority, PRIORITY_KEYS, 'Priority', 'medium'),
    dueDate: normalizeDate(input.dueDate, 'Due date')
  };
}

function normalizeRerouteInput(input = {}) {
  const mode = normalizeChoice(input.mode, ['temporary', 'transfer'], 'Reroute type', 'temporary');
  const assigneeEmail = requireText(input.assigneeEmail, 'Assignee email').toLowerCase();
  const assignee = DIRECTORY.find((person) => person.email.toLowerCase() === assigneeEmail);
  if (!assignee) fail('Choose an assignee from the directory.');

  return {
    mode,
    assignee,
    reason: requireText(input.reason, 'Reroute reason')
  };
}

function taskActivityMessage(task, previous) {
  if (previous && previous.status !== 'completed' && task.status === 'completed') {
    return `Completed “${task.title}”`;
  }
  if (previous && previous.status === 'completed' && task.status !== 'completed') {
    return `Reopened “${task.title}”`;
  }
  return previous ? `Updated task “${task.title}”` : `Added task “${task.title}”`;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getSession() {
  await ensureReady();
  return {
    user: clone(CURRENT_USER),
    directory: clone(DIRECTORY),
    settings: clone(state.settings)
  };
}

export async function getStorageStatus() {
  await ensureReady();
  return readStorageStatus();
}

export async function listProjects() {
  await ensureReady();
  return clone(state.projects);
}

export async function getProject(id) {
  await ensureReady();
  const project = state.projects.find((item) => item.id === id);
  return project ? clone(project) : null;
}

export async function createProject(input = {}) {
  await ensureReady();
  const data = normalizeProjectInput(input);
  const timestamp = nowISO();
  const project = {
    id: nextProjectId(),
    ...data,
    completedAt: data.status === 'completed' ? todayISO() : null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  state.projects.unshift(project);
  logActivity(project.id, 'created', 'Project created');
  await persist();
  return clone(project);
}

export async function updateProject(id, patch = {}) {
  await ensureReady();
  const index = state.projects.findIndex((item) => item.id === id);
  if (index === -1) fail('Project could not be found.');

  const previous = state.projects[index];
  const data = normalizeProjectInput({ ...previous, ...patch });
  const project = { ...previous, ...data, updatedAt: nowISO() };

  if (data.status === 'completed' && previous.status !== 'completed') {
    project.completedAt = todayISO();
  } else if (data.status !== 'completed') {
    project.completedAt = null;
  }

  state.projects[index] = project;

  if (previous.status !== project.status) {
    const label = project.status
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
    logActivity(project.id, 'status', `Status changed to ${label}`);
  } else {
    logActivity(project.id, 'updated', 'Project details updated');
  }

  await persist();
  return clone(project);
}

export async function deleteProject(id) {
  await ensureReady();
  const project = state.projects.find((item) => item.id === id);
  if (!project) return false;

  state.projects = state.projects.filter((item) => item.id !== id);
  state.tasks = state.tasks.filter((task) => task.projectId !== id);
  state.activity = state.activity.filter((record) => record.projectId !== id);
  await persist();
  return true;
}

export async function listTasks(filter = {}) {
  await ensureReady();
  let tasks = state.tasks;

  if (filter.projectId) tasks = tasks.filter((task) => task.projectId === filter.projectId);
  if (filter.assigneeEmail) {
    const email = String(filter.assigneeEmail).toLowerCase();
    tasks = tasks.filter((task) => task.assigneeEmail.toLowerCase() === email);
  }
  if (filter.status) tasks = tasks.filter((task) => task.status === filter.status);
  if (filter.open === true) tasks = tasks.filter(isOpenTask);

  return clone(tasks);
}

export async function getTask(id) {
  await ensureReady();
  const task = state.tasks.find((item) => item.id === id);
  return task ? clone(task) : null;
}

export async function createTask(input = {}) {
  await ensureReady();
  const data = normalizeTaskInput(input);
  const timestamp = nowISO();
  const task = {
    id: nextTaskId(),
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: data.status === 'completed' ? todayISO() : null
  };

  state.tasks.unshift(task);
  touchProject(task.projectId);
  logActivity(task.projectId, 'task', taskActivityMessage(task, null), CURRENT_USER.name);
  await persist();
  return clone(task);
}

export async function updateTask(id, patch = {}) {
  await ensureReady();
  const index = state.tasks.findIndex((item) => item.id === id);
  if (index === -1) fail('Task could not be found.');

  const previous = state.tasks[index];
  const data = normalizeTaskInput({ ...previous, ...patch });
  const task = { ...previous, ...data, updatedAt: nowISO() };

  if (data.status === 'completed' && previous.status !== 'completed') {
    task.completedAt = todayISO();
  } else if (data.status !== 'completed') {
    task.completedAt = null;
  } else {
    task.completedAt = previous.completedAt || todayISO();
  }

  let returnedFromTemporaryReroute = false;
  if (task.status === 'completed' && previous.rerouteReturnTo) {
    task.assigneeName = previous.rerouteReturnTo.name;
    task.assigneeEmail = previous.rerouteReturnTo.email;
    task.rerouteReturnTo = null;
    task.rerouteHistory = (previous.rerouteHistory || []).map((entry) =>
      entry.mode === 'temporary' && !entry.returnedAt && !entry.endedAt
        ? { ...entry, returnedAt: nowISO() }
        : entry
    );
    returnedFromTemporaryReroute = true;
  }

  state.tasks[index] = task;
  touchProject(task.projectId);
  logActivity(task.projectId, 'task', taskActivityMessage(task, previous), CURRENT_USER.name);
  if (returnedFromTemporaryReroute) {
    logActivity(
      task.projectId,
      'task',
      `Temporary delegation returned “${task.title}” to ${task.assigneeName}`,
      CURRENT_USER.name
    );
  }
  await persist();
  return clone(task);
}

export async function rerouteTasks(ids, input = {}) {
  await ensureReady();
  const taskIds = [...new Set((Array.isArray(ids) ? ids : [ids]).map((id) => String(id)))];
  if (!taskIds.length || taskIds.some((id) => !id)) fail('Choose at least one task to reroute.');

  const tasks = taskIds.map((id) => {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) fail('A selected task could not be found.');
    if (!isOpenTask(task)) fail('Only open tasks can be rerouted.');
    return task;
  });
  const { mode, assignee, reason } = normalizeRerouteInput(input);
  if (tasks.some((task) => task.assigneeEmail.toLowerCase() === assignee.email.toLowerCase())) {
    fail('The selected assignee already owns at least one selected task.');
  }

  const timestamp = nowISO();
  const updated = tasks.map((task) => {
    const returnTo =
      mode === 'temporary'
        ? task.rerouteReturnTo || { name: task.assigneeName, email: task.assigneeEmail }
        : null;
    const history = (task.rerouteHistory || []).map((entry) =>
      entry.mode === 'temporary' && !entry.returnedAt && !entry.endedAt
        ? { ...entry, endedAt: timestamp }
        : entry
    );
    const reroute = {
      mode,
      from: { name: task.assigneeName, email: task.assigneeEmail },
      to: { name: assignee.name, email: assignee.email },
      reason,
      createdAt: timestamp,
      returnedAt: null
    };
    return {
      ...task,
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,
      rerouteReturnTo: returnTo,
      rerouteHistory: [...history, reroute],
      updatedAt: timestamp
    };
  });

  for (const task of updated) {
    const index = state.tasks.findIndex((item) => item.id === task.id);
    state.tasks[index] = task;
    touchProject(task.projectId);
    logActivity(
      task.projectId,
      'task',
      `${mode === 'temporary' ? 'Temporarily rerouted' : 'Transferred'} “${task.title}” to ${assignee.name}: ${reason}`,
      CURRENT_USER.name
    );
  }
  await persist();
  return clone(updated);
}

export async function rerouteTask(id, input = {}) {
  const [task] = await rerouteTasks([id], input);
  return task;
}

export async function deleteTask(id) {
  await ensureReady();
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return false;

  state.tasks = state.tasks.filter((item) => item.id !== id);
  touchProject(task.projectId);
  logActivity(task.projectId, 'task', `Removed task “${task.title}”`, CURRENT_USER.name);
  await persist();
  return true;
}

export async function listActivity(filter = {}) {
  await ensureReady();
  let records = state.activity;

  if (filter.projectId) {
    records = records.filter((record) => record.projectId === filter.projectId);
  }

  const sorted = [...records].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const limited = filter.limit ? sorted.slice(0, filter.limit) : sorted;
  return clone(limited);
}

export async function getSettings() {
  await ensureReady();
  return clone(state.settings);
}

export async function updateSettings(patch = {}) {
  await ensureReady();
  const next = { ...state.settings };

  if (patch.theme !== undefined) {
    next.theme = normalizeChoice(patch.theme, THEMES, 'Theme', next.theme);
  }
  if (patch.defaultView !== undefined) {
    next.defaultView = normalizeChoice(
      patch.defaultView,
      DEFAULT_VIEWS,
      'Default view',
      next.defaultView
    );
  }
  for (const key of ['emailNotifications', 'weeklyDigest', 'compactTables']) {
    if (patch[key] !== undefined) next[key] = Boolean(patch[key]);
  }

  state.settings = next;
  await persist();
  return clone(state.settings);
}

export async function reset() {
  await ensureReady();
  state = createFreshState();
  await clearState();
  await persist();
  return getSession();
}
