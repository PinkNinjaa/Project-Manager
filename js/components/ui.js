/**
 * Reusable, dependency-free HTML fragments.
 *
 * Everything here returns a string. Views compose these fragments and then
 * hand the result to the router, which keeps rendering predictable and makes
 * the views easy to scan.
 */

import {
  formatDate,
  getPriority,
  getProjectType,
  getStatus,
  initials,
  avatarPalette,
  isOpenTask,
  projectDueInfo,
  projectHealth,
  projectProgress,
  relativeTime,
  taskDueInfo
} from '../domain.js';
import { icon } from './icons.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export function badge(label, tone = 'neutral', { dot = false } = {}) {
  const dotMarkup = dot ? '<span class="badge__dot"></span>' : '';
  return `<span class="badge badge--${escapeHtml(tone)}">${dotMarkup}${escapeHtml(label)}</span>`;
}

export function statusBadge(key) {
  const status = getStatus(key);
  return badge(status.label, status.tone, { dot: true });
}

export function priorityBadge(key) {
  const priority = getPriority(key);
  return badge(priority.label, priority.tone);
}

export function healthBadge(health) {
  return badge(health.label, health.tone, { dot: true });
}

export function typeBadge(key) {
  const type = getProjectType(key);
  return badge(type.label, 'neutral');
}

export function avatar(name, size = '') {
  const [background, color] = avatarPalette(name || '');
  const sizeClass = size ? ` avatar--${size}` : '';
  return `<span class="avatar${sizeClass}" style="--avatar-bg:${background};--avatar-color:${color}" title="${escapeHtml(
    name
  )}" aria-label="${escapeHtml(name)}">${escapeHtml(initials(name))}</span>`;
}

export function avatarStack(names = [], max = 3) {
  const visible = names.slice(0, max);
  const extra = names.length - visible.length;
  return `<span class="avatar-row">${visible
    .map((name) => avatar(name, 'sm'))
    .join('')}${extra > 0 ? `<span class="avatar avatar--sm" style="--avatar-bg:var(--surface-alt);--avatar-color:var(--muted)">+${extra}</span>` : ''}</span>`;
}

export function progressBar(percent, tone = '') {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  const modifier = ['success', 'warning', 'danger'].includes(tone) ? ` progress--${tone}` : '';
  return `<div class="progress${modifier}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safe}"><span class="progress__bar" style="width:${safe}%"></span></div>`;
}

export function progressRow(percent, tone = '') {
  return `<div class="progress-row">${progressBar(percent, tone)}<span class="progress-row__value">${Math.round(
    percent
  )}%</span></div>`;
}

export function pageHeader({ eyebrow = '', title, subtitle = '', actions = '' }) {
  return `<div class="page-header">
    <div class="page-header__text">
      ${eyebrow ? `<div class="page-header__eyebrow">${escapeHtml(eyebrow)}</div>` : ''}
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="page-header__subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </div>
    ${actions ? `<div class="page-header__actions">${actions}</div>` : ''}
  </div>`;
}

export function kpi({ href = '', iconName = 'circle', tone = 'primary', value, label, meta = '' }) {
  const tag = href ? 'a' : 'div';
  const hrefAttribute = href ? ` href="${escapeHtml(href)}"` : '';
  return `<${tag} class="kpi kpi--${escapeHtml(tone)}"${hrefAttribute}>
    <span class="kpi__icon">${icon(iconName)}</span>
    <div>
      <div class="kpi__value">${escapeHtml(value)}</div>
      <div class="kpi__label">${escapeHtml(label)}</div>
      ${meta ? `<div class="kpi__meta">${escapeHtml(meta)}</div>` : ''}
    </div>
  </${tag}>`;
}

export function emptyState({ iconName = 'inbox', title, message, action = '' }) {
  return `<div class="empty">
    <div class="empty__icon">${icon(iconName)}</div>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(message)}</p>
    ${action}
  </div>`;
}

export function dueClass(tone) {
  if (tone === 'danger') return 'text-danger';
  if (tone === 'warning') return 'text-warn';
  if (tone === 'success') return 'text-success';
  return 'text-muted';
}

export function taskItem(task, { project = null, showProject = false, compact = false } = {}) {
  const done = task.status === 'completed';
  const due = taskDueInfo(task);
  const priority = getPriority(task.priority);
  const status = getStatus(task.status);
  const projectLink =
    showProject && project
      ? `<a href="#/projects/${escapeHtml(project.id)}">${escapeHtml(project.name)}</a><span class="dot"></span>`
      : '';
  const extraBadges = [
    !done && task.priority === 'high' ? priorityBadge('high') : '',
    !done && task.status === 'on_hold' ? statusBadge('on_hold') : ''
  ]
    .filter(Boolean)
    .join(' ');

  return `<div class="task-item${compact ? ' task-item--compact' : ''}" data-task-id="${escapeHtml(
    task.id
  )}">
    <button class="task-check${done ? ' is-done' : ''}" type="button" data-action="toggle-task" data-id="${escapeHtml(
      task.id
    )}" aria-label="${done ? 'Reopen' : 'Complete'} ${escapeHtml(task.title)}" aria-pressed="${done}">
      ${icon('check')}
    </button>
    <div class="task-item__main">
      <div class="task-item__title${done ? ' is-done' : ''}">
        <span>${escapeHtml(task.title)}</span>
        ${extraBadges}
      </div>
      <div class="task-item__meta">
        ${projectLink}
        <span>${escapeHtml(status.label)}</span>
        <span class="dot"></span>
        <span>${escapeHtml(priority.label)} priority</span>
      </div>
    </div>
    <div class="task-item__side">
      <span class="task-item__assignee">${avatar(task.assigneeName, 'sm')}${escapeHtml(
        task.assigneeName.split(' ')[0]
      )}</span>
      <span class="task-item__due ${dueClass(due.tone)}">${escapeHtml(due.label)}</span>
      <span class="task-item__actions">
        ${
          isOpenTask(task)
            ? `<button class="icon-btn" type="button" data-action="reroute-task" data-id="${escapeHtml(
                task.id
              )}" title="Reroute task" aria-label="Reroute ${escapeHtml(task.title)}">${icon('arrow-right')}</button>`
            : ''
        }
        <button class="icon-btn" type="button" data-action="edit-task" data-id="${escapeHtml(
          task.id
        )}" title="Edit task" aria-label="Edit ${escapeHtml(task.title)}">${icon('edit')}</button>
        <button class="icon-btn" type="button" data-action="delete-task" data-id="${escapeHtml(
          task.id
        )}" title="Delete task" aria-label="Delete ${escapeHtml(task.title)}">${icon('trash')}</button>
      </span>
    </div>
  </div>`;
}

export function alertRow(task, project) {
  const due = taskDueInfo(task);
  return `<a class="alert-row" href="#/tasks">
    <span class="alert-row__text">
      <span class="alert-row__title">${escapeHtml(task.title)}</span>
      <span class="alert-row__sub">${escapeHtml(project?.name || 'Personal task')} · ${escapeHtml(
        task.assigneeName
      )}</span>
    </span>
    <span class="alert-row__due">${escapeHtml(due.label)}</span>
  </a>`;
}

export function projectCard(project, tasks) {
  const type = getProjectType(project.type);
  const progress = projectProgress(project, tasks);
  const health = projectHealth(project, tasks);
  const due = projectDueInfo(project);
  return `<a class="project-card" href="#/projects/${escapeHtml(project.id)}">
    <div class="project-card__top">
      <span class="project-card__icon">${icon(type.icon)}</span>
      ${statusBadge(project.status)}
    </div>
    <div>
      <h3>${escapeHtml(project.name)}</h3>
      <div class="project-card__meta">
        ${priorityBadge(project.priority)}
        ${healthBadge(health)}
        ${typeBadge(project.type)}
      </div>
      <p class="project-card__desc">${escapeHtml(project.description)}</p>
    </div>
    <div>
      <div class="progress-row">
        ${progressBar(progress.percent, health.tone)}
        <span class="progress-row__value">${progress.percent}%</span>
      </div>
      <div class="project-card__foot">
        <span>${progress.completed}/${progress.total} tasks · ${escapeHtml(due.label)}</span>
        <span class="project-card__people">${avatarStack(project.team)}</span>
      </div>
    </div>
  </a>`;
}

export function projectRow(project, tasks) {
  const type = getProjectType(project.type);
  const progress = projectProgress(project, tasks);
  const health = projectHealth(project, tasks);
  const due = projectDueInfo(project);
  return `<tr class="is-clickable" data-href="#/projects/${escapeHtml(project.id)}">
    <td>
      <div class="data-table__title">
        <span class="project-card__icon">${icon(type.icon)}</span>
        <span class="data-table__title-text">
          <span class="data-table__name">${escapeHtml(project.name)}</span>
          <span class="data-table__sub">${escapeHtml(project.id)} · ${escapeHtml(type.label)}</span>
        </span>
      </div>
    </td>
    <td>${statusBadge(project.status)}</td>
    <td>${healthBadge(health)}</td>
    <td class="data-table__progress">${progressRow(progress.percent, health.tone)}</td>
    <td>${escapeHtml(project.ownerName)}</td>
    <td class="nowrap ${dueClass(due.tone)}">${escapeHtml(due.label)}</td>
    <td class="data-table__actions">
      <a class="icon-btn" href="#/projects/${escapeHtml(project.id)}/edit" title="Edit project" aria-label="Edit ${escapeHtml(
        project.name
      )}">${icon('edit')}</a>
    </td>
  </tr>`;
}

const ACTIVITY_ICONS = {
  created: 'folder-plus',
  status: 'refresh',
  task: 'check-circle',
  comment: 'message-square',
  updated: 'edit'
};

export function activityItem(record) {
  const iconName = ACTIVITY_ICONS[record.type] || 'activity';
  return `<div class="activity-item">
    <span class="activity-item__icon activity-item__icon--${escapeHtml(record.type)}">${icon(iconName)}</span>
    <div class="activity-item__main">
      <div class="activity-item__text"><strong>${escapeHtml(record.actor)}</strong> ${escapeHtml(
        record.message
      )}</div>
      <div class="activity-item__meta">${escapeHtml(relativeTime(record.createdAt))}</div>
    </div>
  </div>`;
}

export function timelineItem(record) {
  const iconName = ACTIVITY_ICONS[record.type] || 'activity';
  return `<div class="timeline__item">
    <span class="timeline__icon activity-item__icon--${escapeHtml(record.type)}">${icon(iconName)}</span>
    <div class="timeline__body">
      <div class="timeline__text"><strong>${escapeHtml(record.actor)}</strong> ${escapeHtml(
        record.message
      )}</div>
      <div class="timeline__meta">${escapeHtml(relativeTime(record.createdAt))} · ${escapeHtml(
        formatDate(record.createdAt)
      )}</div>
    </div>
  </div>`;
}

export function selectOptions(items, selected, { valueKey = 'key', labelKey = 'label' } = {}) {
  return items
    .map(
      (item) =>
        `<option value="${escapeHtml(item[valueKey])}"${
          String(item[valueKey]) === String(selected) ? ' selected' : ''
        }>${escapeHtml(item[labelKey])}</option>`
    )
    .join('');
}
