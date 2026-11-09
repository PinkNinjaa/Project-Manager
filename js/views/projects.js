import {
  PROJECT_TYPES,
  STATUSES,
  isOpenProject,
  projectHealth,
  projectMatches
} from '../domain.js';
import { icon } from '../components/icons.js';
import {
  emptyState,
  escapeHtml,
  kpi,
  pageHeader,
  projectCard,
  projectRow,
  selectOptions
} from '../components/ui.js';

const state = {
  query: '',
  status: 'all',
  type: 'all',
  view: 'table'
};

const STATUS_ORDER = {
  in_progress: 0,
  on_hold: 1,
  not_started: 2,
  completed: 3,
  cancelled: 4
};

let cache = { projects: [], tasks: [] };

function filteredProjects() {
  let projects = cache.projects;

  if (state.status !== 'all') projects = projects.filter((project) => project.status === state.status);
  if (state.type !== 'all') projects = projects.filter((project) => project.type === state.type);
  if (state.query.trim()) projects = projects.filter((project) => projectMatches(project, state.query.trim()));

  return [...projects].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name)
  );
}

function listMarkup() {
  const projects = filteredProjects();

  if (!projects.length) {
    return `<div class="card">${emptyState({
      iconName: 'folder',
      title: 'No projects found',
      message: 'Try a different search or filter, or create a new project.',
      action: '<a class="btn btn--primary" href="#/projects/new">New project</a>'
    })}</div>`;
  }

  if (state.view === 'cards') {
    return `<div class="project-grid">${projects
      .map((project) => projectCard(project, cache.tasks))
      .join('')}</div>`;
  }

  return `<div class="card">
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Status</th>
            <th>Health</th>
            <th>Progress</th>
            <th>Owner</th>
            <th>Target</th>
            <th><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          ${projects.map((project) => projectRow(project, cache.tasks)).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function paint(root) {
  root.querySelectorAll('[data-project-view]').forEach((button) => {
    const active = button.dataset.projectView === state.view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  const region = root.querySelector('#project-list-region');
  if (region) region.innerHTML = listMarkup();

  const count = root.querySelector('#project-count');
  if (count) {
    count.textContent = `${filteredProjects().length} of ${cache.projects.length} projects`;
  }
}

export async function render(ctx) {
  const [projects, tasks] = await Promise.all([ctx.repo.listProjects(), ctx.repo.listTasks()]);
  cache = { projects, tasks };

  const open = projects.filter(isOpenProject);
  const active = projects.filter((project) => project.status === 'in_progress');
  const needsAttention = open.filter((project) =>
    ['at_risk', 'overdue', 'on_hold'].includes(projectHealth(project, tasks).key)
  );
  const completed = projects.filter((project) => project.status === 'completed');

  const statusOptions = [
    { key: 'all', label: 'All statuses' },
    ...STATUSES.map((status) => ({ key: status.key, label: status.label }))
  ];
  const typeOptions = [
    { key: 'all', label: 'All types' },
    ...PROJECT_TYPES.map((type) => ({ key: type.key, label: type.label }))
  ];

  const html = `${pageHeader({
    eyebrow: 'Portfolio',
    title: 'Projects',
    subtitle: 'Track delivery, owners, deadlines, and the work behind each project.',
    actions: `<button class="btn btn--secondary" type="button" data-action="new-task">${icon(
      'plus'
    )}New task</button>
      <a class="btn btn--primary" href="#/projects/new">${icon('plus')}New project</a>`
  })}

  <div class="stack">
    <div class="grid grid--kpi">
      ${kpi({
        iconName: 'folder',
        tone: 'primary',
        value: projects.length,
        label: 'Total projects',
        meta: `${open.length} open`
      })}
      ${kpi({
        iconName: 'play-circle',
        tone: 'success',
        value: active.length,
        label: 'In progress',
        meta: 'Active delivery'
      })}
      ${kpi({
        iconName: 'alert-triangle',
        tone: 'warn',
        value: needsAttention.length,
        label: 'Needs attention',
        meta: 'At risk, overdue, or on hold'
      })}
      ${kpi({
        iconName: 'check-circle',
        tone: 'group',
        value: completed.length,
        label: 'Completed',
        meta: 'Delivered projects'
      })}
    </div>

    <div class="toolbar">
      <div class="toolbar__search">
        ${icon('search')}
        <input class="input" id="project-search" type="search" placeholder="Search projects, owners, or tags..." value="${escapeHtml(
          state.query
        )}" aria-label="Search projects" />
      </div>
      <select class="select" id="project-status-filter" aria-label="Filter by status">
        ${selectOptions(statusOptions, state.status)}
      </select>
      <select class="select" id="project-type-filter" aria-label="Filter by type">
        ${selectOptions(typeOptions, state.type)}
      </select>
      <span class="toolbar__spacer"></span>
      <span class="toolbar__count" id="project-count"></span>
      <div class="segmented" role="group" aria-label="Project layout">
        <button class="segmented__btn${state.view === 'table' ? ' is-active' : ''}" type="button" data-project-view="table" aria-pressed="${
          state.view === 'table'
        }" title="Table view">${icon('list')}Table</button>
        <button class="segmented__btn${state.view === 'cards' ? ' is-active' : ''}" type="button" data-project-view="cards" aria-pressed="${
          state.view === 'cards'
        }" title="Card view">${icon('layout-grid')}Cards</button>
      </div>
    </div>

    <div id="project-list-region">${listMarkup()}</div>
  </div>`;

  return {
    title: 'Projects',
    breadcrumbs: [{ label: 'Projects' }],
    html
  };
}

export function mount(ctx, root) {
  paint(root);

  root.querySelectorAll('[data-project-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.projectView;
      paint(root);
    });
  });

  root.querySelector('#project-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    paint(root);
  });

  root.querySelector('#project-status-filter')?.addEventListener('change', (event) => {
    state.status = event.target.value;
    paint(root);
  });

  root.querySelector('#project-type-filter')?.addEventListener('change', (event) => {
    state.type = event.target.value;
    paint(root);
  });
}
