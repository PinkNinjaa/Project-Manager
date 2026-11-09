import * as workflowRepo from '../docrouter-repository.js';
import { CURRENT_USER } from '../domain.js';
import { icon } from '../components/icons.js';
import { escapeHtml, pageHeader } from '../components/ui.js';

export async function render() {
  const assignments = await workflowRepo.listMyAssignments(CURRENT_USER.email);
  const html = `${pageHeader({
    eyebrow: 'DocRouter · Local workflow',
    title: 'My Request Tasks',
    subtitle: `Open workflow assignments for ${CURRENT_USER.name}.`,
    actions: `<a class="btn btn--secondary" href="#/requests">${icon('inbox')}All requests</a>`
  })}
  <div class="card"><div class="table-wrap"><table class="data-table">
    <thead><tr><th>Request</th><th>Phase</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${assignments.length ? assignments.map((item) => `<tr>
      <td><a href="#/requests/${encodeURIComponent(item.requestId)}">${escapeHtml(item.requestTitle)}</a>
        <div class="data-table__sub">${escapeHtml(item.requestId)}</div></td>
      <td>${escapeHtml(item.phaseTitle)}</td><td>${escapeHtml(item.status)}</td>
      <td><a class="btn btn--secondary" href="#/requests/${encodeURIComponent(item.requestId)}">Open</a></td>
    </tr>`).join('') : '<tr><td colspan="4">No open request assignments.</td></tr>'}</tbody>
  </table></div></div>`;
  return { title: 'My Request Tasks', breadcrumbs: [{ label: 'My Request Tasks' }], html };
}
