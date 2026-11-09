import * as workflowRepo from '../docrouter-repository.js';
import { icon } from '../components/icons.js';
import { escapeHtml, pageHeader } from '../components/ui.js';

const state = { query: '', status: 'all', requests: [] };
const STATUSES = ['all', 'New', 'InProgress', 'Suspended', 'Completed'];
const label = (value) => String(value || '').replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

function paint(root) {
  const query = state.query.trim().toLowerCase();
  const filtered = state.requests.filter((request) => {
    const matchesStatus = state.status === 'all' || request.status === state.status;
    const searchable = `${request.id} ${request.title} ${request.department} ${request.category}`.toLowerCase();
    return matchesStatus && (!query || searchable.includes(query));
  });
  const region = root.querySelector('#request-list');
  if (!region) return;
  region.innerHTML = filtered.length
    ? `<div class="project-grid">${filtered
        .map((request) => `<a class="project-card" href="#/requests/${encodeURIComponent(request.id)}">
          <div class="project-card__top"><span class="project-card__icon">${icon('file-text')}</span>
            <span class="badge">${escapeHtml(label(request.status))}</span></div>
          <h3>${escapeHtml(request.title)}</h3>
          <p>${escapeHtml(request.id)} · ${escapeHtml(label(request.category))} · ${escapeHtml(request.department)}</p>
          <div class="project-card__meta"><span>${escapeHtml(request.priority)} priority</span>
            <span>Due ${escapeHtml(request.dueDate || '—')}</span></div>
        </a>`)
        .join('')}</div>`
    : '<div class="empty-state"><b>No requests found</b><p>Change the filters or create a request.</p></div>';
  const count = root.querySelector('#request-count');
  if (count) count.textContent = `${filtered.length} of ${state.requests.length} requests`;
}

export async function render() {
  state.requests = await workflowRepo.listRequests();
  const html = `${pageHeader({
    eyebrow: 'DocRouter · Local workflow',
    title: 'Requests',
    subtitle: 'Track local requests and approval workflows. This is a local equivalent, not a Power Platform connection.',
    actions: `<a class="btn btn--secondary" href="#/request-tasks">${icon('check-square')}My request tasks</a>
      <a class="btn btn--primary" href="#/requests/new">${icon('plus')}New request</a>`
  })}
  <div class="toolbar">
    <div class="toolbar__search">${icon('search')}<input class="input" type="search" id="request-search" value="${escapeHtml(
      state.query
    )}" placeholder="Search requests..." aria-label="Search requests" /></div>
    <select class="select" id="request-status" aria-label="Filter by status">${STATUSES.map(
      (status) => `<option value="${status}"${state.status === status ? ' selected' : ''}>${escapeHtml(
        status === 'all' ? 'All statuses' : label(status)
      )}</option>`
    ).join('')}</select>
    <span class="toolbar__spacer"></span><span id="request-count" class="toolbar__count"></span>
  </div>
  <div id="request-list"></div>`;
  return { title: 'Requests', breadcrumbs: [{ label: 'Requests' }], html };
}

export function mount(ctx, root) {
  paint(root);
  root.querySelector('#request-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    paint(root);
  });
  root.querySelector('#request-status')?.addEventListener('change', (event) => {
    state.status = event.target.value;
    paint(root);
  });
}
