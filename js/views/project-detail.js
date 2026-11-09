import {
  formatDate,
  formatCurrency,
  getProjectType,
  projectDueInfo,
  projectHealth,
  projectProgress,
  sortTasksByDue
} from '../domain.js';
import { icon } from '../components/icons.js';
import {
  activityItem,
  avatar,
  dueClass,
  emptyState,
  escapeHtml,
  healthBadge,
  priorityBadge,
  progressBar,
  statusBadge,
  taskItem,
  timelineItem,
  typeBadge
} from '../components/ui.js';

const state = {
  projectId: null,
  tab: 'overview'
};

let cache = null;

function tabCountLabel(count) {
  return `<span class="tab__count">${count}</span>`;
}

function panelMarkup() {
  if (!cache) return '';

  const { project, tasks, activity, progress } = cache;

  if (state.tab === 'tasks') {
    const sorted = sortTasksByDue(tasks);
    return `<div class="card__head">
        <h3>Project tasks</h3>
        <button class="btn btn--secondary btn--sm" type="button" data-action="new-task" data-project-id="${escapeHtml(
          project.id
        )}">${icon('plus')}Add task</button>
      </div>
      <div class="card__body card__body--flush">
        ${
          sorted.length
            ? `<div class="task-list">${sorted
                .map((task) => taskItem(task, { showProject: false }))
                .join('')}</div>`
            : emptyState({
                iconName: 'check-square',
                title: 'No tasks yet',
                message: 'Break the project down into a few clear next steps.',
                action: `<button class="btn btn--primary" type="button" data-action="new-task" data-project-id="${escapeHtml(
                  project.id
                )}">Add the first task</button>`
              })
        }
      </div>`;
  }

  if (state.tab === 'activity') {
    return `<div class="card__head">
        <h3>Activity</h3>
        <span class="section-head__hint">${activity.length} events</span>
      </div>
      ${
        activity.length
          ? `<div class="timeline">${activity.map(timelineItem).join('')}</div>`
          : emptyState({
              iconName: 'activity',
              title: 'No activity yet',
              message: 'Changes to this project and its tasks will appear here.'
            })
      }`;
  }

  return `<div class="card__body">
      <div class="about-box">
        <strong>About this project</strong>
        <p style="margin-top:6px">${escapeHtml(project.description || 'No description has been added yet.')}</p>
      </div>
      <div class="grid grid--3" style="margin-top:18px">
        <div>
          <div class="kpi__label">Tasks complete</div>
          <div class="kpi__value">${progress.completed}<span class="text-faint" style="font-size:16px"> / ${progress.total}</span></div>
          <div class="kpi__meta">${progress.open} still open</div>
        </div>
        <div>
          <div class="kpi__label">Team</div>
          <div class="kpi__value">${project.team.length}</div>
          <div class="kpi__meta">${project.team.length ? 'People contributing' : 'No team assigned'}</div>
        </div>
        <div>
          <div class="kpi__label">Budget</div>
          <div class="kpi__value" style="font-size:22px">${escapeHtml(formatCurrency(project.budget))}</div>
          <div class="kpi__meta">Planned spend</div>
        </div>
      </div>
      <div class="section-head" style="margin-top:22px;margin-bottom:4px">
        <h2 style="font-size:15px">Latest activity</h2>
        <a class="btn btn--link" href="#/projects/${escapeHtml(project.id)}" data-detail-tab-link="activity">View all</a>
      </div>
      ${
        activity.length
          ? `<div class="activity-list" style="padding-left:0;padding-right:0">${activity
              .slice(0, 4)
              .map(activityItem)
              .join('')}</div>`
          : '<p class="text-muted" style="margin-top:8px">No activity has been recorded yet.</p>'
      }
    </div>`;
}

function renderNotFound() {
  return {
    title: 'Project not found',
    breadcrumbs: [{ label: 'Projects', href: '#/projects' }, { label: 'Not found' }],
    html: `<div class="error-state">
      <div class="error-state__icon">${icon('alert-triangle')}</div>
      <h1>Project not found</h1>
      <p>The project you are looking for does not exist in this demo, or it was removed.</p>
      <a class="btn btn--primary" href="#/projects">Back to projects</a>
    </div>`
  };
}

export async function render(ctx, route) {
  const projectId = route.params.id;
  const project = await ctx.repo.getProject(projectId);

  if (!project) {
    cache = null;
    return renderNotFound();
  }

  if (state.projectId !== projectId) {
    state.projectId = projectId;
    state.tab = 'overview';
  }

  const [tasks, activity] = await Promise.all([
    ctx.repo.listTasks({ projectId }),
    ctx.repo.listActivity({ projectId })
  ]);

  const progress = projectProgress(project, tasks);
  const health = projectHealth(project, tasks);
  const due = projectDueInfo(project);
  const type = getProjectType(project.type);
  cache = { project, tasks, activity, progress, health, due, type };

  const tabs = [
    { key: 'overview', label: 'Overview', count: null },
    { key: 'tasks', label: 'Tasks', count: progress.total },
    { key: 'activity', label: 'Activity', count: activity.length }
  ];

  const html = `<div class="detail-head">
    <div class="detail-head__main">
      <a class="back-link" href="#/projects">${icon('arrow-left')}All projects</a>
      <h1>${escapeHtml(project.name)}</h1>
      <div class="detail-head__meta">
        ${statusBadge(project.status)}
        ${healthBadge(health)}
        ${priorityBadge(project.priority)}
        ${typeBadge(project.type)}
        <span>·</span>
        <span>${escapeHtml(project.id)}</span>
        <span>·</span>
        <span>${escapeHtml(project.ownerName)}</span>
      </div>
    </div>
    <div class="detail-head__actions">
      <button class="btn btn--secondary" type="button" data-action="new-task" data-project-id="${escapeHtml(
        project.id
      )}">${icon('plus')}Add task</button>
      <a class="btn btn--secondary" href="#/projects/${escapeHtml(project.id)}/edit">${icon(
        'edit'
      )}Edit</a>
      <button class="btn btn--danger" type="button" data-action="delete-project" data-id="${escapeHtml(
        project.id
      )}">${icon('trash')}Delete</button>
    </div>
  </div>

  <div class="detail-layout">
    <div class="detail-main">
      <div class="progress-panel">
        <div class="progress-panel__top">
          <div>
            <div class="progress-panel__label">Overall progress</div>
            <div class="progress-panel__value">${progress.percent}%</div>
          </div>
          <span class="${dueClass(due.tone)}" style="font-size:12px;font-weight:600">${escapeHtml(
            due.label
          )}</span>
        </div>
        ${progressBar(progress.percent, health.tone)}
        <div class="progress-panel__meta">
          <span>${progress.completed} of ${progress.total} tasks complete</span>
          <span>${progress.open} open</span>
        </div>
      </div>

      <div class="card">
        <div class="tabs detail-tabs" style="padding:0 14px" role="tablist" aria-label="Project sections">
          ${tabs
            .map(
              (tab) => `<button class="tab${state.tab === tab.key ? ' is-active' : ''}" type="button" role="tab" aria-selected="${
                state.tab === tab.key
              }" data-detail-tab="${tab.key}">
                ${tab.label}${tab.count === null ? '' : tabCountLabel(tab.count)}
              </button>`
            )
            .join('')}
        </div>
        <div id="detail-panel">${panelMarkup()}</div>
      </div>
    </div>

    <aside class="detail-side">
      <div class="card">
        <div class="card__head"><h2>Details</h2>${healthBadge(health)}</div>
        <dl class="detail-facts">
          <div><dt>Owner</dt><dd>${escapeHtml(project.ownerName)}</dd></div>
          <div><dt>Status</dt><dd>${statusBadge(project.status)}</dd></div>
          <div><dt>Priority</dt><dd>${priorityBadge(project.priority)}</dd></div>
          <div><dt>Type</dt><dd>${escapeHtml(type.label)}</dd></div>
          <div><dt>Start date</dt><dd>${escapeHtml(formatDate(project.startDate))}</dd></div>
          <div><dt>Target date</dt><dd>${escapeHtml(formatDate(project.dueDate))}</dd></div>
          <div><dt>Budget</dt><dd>${escapeHtml(formatCurrency(project.budget))}</dd></div>
          <div><dt>Created</dt><dd>${escapeHtml(formatDate(project.createdAt))}</dd></div>
        </dl>
        <div class="card__footer">
          <div class="tag-list">
            ${
              project.tags.length
                ? project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
                : '<span class="text-faint">No tags</span>'
            }
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Team</h2><span class="section-head__hint">${project.team.length}</span></div>
        <div class="card__body">
          <div class="team-list">
            ${
              project.team.length
                ? project.team
                    .map(
                      (name) => `<div class="team-member">
                        ${avatar(name)}
                        <div>
                          <div class="team-member__name">${escapeHtml(name)}</div>
                          <div class="team-member__role">${
                            name === project.ownerName ? 'Project owner' : 'Contributor'
                          }</div>
                        </div>
                      </div>`
                    )
                    .join('')
                : '<p class="text-muted">No team members assigned.</p>'
            }
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Quick actions</h2></div>
        <div class="card__body">
          <div class="stack" style="gap:8px">
            <a class="btn btn--secondary" href="#/projects/${escapeHtml(project.id)}/edit">${icon(
              'edit'
            )}Edit project details</a>
            <button class="btn btn--secondary" type="button" data-action="new-task" data-project-id="${escapeHtml(
              project.id
            )}">${icon('plus')}Add a task</button>
            <a class="btn btn--secondary" href="#/reports">${icon('bar-chart')}Open reports</a>
          </div>
        </div>
      </div>
    </aside>
  </div>`;

  return {
    title: project.name,
    breadcrumbs: [{ label: 'Projects', href: '#/projects' }, { label: project.name }],
    html
  };
}

export function mount(ctx, root) {
  root.querySelectorAll('[data-detail-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tab = button.dataset.detailTab;
      root.querySelectorAll('[data-detail-tab]').forEach((tabButton) => {
        const active = tabButton.dataset.detailTab === state.tab;
        tabButton.classList.toggle('is-active', active);
        tabButton.setAttribute('aria-selected', String(active));
      });
      const panel = root.querySelector('#detail-panel');
      if (panel) panel.innerHTML = panelMarkup();
    });
  });

  root.querySelectorAll('[data-detail-tab-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      state.tab = link.dataset.detailTabLink;
      const button = root.querySelector(`[data-detail-tab="${state.tab}"]`);
      button?.click();
    });
  });
}
