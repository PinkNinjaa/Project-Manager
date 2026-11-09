/**
 * Domain vocabulary and pure helpers.
 *
 * Nothing in this file talks to the DOM or to the data store. Views import these
 * helpers; the repository imports the seed factory. That keeps the vocabulary
 * and derived calculations in one place when a real API replaces the mock.
 */

export const CURRENT_USER = {
  name: 'Jordan Mitchell',
  email: 'jordan.mitchell@contoso.com',
  role: 'Programme Manager',
  department: 'PMO'
};

export const DIRECTORY = [
  { name: 'Jordan Mitchell', email: 'jordan.mitchell@contoso.com', role: 'Programme Manager', department: 'PMO' },
  { name: 'Alicia Moreau', email: 'alicia.moreau@contoso.com', role: 'Contracts Lead', department: 'Legal' },
  { name: 'Ben Okafor', email: 'ben.okafor@contoso.com', role: 'Finance Analyst', department: 'Finance' },
  { name: 'Carla Jensen', email: 'carla.jensen@contoso.com', role: 'Programme Manager', department: 'PMO' },
  { name: 'Devin Aluko', email: 'devin.aluko@contoso.com', role: 'Records Officer', department: 'Records' },
  { name: 'Elena Petrova', email: 'elena.petrova@contoso.com', role: 'Compliance Officer', department: 'Compliance' },
  { name: 'Farid Haddad', email: 'farid.haddad@contoso.com', role: 'Procurement Lead', department: 'Procurement' },
  { name: 'Grace Lin', email: 'grace.lin@contoso.com', role: 'Director', department: 'Executive' },
  { name: 'Hugo Marsh', email: 'hugo.marsh@contoso.com', role: 'IT Systems Lead', department: 'IT' },
  { name: 'Mike Chen', email: 'mike.chen@contoso.com', role: 'Product Designer', department: 'Product' },
  { name: 'Priya Raman', email: 'priya.raman@contoso.com', role: 'Risk Analyst', department: 'Compliance' },
  { name: 'Sarah Johnson', email: 'sarah.johnson@contoso.com', role: 'Operations Lead', department: 'Operations' },
  { name: 'Taylor Bennett', email: 'taylor.bennett@contoso.com', role: 'Business Analyst', department: 'PMO' }
];

export const STATUSES = [
  { key: 'not_started', label: 'Not Started', tone: 'neutral', sort: 1 },
  { key: 'in_progress', label: 'In Progress', tone: 'warning', sort: 2 },
  { key: 'on_hold', label: 'On Hold', tone: 'danger', sort: 3 },
  { key: 'completed', label: 'Completed', tone: 'success', sort: 4 },
  { key: 'cancelled', label: 'Cancelled', tone: 'neutral', sort: 5 }
];

export const PRIORITIES = [
  { key: 'high', label: 'High', tone: 'danger', sort: 1 },
  { key: 'medium', label: 'Medium', tone: 'warning', sort: 2 },
  { key: 'low', label: 'Low', tone: 'neutral', sort: 3 }
];

export const PROJECT_TYPES = [
  { key: 'client_delivery', label: 'Client Delivery', icon: 'briefcase' },
  { key: 'product', label: 'Product', icon: 'layers' },
  { key: 'infrastructure', label: 'Infrastructure', icon: 'server' },
  { key: 'compliance', label: 'Compliance', icon: 'shield' },
  { key: 'operations', label: 'Operations', icon: 'truck' },
  { key: 'internal_tools', label: 'Internal Tools', icon: 'grid' }
];

export const TASK_STATUSES = STATUSES.filter((status) =>
  ['not_started', 'in_progress', 'on_hold', 'completed'].includes(status.key)
);

export const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((status) => [status.key, status]));
export const PRIORITY_BY_KEY = Object.fromEntries(PRIORITIES.map((priority) => [priority.key, priority]));
export const TYPE_BY_KEY = Object.fromEntries(PROJECT_TYPES.map((type) => [type.key, type]));

export const STATUS_KEYS = STATUSES.map((status) => status.key);
export const PRIORITY_KEYS = PRIORITIES.map((priority) => priority.key);
export const TYPE_KEYS = PROJECT_TYPES.map((type) => type.key);

export function getStatus(key) {
  return STATUS_BY_KEY[key] || STATUS_BY_KEY.not_started;
}

export function getPriority(key) {
  return PRIORITY_BY_KEY[key] || PRIORITY_BY_KEY.medium;
}

export function getProjectType(key) {
  return TYPE_BY_KEY[key] || TYPE_BY_KEY.client_delivery;
}

export function isOpenTask(task) {
  return task.status !== 'completed' && task.status !== 'cancelled';
}

export function isOpenProject(project) {
  return project.status !== 'completed' && project.status !== 'cancelled';
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                      */
/* -------------------------------------------------------------------------- */

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(days, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date;
}

export function todayISO() {
  return toISODate(new Date());
}

export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoDate(offsetDays = 0) {
  return toISODate(addDays(offsetDays));
}

export function isoAt(offsetDays = 0, hour = 9, minute = 0) {
  const date = addDays(offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - startOfToday().getTime()) / 86_400_000);
}

export function formatDate(value, { short = false, weekday = false } = {}) {
  const date = parseDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(short ? {} : { year: 'numeric' }),
    ...(weekday ? { weekday: 'short' } : {})
  }).format(date);
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return '—';
  const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
  return `${day}, ${time}`;
}

export function formatTime(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function relativeTime(value) {
  const date = parseDate(value);
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(date, { short: true });
}

export function taskDueInfo(task) {
  if (task.status === 'completed') {
    return {
      label: task.completedAt ? `Completed ${formatDate(task.completedAt, { short: true })}` : 'Completed',
      tone: 'success',
      days: null
    };
  }
  if (!task.dueDate) return { label: 'No due date', tone: 'neutral', days: null };
  const days = daysUntil(task.dueDate);
  if (days < 0) {
    const count = Math.abs(days);
    return {
      label: `${count} ${count === 1 ? 'day' : 'days'} overdue`,
      tone: 'danger',
      days
    };
  }
  if (days === 0) return { label: 'Due today', tone: 'warning', days };
  if (days === 1) return { label: 'Due tomorrow', tone: 'warning', days };
  if (days <= 7) return { label: `Due in ${days} days`, tone: 'warning', days };
  return { label: `Due ${formatDate(task.dueDate, { short: true })}`, tone: 'neutral', days };
}

export function projectDueInfo(project) {
  if (project.status === 'completed') {
    return {
      label: project.completedAt
        ? `Completed ${formatDate(project.completedAt, { short: true })}`
        : 'Completed',
      tone: 'success',
      days: null
    };
  }
  if (project.status === 'cancelled') return { label: 'Cancelled', tone: 'neutral', days: null };
  if (!project.dueDate) return { label: 'No target date', tone: 'neutral', days: null };
  const days = daysUntil(project.dueDate);
  if (days < 0) {
    const count = Math.abs(days);
    return {
      label: `${count} ${count === 1 ? 'day' : 'days'} overdue`,
      tone: 'danger',
      days
    };
  }
  if (days === 0) return { label: 'Due today', tone: 'warning', days };
  if (days === 1) return { label: 'Due tomorrow', tone: 'warning', days };
  if (days <= 14) return { label: `Due in ${days} days`, tone: 'warning', days };
  return { label: `Due ${formatDate(project.dueDate, { short: true })}`, tone: 'neutral', days };
}

export function isTaskOverdue(task) {
  if (!task || !isOpenTask(task) || !task.dueDate) return false;
  return daysUntil(task.dueDate) < 0;
}

export function isTaskDueToday(task) {
  if (!task || !isOpenTask(task) || !task.dueDate) return false;
  return daysUntil(task.dueDate) === 0;
}

export function isProjectOverdue(project) {
  if (!project || !isOpenProject(project) || !project.dueDate) return false;
  return daysUntil(project.dueDate) < 0;
}

/* -------------------------------------------------------------------------- */
/* Derived project/task information                                           */
/* -------------------------------------------------------------------------- */

export function projectProgress(project, tasks) {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const total = projectTasks.length;
  const completed = projectTasks.filter((task) => task.status === 'completed').length;
  const open = projectTasks.filter(isOpenTask).length;
  let percent = total === 0 ? (project.status === 'completed' ? 100 : 0) : Math.round((completed / total) * 100);
  if (project.status === 'completed') percent = 100;
  if (project.status === 'cancelled') percent = 0;
  return { total, completed, open, percent, tasks: projectTasks };
}

export function projectHealth(project, tasks) {
  if (project.status === 'completed') return { key: 'completed', label: 'Completed', tone: 'success' };
  if (project.status === 'cancelled') return { key: 'cancelled', label: 'Cancelled', tone: 'neutral' };
  if (project.status === 'on_hold') return { key: 'on_hold', label: 'On hold', tone: 'danger' };
  if (isProjectOverdue(project)) return { key: 'overdue', label: 'Overdue', tone: 'danger' };
  const { percent } = projectProgress(project, tasks);
  const days = project.dueDate ? daysUntil(project.dueDate) : null;
  if (days !== null && days <= 10 && percent < 65) {
    return { key: 'at_risk', label: 'At risk', tone: 'warning' };
  }
  return { key: 'on_track', label: 'On track', tone: 'success' };
}

export function summarizeTasks(tasks, userEmail = CURRENT_USER.email) {
  const mine = tasks.filter((task) => task.assigneeEmail === userEmail);
  return {
    all: mine,
    open: mine.filter(isOpenTask),
    completed: mine.filter((task) => task.status === 'completed'),
    overdue: mine.filter(isTaskOverdue),
    dueToday: mine.filter(isTaskDueToday)
  };
}

export function sortTasksByDue(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title);
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export function taskMatches(task, query) {
  if (!query) return true;
  const haystack = [
    task.title,
    task.description,
    task.assigneeName,
    task.status,
    task.priority
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function projectMatches(project, query) {
  if (!query) return true;
  const haystack = [
    project.name,
    project.description,
    project.id,
    project.ownerName,
    project.type,
    project.tags?.join(' ')
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function statusCounts(projects) {
  return Object.fromEntries(
    STATUSES.map((status) => [
      status.key,
      projects.filter((project) => project.status === status.key).length
    ])
  );
}

export function typeCounts(projects) {
  return PROJECT_TYPES.map((type) => ({
    ...type,
    count: projects.filter((project) => project.type === type.key).length
  }));
}

export function workload(tasks, directory = DIRECTORY) {
  const open = tasks.filter(isOpenTask);
  return directory
    .map((person) => ({
      ...person,
      open: open.filter((task) => task.assigneeEmail === person.email).length
    }))
    .filter((person) => person.open > 0)
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const AVATAR_PALETTES = [
  ['#dbeafe', '#1d4ed8'],
  ['#dcfce7', '#15803d'],
  ['#fef3c7', '#b45309'],
  ['#f3e8ff', '#7e22ce'],
  ['#fee2e2', '#b91c1c'],
  ['#cffafe', '#0e7490'],
  ['#fce7f3', '#be185d'],
  ['#e0e7ff', '#4338ca']
];

export function avatarPalette(name = '') {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export function findPerson(nameOrEmail) {
  if (!nameOrEmail) return null;
  const needle = String(nameOrEmail).toLowerCase();
  return (
    DIRECTORY.find(
      (person) =>
        person.email.toLowerCase() === needle || person.name.toLowerCase() === needle
    ) || null
  );
}

export function personEmail(nameOrEmail) {
  return findPerson(nameOrEmail)?.email || nameOrEmail || '';
}
