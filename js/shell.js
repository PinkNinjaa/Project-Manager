/**
 * App chrome: sidebar, top bar, breadcrumbs, and mobile navigation.
 */

import { CURRENT_USER, initials, summarizeTasks } from './domain.js';
import { icon } from './components/icons.js';
import { avatar, escapeHtml } from './components/ui.js';

const NAV_ITEMS = [
  { section: 'workspace', href: '#/dashboard', icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
  { section: 'workspace', href: '#/tasks', icon: 'check-square', label: 'My Tasks', key: 'tasks', badge: true },
  { section: 'workspace', href: '#/projects', icon: 'folder', label: 'Projects', key: 'projects' },
  { section: 'workspace', href: '#/pipeline', icon: 'bar-chart', label: 'Pipeline', key: 'pipeline' },
  { section: 'workspace', href: '#/data', icon: 'database', label: 'Data Browser', key: 'data-browser' },
  { section: 'workspace', href: '#/requests', icon: 'file-text', label: 'Requests', key: 'requests' },
  { section: 'workspace', href: '#/request-tasks', icon: 'clipboard', label: 'Request Tasks', key: 'request-tasks' },
  { section: 'workspace', href: '#/reports', icon: 'bar-chart', label: 'Reports', key: 'reports' },
  { section: 'other', href: '#/settings', icon: 'settings', label: 'Settings', key: 'settings' },
  { section: 'other', href: '#/help', icon: 'help-circle', label: 'Help & About', key: 'help' }
];

const MOBILE_ITEMS = [
  { href: '#/dashboard', icon: 'dashboard', label: 'Home', key: 'dashboard' },
  { href: '#/tasks', icon: 'check-square', label: 'Tasks', key: 'tasks' },
  { href: '#/projects', icon: 'folder', label: 'Projects', key: 'projects' },
  { href: '#/pipeline', icon: 'bar-chart', label: 'Pipeline', key: 'pipeline' },
  { href: '#/data', icon: 'database', label: 'Data', key: 'data-browser' },
  { href: '#/requests', icon: 'file-text', label: 'Requests', key: 'requests' },
  { href: '#/reports', icon: 'bar-chart', label: 'Reports', key: 'reports' },
  { href: '#/settings', icon: 'settings', label: 'Settings', key: 'settings' }
];

function navLink(item, { active, badge }) {
  return `<a class="nav-link${active ? ' is-active' : ''}" href="${item.href}"${
    active ? ' aria-current="page"' : ''
  }>
    <span class="nav-link__icon">${icon(item.icon)}</span>
    <span class="nav-link__label">${escapeHtml(item.label)}</span>
    ${badge ? `<span class="nav-link__badge">${badge}</span>` : ''}
  </a>`;
}

export function renderSidebar({ section = 'dashboard', tasks = [], collapsed = false, theme = 'light' }) {
  const openTasks = summarizeTasks(tasks).open.length;
  const workspace = NAV_ITEMS.filter((item) => item.section === 'workspace');
  const other = NAV_ITEMS.filter((item) => item.section === 'other');

  return `<aside class="sidebar${collapsed ? ' sidebar--collapsed' : ''}" id="sidebar" aria-label="Sidebar">
    <div class="sidebar__brand">
      <span class="sidebar__mark">${icon('layers')}</span>
      <span class="sidebar__brand-text">
        <span class="sidebar__brand-name">ProjectDesk</span>
        <span class="sidebar__brand-tag">PMO Workspace</span>
      </span>
      <button class="sidebar__toggle" type="button" data-action="toggle-sidebar" aria-label="${
        collapsed ? 'Expand sidebar' : 'Collapse sidebar'
      }" aria-expanded="${!collapsed}">${icon('chevron-left')}</button>
    </div>
    <nav class="sidebar__nav" aria-label="Main navigation">
      <div class="nav-section">Workspace</div>
      ${workspace
        .map((item) =>
          navLink(item, {
            active: section === item.key,
            badge: item.badge ? openTasks : ''
          })
        )
        .join('')}
      <div class="nav-section">Other</div>
      ${other
        .map((item) => navLink(item, { active: section === item.key }))
        .join('')}
    </nav>
    <div class="sidebar__footer">
      <button class="sidebar__theme" type="button" data-action="toggle-theme">
        ${icon(theme === 'dark' ? 'sun' : 'moon')}
        <span class="sidebar__footer-label">${theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      </button>
      <div class="sidebar__user">
        ${avatar(CURRENT_USER.name)}
        <div class="sidebar__user-text">
          <div class="sidebar__user-name">${escapeHtml(CURRENT_USER.name)}</div>
          <div class="sidebar__user-email">${escapeHtml(CURRENT_USER.email)}</div>
        </div>
      </div>
    </div>
  </aside>`;
}

export function renderBreadcrumbs(items = []) {
  if (!items.length) return '<span class="breadcrumbs__current">ProjectDesk</span>';

  return items
    .map((item, index) => {
      const last = index === items.length - 1;
      const content = last
        ? `<span class="breadcrumbs__current" aria-current="page">${escapeHtml(item.label)}</span>`
        : `<a href="${escapeHtml(item.href || '#/dashboard')}">${escapeHtml(item.label)}</a>`;
      const separator = index > 0 ? `<span class="breadcrumbs__sep" aria-hidden="true">/</span>` : '';
      return `${separator}${content}`;
    })
    .join('');
}

export function renderTopbar({ breadcrumbs = [], theme = 'light' }) {
  return `<div class="topbar">
    <div class="topbar__left">
      <button class="icon-btn icon-btn--mobile" type="button" data-action="open-sidebar" aria-label="Open navigation">${icon(
        'menu'
      )}</button>
      <nav class="breadcrumbs" aria-label="Breadcrumb">${renderBreadcrumbs(breadcrumbs)}</nav>
    </div>
    <div class="topbar__right">
      <button class="icon-btn" type="button" data-action="toggle-theme" title="Toggle colour theme" aria-label="Toggle colour theme">${icon(
        theme === 'dark' ? 'sun' : 'moon'
      )}</button>
      <a class="icon-btn" href="#/help" title="Help and about" aria-label="Help and about">${icon(
        'help-circle'
      )}</a>
      <button class="topbar__avatar" type="button" data-action="toggle-user-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Open user menu">${escapeHtml(
        initials(CURRENT_USER.name)
      )}</button>
    </div>
    <div class="user-menu" id="user-menu" role="menu" hidden>
      <div class="user-menu__head">
        <div class="user-menu__name">${escapeHtml(CURRENT_USER.name)}</div>
        <div class="user-menu__email">${escapeHtml(CURRENT_USER.email)}</div>
      </div>
      <a class="user-menu__item" href="#/settings" role="menuitem">${icon('settings')}Settings</a>
      <a class="user-menu__item" href="#/help" role="menuitem">${icon('help-circle')}Help &amp; About</a>
      <button class="user-menu__item" type="button" data-action="fake-sign-out" role="menuitem">${icon(
        'log-out'
      )}Sign out</button>
    </div>
  </div>`;
}

export function renderMobileNav(section = 'dashboard') {
  return `<nav class="mobile-nav" aria-label="Primary mobile navigation">
    <div class="mobile-nav__inner">
      ${MOBILE_ITEMS.map(
        (item) => `<a class="mobile-nav__link${section === item.key ? ' is-active' : ''}" href="${item.href}"${
          section === item.key ? ' aria-current="page"' : ''
        }>${icon(item.icon)}<span>${escapeHtml(item.label)}</span></a>`
      ).join('')}
    </div>
  </nav>`;
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
}
