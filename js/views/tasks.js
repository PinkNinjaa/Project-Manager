import {
  CURRENT_USER,
  PRIORITIES,
  isOpenTask,
  isTaskOverdue,
  sortTasksByDue,
  summarizeTasks,
  taskMatches
} from '../domain.js';
import { icon } from '../components/icons.js';
import {
  emptyState,
  escapeHtml,
  kpi,
  pageHeader,
  selectOptions,
  taskItem
} from '../components/ui.js';

const state = {
  tab: 'open',
  query: '',
  priority: 'all',
  project: 'all'
};

let cache = { tasks: [], projects: [] };

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' }
];

function tabCount(tab, tasks) {
  if (tab === 'open') return tasks.filter(isOpenTask).length;
  if (tab === 'completed') return tasks.filter((task) => task.status === 'completed').length;
  if (tab === 'overdue') return tasks.filter(isTaskOverdue).length;
  return tasks.length;
}

function filterTasks() {
  const projectById = new Map(cache.projects.map((project) => [project.id, project]));
  let tasks = cache.tasks;

  if (state.tab === 'open') tasks = tasks.filter(isOpenTask);
  if (state.tab === 'completed') tasks = tasks.filter((task) => task.status === 'completed');
  if (state.tab === 'overdue') tasks = tasks.filter(isTaskOverdue);
  if (state.priority !== 'all') tasks = tasks.filter((task) => task.priority === state.priority);
  if (state.project !== 'all') tasks = tasks.filter((task) => task.projectId === state.project);
  if (state.query.trim()) {
    const query = state.query.trim().toLowerCase();
    tasks = tasks.filter((task) => {
      const project = projectById.get(task.projectId);
      return taskMatches(task, query) || (project && project.name.toLowerCase().includes(query));
    });
  }

  return {
    tasks: sortTasksByDue(tasks),
    projectById
  };
}

function listMarkup() {
  const { tasks, projectById } = filterTasks();

  if (!tasks.length) {
    const copy = {
      open: ['No open tasks', 'Nothing is assigned to you right now. Create a task to get started.'],
      all: ['No tasks found', 'Try clearing the filters or create a new task.'],
      completed: ['No completed tasks', 'Completed tasks will collect here.'],
      overdue: ['Nothing overdue', 'You are on top of every deadline.']
    }[state.tab];

    return emptyState({
      iconName: state.tab === 'overdue' ? 'check-circle' : 'inbox',
      title: copy[0],
      message: copy[1],
      action: '<button class="btn btn--primary" type="button" data-action="new-task">New task</button>'
    });
  }

  return `<div class="task-list">${tasks
    .map((task) =>
      taskItem(task, {
        project: projectById.get(task.projectId),
        showProject: true
      })
    )
    .join('')}</div>`;
}

function paint(root) {
  root.querySelectorAll('[data-task-tab]').forEach((button) => {
    const active = button.dataset.taskTab === state.tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });

  const region = root.querySelector('#task-list-region');
  if (region) region.innerHTML = listMarkup();

  const count = root.querySelector('#task-count');
  if (count) {
    const visible = filterTasks().tasks.length;
    count.textContent = `${visible} of ${cache.tasks.length} tasks`;
  }
}

export async function render(ctx) {
  const [tasks, projects] = await Promise.all([
    ctx.repo.listTasks({ assigneeEmail: CURRENT_USER.email }),
    ctx.repo.listProjects()
  ]);

  cache = { tasks, projects };
  const summary = summarizeTasks(tasks);

  const projectOptions = [
    { key: 'all', label: 'All projects' },
    ...projects.map((project) => ({ key: project.id, label: project.name }))
  ];
  const priorityOptions = [
    { key: 'all', label: 'All priorities' },
    ...PRIORITIES.map((priority) => ({ key: priority.key, label: priority.label }))
  ];

  const html = `${pageHeader({
    eyebrow: 'My work',
    title: 'My Tasks',
    subtitle: 'Everything assigned to you, grouped by status and deadline.',
    actions: `<button class="btn btn--secondary" type="button" data-action="reroute-my-tasks">${icon('arrow-right')}Reroute all open</button>
      <a class="btn btn--secondary" href="#/projects">${icon('folder')}Projects</a>
      <button class="btn btn--primary" type="button" data-action="new-task">${icon('plus')}New task</button>`
  })}

  <div class="stack">
    <div class="grid grid--kpi">
      ${kpi({
        iconName: 'check-square',
        tone: 'primary',
        value: summary.open.length,
        label: 'Open tasks',
        meta: 'Assigned to me'
      })}
      ${kpi({
        iconName: 'clock',
        tone: 'warn',
        value: summary.dueToday.length,
        label: 'Due today',
        meta: summary.dueToday.length ? 'Finish these first' : 'Nothing due today'
      })}
      ${kpi({
        iconName: 'alert-triangle',
        tone: 'danger',
        value: summary.overdue.length,
        label: 'Overdue',
        meta: summary.overdue.length ? 'Needs attention' : 'All clear'
      })}
      ${kpi({
        iconName: 'check-circle',
        tone: 'success',
        value: summary.completed.length,
        label: 'Completed',
        meta: 'In this demo'
      })}
    </div>

    <div class="toolbar">
      <div class="toolbar__search">
        ${icon('search')}
        <input class="input" id="task-search" type="search" placeholder="Search my tasks..." value="${escapeHtml(
          state.query
        )}" aria-label="Search my tasks" />
      </div>
      <select class="select" id="task-priority-filter" aria-label="Filter by priority">
        ${selectOptions(priorityOptions, state.priority)}
      </select>
      <select class="select" id="task-project-filter" aria-label="Filter by project">
        ${selectOptions(projectOptions, state.project)}
      </select>
      <span class="toolbar__spacer"></span>
      <span class="toolbar__count" id="task-count"></span>
    </div>

    <div class="card">
      <div class="tabs" style="padding:0 14px" role="tablist" aria-label="Task status">
        ${TABS.map(
          (tab) => `<button class="tab${state.tab === tab.key ? ' is-active' : ''}" type="button" role="tab" aria-selected="${
            state.tab === tab.key
          }" data-task-tab="${tab.key}">
            ${tab.label}<span class="tab__count">${tabCount(tab.key, tasks)}</span>
          </button>`
        ).join('')}
      </div>
      <div id="task-list-region">${listMarkup()}</div>
    </div>
  </div>`;

  return {
    title: 'My Tasks',
    breadcrumbs: [{ label: 'My Tasks' }],
    html
  };
}

export function mount(ctx, root) {
  paint(root);

  root.querySelectorAll('[data-task-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tab = button.dataset.taskTab;
      paint(root);
    });
  });

  root.querySelector('#task-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    paint(root);
  });

  root.querySelector('#task-priority-filter')?.addEventListener('change', (event) => {
    state.priority = event.target.value;
    paint(root);
  });

  root.querySelector('#task-project-filter')?.addEventListener('change', (event) => {
    state.project = event.target.value;
    paint(root);
  });
}
