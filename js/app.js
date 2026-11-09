/**
 * ProjectDesk bootstrap, hash router, and global interaction handlers.
 *
 * Views are plain modules that return an HTML string (and optionally a mount
 * function). The app owns navigation, shell rendering, and the shared dialogs.
 */

import * as repo from './repository.js';
import { applyTheme, renderMobileNav, renderSidebar, renderTopbar } from './shell.js';
import { closeModal, confirmDialog, openModal, toast } from './overlays.js';
import { openTaskModal } from './components/task-modal.js';
import { openRerouteModal } from './components/reroute-modal.js';
import { icon } from './components/icons.js';
import { escapeHtml } from './components/ui.js';
import * as dashboardView from './views/dashboard.js';
import * as tasksView from './views/tasks.js';
import * as projectsView from './views/projects.js';
import * as pipelineView from './views/pipeline.js';
import * as dataBrowserView from './views/data-browser.js';
import * as requestsView from './views/requests.js';
import * as requestFormView from './views/request-form.js';
import * as requestDetailView from './views/request-detail.js';
import * as requestTasksView from './views/request-tasks.js';
import * as projectDetailView from './views/project-detail.js';
import * as projectFormView from './views/project-form.js';
import * as reportsView from './views/reports.js';
import * as settingsView from './views/settings.js';
import * as helpView from './views/help.js';

let sidebarCollapsed = false;
let currentRoute = null;
let currentBreadcrumbs = [];
let currentTheme = 'light';
let shellTasks = [];
let renderToken = 0;

const ctx = {
  repo,
  session: null,
  route: null,
  navigate,
  refresh: () => renderRoute({ focus: false, scroll: false }),
  toast,
  openModal,
  closeModal,
  confirm: confirmDialog,
  applyTheme: (theme) => {
    currentTheme = theme;
    applyTheme(theme);
  }
};

function parseRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const path = raw.split('?')[0];
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });

  if (!parts.length) {
    return { name: 'dashboard', section: 'dashboard', params: {}, path: '/dashboard' };
  }

  const [first, second, third] = parts;

  if (first === 'dashboard') return { name: 'dashboard', section: 'dashboard', params: {}, path };
  if (first === 'tasks') return { name: 'tasks', section: 'tasks', params: {}, path };
  if (first === 'pipeline') return { name: 'pipeline', section: 'pipeline', params: {}, path };
  if (first === 'data') return { name: 'data-browser', section: 'data-browser', params: {}, path };
  if (first === 'request-tasks') return { name: 'request-tasks', section: 'request-tasks', params: {}, path };
  if (first === 'requests') {
    if (!second) return { name: 'requests', section: 'requests', params: {}, path };
    if (second === 'new') return { name: 'request-create', section: 'requests', params: {}, path };
    if (!third) return { name: 'request-detail', section: 'requests', params: { id: second }, path };
  }
  if (first === 'reports') return { name: 'reports', section: 'reports', params: {}, path };
  if (first === 'settings') return { name: 'settings', section: 'settings', params: {}, path };
  if (first === 'help') return { name: 'help', section: 'help', params: {}, path };

  if (first === 'projects') {
    if (!second) return { name: 'projects', section: 'projects', params: {}, path };
    if (second === 'new') return { name: 'project-create', section: 'projects', params: {}, path };
    if (third === 'edit') {
      return { name: 'project-edit', section: 'projects', params: { id: second }, path };
    }
    if (!third) {
      return { name: 'project-detail', section: 'projects', params: { id: second }, path };
    }
  }

  return { name: 'not-found', section: '', params: {}, path };
}

function viewFor(route) {
  switch (route.name) {
    case 'dashboard':
      return dashboardView;
    case 'tasks':
      return tasksView;
    case 'pipeline':
      return pipelineView;
    case 'data-browser':
      return dataBrowserView;
    case 'requests':
      return requestsView;
    case 'request-create':
      return requestFormView;
    case 'request-detail':
      return requestDetailView;
    case 'request-tasks':
      return requestTasksView;
    case 'projects':
      return projectsView;
    case 'project-detail':
      return projectDetailView;
    case 'project-create':
    case 'project-edit':
      return projectFormView;
    case 'reports':
      return reportsView;
    case 'settings':
      return settingsView;
    case 'help':
      return helpView;
    default:
      return null;
  }
}

function paintShell() {
  const section = currentRoute?.section || 'dashboard';
  const sidebarRoot = document.getElementById('sidebar-root');
  const topbarRoot = document.getElementById('topbar-root');
  const mobileRoot = document.getElementById('mobile-nav-root');

  if (sidebarRoot) {
    sidebarRoot.innerHTML = renderSidebar({
      section,
      tasks: shellTasks,
      collapsed: sidebarCollapsed,
      theme: currentTheme
    });
  }
  if (topbarRoot) {
    topbarRoot.innerHTML = renderTopbar({
      breadcrumbs: currentBreadcrumbs,
      theme: currentTheme
    });
  }
  if (mobileRoot) {
    mobileRoot.innerHTML = renderMobileNav(section);
  }
}

function loadingMarkup() {
  return `<div class="loading-page" aria-busy="true" aria-label="Loading">
    <div class="skeleton loading-page__title"></div>
    <div class="skeleton loading-page__sub"></div>
    <div class="loading-page__grid">
      <div class="skeleton loading-page__card"></div>
      <div class="skeleton loading-page__card"></div>
      <div class="skeleton loading-page__card"></div>
      <div class="skeleton loading-page__card"></div>
    </div>
    <div class="skeleton loading-page__panel"></div>
  </div>`;
}

function errorMarkup(error) {
  return `<div class="error-state">
    <div class="error-state__icon">${icon('alert-triangle')}</div>
    <h1>Something went wrong</h1>
    <p>${escapeHtml(error?.message || 'The view could not be loaded.')}</p>
    <a class="btn btn--primary" href="#/dashboard">Back to dashboard</a>
  </div>`;
}

function notFoundResult() {
  return {
    title: 'Page not found',
    breadcrumbs: [{ label: 'Page not found' }],
    html: `<div class="error-state">
      <div class="error-state__icon">${icon('alert-triangle')}</div>
      <h1>Page not found</h1>
      <p>That route does not exist in this mockup. Try the dashboard, projects, or help.</p>
      <a class="btn btn--primary" href="#/dashboard">Back to dashboard</a>
    </div>`
  };
}

async function renderRoute({ focus = false, scroll = false } = {}) {
  const token = ++renderToken;
  const route = parseRoute();
  currentRoute = route;
  currentBreadcrumbs = [];
  ctx.route = route;

  const main = document.getElementById('view');
  if (!main) return;

  const session = await repo.getSession();
  if (token !== renderToken) return;

  ctx.session = session;
  currentTheme = session.settings.theme;
  applyTheme(currentTheme);
  shellTasks = await repo.listTasks();
  if (token !== renderToken) return;

  paintShell();
  main.innerHTML = loadingMarkup();

  if (scroll) window.scrollTo(0, 0);

  const view = viewFor(route);
  let result;

  try {
    result = view ? await view.render(ctx, route) : notFoundResult();
  } catch (error) {
    console.error(error);
    result = {
      title: 'Something went wrong',
      breadcrumbs: [{ label: 'Error' }],
      html: errorMarkup(error)
    };
  }

  if (token !== renderToken) return;

  currentBreadcrumbs = result.breadcrumbs || [];
  main.innerHTML = result.html;
  document.title = `${result.title || 'ProjectDesk'} · ProjectDesk`;
  paintShell();
  view?.mount?.(ctx, main, route);

  if (focus) {
    main.focus({ preventScroll: true });
    if (scroll) window.scrollTo(0, 0);
  }
}

function navigate(hash) {
  if (location.hash === hash) {
    renderRoute({ focus: false, scroll: false });
    return;
  }
  location.hash = hash;
}

function closeUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu && !menu.hidden) {
    menu.hidden = true;
    document.querySelector('[data-action="toggle-user-menu"]')?.setAttribute('aria-expanded', 'false');
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  if (!menu) return;
  const opening = menu.hidden;
  menu.hidden = !opening;
  document
    .querySelector('[data-action="toggle-user-menu"]')
    ?.setAttribute('aria-expanded', String(opening));
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('is-open');
  const backdrop = document.getElementById('backdrop');
  if (backdrop) backdrop.hidden = false;
  document.body.classList.add('sidebar-open');
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('is-open');
  document.body.classList.remove('sidebar-open');
  const modalRoot = document.getElementById('modal-root');
  const backdrop = document.getElementById('backdrop');
  if (backdrop && !modalRoot?.innerHTML.trim()) backdrop.hidden = true;
}

async function handleAction(action, element) {
  switch (action) {
    case 'toggle-sidebar': {
      sidebarCollapsed = !sidebarCollapsed;
      paintShell();
      break;
    }
    case 'open-sidebar': {
      openSidebar();
      break;
    }
    case 'close-sidebar': {
      closeSidebar();
      break;
    }
    case 'toggle-theme': {
      const settings = await repo.getSettings();
      const theme = settings.theme === 'dark' ? 'light' : 'dark';
      await repo.updateSettings({ theme });
      currentTheme = theme;
      applyTheme(theme);
      toast(`${theme === 'dark' ? 'Dark' : 'Light'} theme applied.`, 'success');
      await renderRoute({ focus: false, scroll: false });
      break;
    }
    case 'toggle-user-menu': {
      toggleUserMenu();
      break;
    }
    case 'fake-sign-out': {
      closeUserMenu();
      toast('This mockup has no sign-in. You remain signed in as Jordan.', 'warning');
      break;
    }
    case 'new-task': {
      await openTaskModal(ctx, { projectId: element.dataset.projectId || null });
      break;
    }
    case 'reroute-task': {
      const task = await repo.getTask(element.dataset.id);
      if (task && task.status !== 'completed') {
        await openRerouteModal(ctx, { tasks: [task] });
      }
      break;
    }
    case 'reroute-my-tasks': {
      const tasks = await repo.listTasks({ assigneeEmail: ctx.session.user.email, open: true });
      if (tasks.length) {
        await openRerouteModal(ctx, { tasks });
      } else {
        toast('There are no open tasks to reroute.', 'warning');
      }
      break;
    }
    case 'edit-task': {
      const task = await repo.getTask(element.dataset.id);
      if (task) await openTaskModal(ctx, { task });
      break;
    }
    case 'delete-task': {
      const task = await repo.getTask(element.dataset.id);
      if (!task) break;
      confirmDialog({
        title: 'Delete task?',
        message: `“${task.title}” will be removed from this demo. This cannot be undone.`,
        confirmLabel: 'Delete task',
        onConfirm: async () => {
          await repo.deleteTask(task.id);
          toast('Task deleted.', 'success');
          ctx.refresh();
        }
      });
      break;
    }
    case 'toggle-task': {
      const task = await repo.getTask(element.dataset.id);
      if (!task) break;
      const completing = task.status !== 'completed';
      await repo.updateTask(task.id, {
        status: completing ? 'completed' : 'in_progress'
      });
      toast(completing ? 'Task completed.' : 'Task reopened.', 'success');
      await renderRoute({ focus: false, scroll: false });
      break;
    }
    case 'delete-project': {
      const project = await repo.getProject(element.dataset.id);
      if (!project) break;
      confirmDialog({
        title: 'Delete project?',
        message: `“${project.name}” and all of its tasks and activity will be removed from this demo. This cannot be undone.`,
        confirmLabel: 'Delete project',
        onConfirm: async () => {
          await repo.deleteProject(project.id);
          toast('Project deleted.', 'success');
          navigate('#/projects');
        }
      });
      break;
    }
    case 'reset-demo': {
      confirmDialog({
        title: 'Reset demo data?',
        message:
          'This restores the original fictional projects, tasks, activity, and preferences. Any changes saved in this browser will be lost.',
        confirmLabel: 'Reset demo',
        onConfirm: async () => {
          const session = await repo.reset();
          ctx.session = session;
          currentTheme = session.settings.theme;
          applyTheme(currentTheme);
          toast('Demo data reset.', 'success');
          await renderRoute({ focus: false, scroll: false });
        }
      });
      break;
    }
    default:
      break;
  }
}

function handleDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const actionElement = target.closest('[data-action]');
  if (actionElement) {
    event.preventDefault();
    const action = actionElement.dataset.action;
    if (action !== 'toggle-user-menu') closeUserMenu();
    handleAction(action, actionElement).catch((error) => {
      console.error(error);
      toast(error?.message || 'The action could not be completed.', 'danger');
    });
    return;
  }

  const row = target.closest('[data-href]');
  if (row && !target.closest('a, button, input, select, textarea, label')) {
    event.preventDefault();
    navigate(row.dataset.href);
    return;
  }

  if (target.closest('.user-menu')) {
    closeUserMenu();
    return;
  }

  if (target.closest('.nav-link, .mobile-nav__link')) {
    closeSidebar();
  }

  if (!target.closest('[data-action="toggle-user-menu"]')) {
    closeUserMenu();
  }

  if (target.id === 'backdrop') {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot?.innerHTML.trim()) closeSidebar();
  }
}

function handleKeydown(event) {
  if (event.key !== 'Escape') return;
  closeUserMenu();
  if (document.getElementById('sidebar')?.classList.contains('is-open')) closeSidebar();
}

async function init() {
  const session = await repo.getSession();
  ctx.session = session;
  currentTheme = session.settings.theme;
  applyTheme(currentTheme);

  const rawHash = location.hash.replace(/^#/, '');
  if (!rawHash || rawHash === '/') {
    history.replaceState(null, '', `#/${session.settings.defaultView || 'dashboard'}`);
  }

  window.addEventListener('hashchange', () => {
    renderRoute({ focus: true, scroll: true });
  });
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);

  await renderRoute({ focus: true, scroll: true });
}

init().catch((error) => {
  console.error(error);
  const main = document.getElementById('view');
  if (main) main.innerHTML = errorMarkup(error);
});
