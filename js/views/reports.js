import {
  STATUSES,
  isOpenProject,
  isOpenTask,
  projectDueInfo,
  projectHealth,
  projectProgress,
  sortTasksByDue,
  statusCounts,
  todayISO,
  typeCounts,
  workload
} from '../domain.js';
import { icon } from '../components/icons.js';
import {
  emptyState,
  escapeHtml,
  kpi,
  pageHeader,
  progressBar,
  projectRow,
  taskItem
} from '../components/ui.js';

const STATUS_COLORS = {
  not_started: '#94a3b8',
  in_progress: '#2563eb',
  on_hold: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#cbd5e1'
};

const TYPE_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#ea580c', '#be185d'];

let cache = { projects: [], tasks: [] };

function donutGradient(counts, total) {
  if (!total) return 'var(--surface-alt) 0 100%';
  let cursor = 0;
  return STATUSES.map((status) => {
    const start = cursor;
    cursor += (counts[status.key] / total) * 100;
    return `${STATUS_COLORS[status.key]} ${start}% ${cursor}%`;
  }).join(', ');
}

function barList(items, colors = []) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return `<div class="bar-list">${items
    .map(
      (item, index) => `<div class="bar-row">
        <div class="bar-row__top">
          <span class="bar-row__label">${escapeHtml(item.label)}</span>
          <span class="bar-row__value">${item.count}</span>
        </div>
        <div class="bar-row__track"><div class="bar-row__fill" style="width:${Math.round(
          (item.count / max) * 100
        )}%;background:${colors[index % colors.length] || 'var(--primary)'}"></div></div>
      </div>`
    )
    .join('')}</div>`;
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportCsv(projects, tasks) {
  const headers = [
    'Project ID',
    'Name',
    'Status',
    'Priority',
    'Type',
    'Owner',
    'Start date',
    'Target date',
    'Budget',
    'Progress %',
    'Open tasks',
    'Tags'
  ];
  const rows = projects.map((project) => {
    const progress = projectProgress(project, tasks);
    return [
      project.id,
      project.name,
      project.status,
      project.priority,
      project.type,
      project.ownerName,
      project.startDate || '',
      project.dueDate || '',
      project.budget ?? '',
      progress.percent,
      progress.open,
      project.tags.join('; ')
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `projectdesk-projects-${todayISO()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function render(ctx) {
  const [projects, tasks] = await Promise.all([ctx.repo.listProjects(), ctx.repo.listTasks()]);
  cache = { projects, tasks };

  const counts = statusCounts(projects);
  const types = typeCounts(projects);
  const people = workload(tasks);
  const openProjects = projects.filter(isOpenProject);
  const completed = projects.filter((project) => project.status === 'completed');
  const openTasks = tasks.filter(isOpenTask);
  const upcoming = sortTasksByDue(openTasks).slice(0, 6);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const completionRate = projects.length ? Math.round((completed.length / projects.length) * 100) : 0;
  const maxWorkload = Math.max(1, ...people.map((person) => person.open));

  const html = `${pageHeader({
    eyebrow: 'Insights',
    title: 'Reports',
    subtitle: 'A quick read on portfolio health, workload, and delivery progress.',
    actions: `<a class="btn btn--secondary" href="#/projects">${icon('folder')}Projects</a>
      <button class="btn btn--primary" type="button" id="export-csv">${icon('download')}Export CSV</button>`
  })}

  <div class="stack">
    <div class="grid grid--kpi">
      ${kpi({
        iconName: 'folder',
        tone: 'primary',
        value: projects.length,
        label: 'Total projects',
        meta: `${openProjects.length} currently open`
      })}
      ${kpi({
        iconName: 'play-circle',
        tone: 'success',
        value: projects.filter((project) => project.status === 'in_progress').length,
        label: 'In progress',
        meta: 'Active delivery'
      })}
      ${kpi({
        iconName: 'target',
        tone: 'group',
        value: `${completionRate}%`,
        label: 'Completion rate',
        meta: `${completed.length} projects delivered`
      })}
      ${kpi({
        iconName: 'check-square',
        tone: 'warn',
        value: openTasks.length,
        label: 'Open tasks',
        meta: `${tasks.length} tasks in total`
      })}
    </div>

    <div class="report-grid">
      <div class="card chart-card">
        <div class="card__head"><h2>Portfolio status</h2><span class="section-head__hint">${projects.length} projects</span></div>
        <div class="chart-card__body">
          <div class="donut-wrap">
            <div class="donut" style="--donut:conic-gradient(${donutGradient(
              counts,
              projects.length
            )})" role="img" aria-label="Projects by status">
              <div class="donut__center">
                <div class="donut__value">${projects.length}</div>
                <div class="donut__label">Projects</div>
              </div>
            </div>
            <div class="legend">
              ${STATUSES.map(
                (status) => `<div class="legend__item">
                  <span class="legend__swatch" style="--swatch:${STATUS_COLORS[status.key]}"></span>
                  <span class="legend__label">${escapeHtml(status.label)}</span>
                  <span class="legend__value">${counts[status.key]}</span>
                </div>`
              ).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card__head"><h2>Projects by type</h2><span class="section-head__hint">Portfolio mix</span></div>
        <div class="chart-card__body">
          ${barList(types, TYPE_COLORS)}
        </div>
      </div>
    </div>

    <div class="report-grid">
      <div class="card chart-card">
        <div class="card__head"><h2>Team workload</h2><span class="section-head__hint">Open tasks per person</span></div>
        <div class="chart-card__body">
          ${
            people.length
              ? `<div>${people
                  .map(
                    (person) => `<div class="workload-row">
                      <span class="workload-row__name">${escapeHtml(person.name)}</span>
                      <span class="workload-row__bar">${progressBar(
                        (person.open / maxWorkload) * 100,
                        person.open > 4 ? 'warning' : ''
                      )}</span>
                      <span class="workload-row__value">${person.open}</span>
                    </div>`
                  )
                  .join('')}</div>`
              : emptyState({
                  iconName: 'users',
                  title: 'No open work',
                  message: 'Everyone is caught up in this demo.'
                })
          }
        </div>
      </div>

      <div class="card chart-card">
        <div class="card__head"><h2>Upcoming deadlines</h2><a class="btn btn--link" href="#/tasks">My tasks ${icon('arrow-right')}</a></div>
        <div class="card__body card__body--flush">
          ${
            upcoming.length
              ? `<div class="task-list">${upcoming
                  .map((task) =>
                    taskItem(task, {
                      project: projectById.get(task.projectId),
                      showProject: true,
                      compact: true
                    })
                  )
                  .join('')}</div>`
              : emptyState({
                  iconName: 'check-circle',
                  title: 'No upcoming deadlines',
                  message: 'Open tasks with due dates will appear here.'
                })
          }
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card__head">
        <h2>Project performance</h2>
        <span class="section-head__hint">Sorted by status and name</span>
      </div>
      <div class="table-wrap">
        <table class="data-table data-table--compact">
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
            ${[...projects]
              .sort(
                (a, b) =>
                  (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0) ||
                  a.name.localeCompare(b.name)
              )
              .map((project) => projectRow(project, tasks))
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="about-box">
      <strong>About these numbers.</strong> Reports are calculated live from the demo data saved in
      this browser. Export CSV downloads a snapshot of the current project list; nothing is
      uploaded to a server. Project targets are generated when the demo is first seeded, so Reset
      demo data refreshes them relative to today.
    </div>
  </div>`;

  return {
    title: 'Reports',
    breadcrumbs: [{ label: 'Reports' }],
    html
  };
}

export function mount(ctx, root) {
  root.querySelector('#export-csv')?.addEventListener('click', () => {
    exportCsv(cache.projects, cache.tasks);
    ctx.toast('Project report downloaded.', 'success');
  });
}
