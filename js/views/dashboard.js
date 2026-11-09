import {
  CURRENT_USER,
  STATUSES,
  formatDate,
  getProjectType,
  isOpenProject,
  projectHealth,
  projectProgress,
  sortTasksByDue,
  statusCounts,
  summarizeTasks
} from '../domain.js';
import { icon } from '../components/icons.js';
import {
  activityItem,
  alertRow,
  emptyState,
  escapeHtml,
  healthBadge,
  kpi,
  progressBar,
  statusBadge,
  taskItem
} from '../components/ui.js';

const STATUS_COLORS = {
  not_started: 'var(--faint)',
  in_progress: 'var(--primary)',
  on_hold: 'var(--warn-solid)',
  completed: 'var(--success-solid)',
  cancelled: 'var(--border-strong)'
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function projectHealthRow(project, tasks) {
  const type = getProjectType(project.type);
  const progress = projectProgress(project, tasks);
  const health = projectHealth(project, tasks);
  return `<a class="recent-row" href="#/projects/${escapeHtml(project.id)}">
    <span class="project-card__icon">${icon(type.icon)}</span>
    <span class="recent-row__main">
      <span class="recent-row__title">${escapeHtml(project.name)}</span>
      <span class="recent-row__sub">${statusBadge(project.status)} ${healthBadge(health)}</span>
    </span>
    <span class="recent-row__progress">${progressBar(progress.percent, health.tone)}</span>
  </a>`;
}

function barRow(label, count, max, color) {
  const width = max > 0 ? Math.round((count / max) * 100) : 0;
  return `<div class="bar-row">
    <div class="bar-row__top">
      <span class="bar-row__label">${escapeHtml(label)}</span>
      <span class="bar-row__value">${count}</span>
    </div>
    <div class="bar-row__track"><div class="bar-row__fill" style="width:${width}%;background:${color}"></div></div>
  </div>`;
}

export async function render(ctx) {
  const [projects, tasks, activity] = await Promise.all([
    ctx.repo.listProjects(),
    ctx.repo.listTasks(),
    ctx.repo.listActivity({ limit: 6 })
  ]);

  const summary = summarizeTasks(tasks);
  const openProjects = projects.filter(isOpenProject);
  const activeProjects = projects.filter((project) => project.status === 'in_progress');
  const atRisk = openProjects.filter((project) =>
    ['at_risk', 'overdue', 'on_hold'].includes(projectHealth(project, tasks).key)
  );
  const averageProgress = openProjects.length
    ? Math.round(
        openProjects.reduce((total, project) => total + projectProgress(project, tasks).percent, 0) /
          openProjects.length
      )
    : 0;

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const attentionTasks = sortTasksByDue([...summary.overdue, ...summary.dueToday]).slice(0, 4);
  const priorityTasks = sortTasksByDue(summary.open).slice(0, 6);
  const recentProjects = [...openProjects]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 4);
  const counts = statusCounts(projects);
  const maxStatus = Math.max(1, ...STATUSES.map((status) => counts[status.key]));
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const attentionBanner = attentionTasks.length
    ? `<div class="alert-banner">
        <div class="alert-banner__head">${icon('alert-triangle')} ${attentionTasks.length} ${
          attentionTasks.length === 1 ? 'task needs' : 'tasks need'
        } attention</div>
        <div class="alert-banner__list">
          ${attentionTasks.map((task) => alertRow(task, projectById.get(task.projectId))).join('')}
        </div>
        <div class="alert-banner__foot">
          <a class="btn btn--sm btn--secondary" href="#/tasks">Review my tasks ${icon('arrow-right')}</a>
        </div>
      </div>`
    : '';

  const html = `<div class="greeting">
    <div>
      <h1>${greeting()}, ${escapeHtml(CURRENT_USER.name.split(' ')[0])}</h1>
      <p>${escapeHtml(dateLabel)} · ${summary.open.length} open ${
        summary.open.length === 1 ? 'task' : 'tasks'
      } across ${activeProjects.length} active ${activeProjects.length === 1 ? 'project' : 'projects'}.</p>
    </div>
    <div class="page-header__actions">
      <a class="btn btn--secondary" href="#/reports">${icon('bar-chart')}View reports</a>
      <a class="btn btn--primary" href="#/projects/new">${icon('plus')}New project</a>
    </div>
  </div>

  <div class="stack">
    <div class="grid grid--kpi">
      ${kpi({
        href: '#/tasks',
        iconName: 'check-square',
        tone: 'primary',
        value: summary.open.length,
        label: 'My open tasks',
        meta: `${summary.dueToday.length} due today`
      })}
      ${kpi({
        href: '#/tasks',
        iconName: 'alert-triangle',
        tone: 'danger',
        value: summary.overdue.length,
        label: 'Overdue tasks',
        meta: summary.overdue.length ? 'Needs attention' : 'All clear'
      })}
      ${kpi({
        href: '#/projects',
        iconName: 'folder',
        tone: 'success',
        value: activeProjects.length,
        label: 'Active projects',
        meta: `${atRisk.length} need attention`
      })}
      ${kpi({
        iconName: 'target',
        tone: 'group',
        value: `${averageProgress}%`,
        label: 'Average progress',
        meta: `${openProjects.length} open projects`
      })}
    </div>

    ${attentionBanner}

    <div class="grid grid--dashboard">
      <div class="stack">
        <div class="card">
          <div class="card__head">
            <h2>My priority tasks</h2>
            <a class="btn btn--link" href="#/tasks">View all tasks ${icon('arrow-right')}</a>
          </div>
          <div class="card__body card__body--flush">
            ${
              priorityTasks.length
                ? `<div class="task-list">${priorityTasks
                    .map((task) =>
                      taskItem(task, {
                        project: projectById.get(task.projectId),
                        showProject: true
                      })
                    )
                    .join('')}</div>`
                : emptyState({
                    iconName: 'check-circle',
                    title: 'No open tasks',
                    message: 'Everything assigned to you is complete. Add a task or enjoy the quiet.',
                    action: '<button class="btn btn--primary" type="button" data-action="new-task">New task</button>'
                  })
            }
          </div>
          <div class="card__footer">
            <span class="text-muted">${summary.completed.length} completed ${
              summary.completed.length === 1 ? 'task' : 'tasks'
            } in this demo</span>
          </div>
        </div>

        <div class="card">
          <div class="card__head">
            <h2>Recent activity</h2>
            <span class="section-head__hint">Across all projects</span>
          </div>
          ${
            activity.length
              ? `<div class="activity-list">${activity.map(activityItem).join('')}</div>`
              : emptyState({
                  iconName: 'activity',
                  title: 'No activity yet',
                  message: 'Project and task changes will appear here.'
                })
          }
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card__head">
            <h2>Project health</h2>
            <a class="btn btn--link" href="#/projects">All projects ${icon('arrow-right')}</a>
          </div>
          <div class="card__body card__body--flush">
            ${
              recentProjects.length
                ? recentProjects.map((project) => projectHealthRow(project, tasks)).join('')
                : emptyState({
                    iconName: 'folder',
                    title: 'No open projects',
                    message: 'Create a project to start tracking work.',
                    action: '<a class="btn btn--primary" href="#/projects/new">New project</a>'
                  })
            }
          </div>
        </div>

        <div class="card">
          <div class="card__head">
            <h2>Portfolio mix</h2>
            <span class="section-head__hint">${projects.length} total</span>
          </div>
          <div class="card__body">
            <div class="bar-list">
              ${STATUSES.map((status) =>
                barRow(status.label, counts[status.key], maxStatus, STATUS_COLORS[status.key])
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  return {
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard' }],
    html
  };
}
