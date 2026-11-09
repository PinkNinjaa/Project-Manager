import * as workflowRepo from '../docrouter-repository.js';
import { icon } from '../components/icons.js';
import { escapeHtml, pageHeader } from '../components/ui.js';

function label(value) {
  return String(value || '').replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function assignmentRows(request) {
  return request.phases.flatMap((phase) =>
    phase.assignments.map((assignment) => `<div class="request-assignment">
      <div><strong>${escapeHtml(assignment.assigneeName)}</strong>
        <div class="data-table__sub">${escapeHtml(assignment.assigneeEmail)} · ${escapeHtml(assignment.status)}</div></div>
      <div class="request-assignment__actions">
        ${assignment.status !== 'Completed' && request.status !== 'Suspended' ? `<button class="btn btn--secondary" type="button" data-request-action="reroute" data-assignment-id="${escapeHtml(
          assignment.id
        )}">${icon('arrow-right')}Reroute</button>` : ''}
        ${assignment.status === 'InProgress' && phase.status === 'InProgress' && request.status !== 'Suspended' ? `<button class="btn btn--primary" type="button" data-request-action="complete" data-assignment-id="${escapeHtml(
          assignment.id
        )}">${icon('check')}Complete</button>` : ''}
      </div>
    </div>`)
  ).join('');
}

function phaseMarkup(phase, index) {
  return `<div class="workflow-phase">
    <div class="workflow-phase__index">${index + 1}</div>
    <div class="workflow-phase__content">
      <div class="workflow-phase__title">${escapeHtml(phase.title)} <span class="badge">${escapeHtml(label(phase.status))}</span></div>
      <p>${escapeHtml(phase.goal || 'No phase instructions provided.')}</p>
      <div class="data-table__sub">${phase.required ? 'Required' : 'Optional'} · ${phase.durationDays} day(s)</div>
      ${phase.assignments.map((assignment) => `<div class="workflow-phase__worker">
        ${escapeHtml(assignment.assigneeName)} · ${escapeHtml(label(assignment.status))}
      </div>`).join('')}
    </div>
  </div>`;
}

function openReroute(ctx, request, preselected = '') {
  const active = request.phases.flatMap((phase) =>
    phase.assignments
      .filter((assignment) => assignment.status !== 'Completed')
      .map((assignment) => ({ ...assignment, phaseTitle: phase.title }))
  );
  const directory = workflowRepo.getWorkflowOptions().directory;
  const body = `<form id="request-reroute-form" class="stack">
    <div class="callout callout--info">Choose one or more active assignments. The operation is all-or-nothing. The selected assignee cannot already own any selected assignment.</div>
    <div class="request-assignment-list">${active.map((item) => `<label class="request-assignment">
      <span><input type="checkbox" name="assignmentIds" value="${escapeHtml(item.id)}"${
        !preselected || preselected === item.id ? ' checked' : ''
      } /></span>
      <span><strong>${escapeHtml(item.phaseTitle)}</strong><span class="data-table__sub">${escapeHtml(item.assigneeName)} · ${escapeHtml(label(item.status))}</span></span>
    </label>`).join('')}</div>
    <label class="field"><span class="field__label">Reassign to</span><select class="select" name="assigneeEmail" required>
      <option value="">Choose a person...</option>${directory.map((person) => `<option value="${escapeHtml(
        person.email
      )}">${escapeHtml(person.name)} · ${escapeHtml(person.department)}</option>`).join('')}
    </select></label>
    <fieldset class="field"><legend class="field__label">Reroute type</legend>
      <label><input type="radio" name="mode" value="temporary" checked /> Temporary delegation (returns to original owner on completion)</label>
      <label><input type="radio" name="mode" value="transfer" /> Permanent transfer</label>
    </fieldset>
    <label class="field"><span class="field__label">Reason (required)</span><textarea class="textarea" name="reason" required maxlength="500"></textarea></label>
  </form>`;
  ctx.openModal({
    title: 'Reroute request assignments',
    subtitle: request.title,
    body,
    size: 'lg',
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
      <button class="btn btn--primary" type="submit" form="request-reroute-form">Confirm reroute</button>`,
    onMount(modal, close) {
      modal.querySelector('#request-reroute-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const assignmentIds = data.getAll('assignmentIds').map(String);
        if (!assignmentIds.length) {
          ctx.toast('Select at least one active assignment.', 'warning');
          return;
        }
        try {
          await workflowRepo.rerouteAssignments(request.id, assignmentIds, {
            assigneeEmail: data.get('assigneeEmail'),
            mode: data.get('mode'),
            reason: data.get('reason')
          });
          close();
          ctx.toast('Request assignments rerouted.', 'success');
          ctx.refresh();
        } catch (error) {
          ctx.toast(error.message || 'Could not reroute the assignments.', 'danger');
        }
      });
    }
  });
}

function openWorkflowEditor(ctx, request) {
  const options = workflowRepo.getWorkflowOptions();
  let phases = request.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    goal: phase.goal || '',
    required: phase.required,
    durationDays: phase.durationDays,
    assigneeEmail: phase.assignments[0]?.assigneeEmail || ''
  }));
  const renderRows = (root) => {
    root.innerHTML = phases.map((phase, index) => `<div class="workflow-editor-row" data-phase-index="${index}">
      <div class="workflow-editor-row__head"><strong>Phase ${index + 1}</strong>
        <div><button class="icon-btn" type="button" data-move="-1" aria-label="Move phase up">${icon('chevron-left')}</button>
        <button class="icon-btn" type="button" data-move="1" aria-label="Move phase down">${icon('chevron-right')}</button>
        <button class="icon-btn" type="button" data-remove aria-label="Remove phase">${icon('trash')}</button></div>
      </div>
      <input class="input" name="phaseTitle" maxlength="100" value="${escapeHtml(phase.title)}" placeholder="Phase title" required />
      <input class="input" name="phaseGoal" maxlength="250" value="${escapeHtml(phase.goal)}" placeholder="Phase goal / instructions" />
      <div class="form-grid">
        <label class="field"><span class="field__label">Worker</span><select class="select" name="assigneeEmail">
          ${options.directory.map((person) => `<option value="${escapeHtml(person.email)}"${
            person.email === phase.assigneeEmail ? ' selected' : ''
          }>${escapeHtml(person.name)}</option>`).join('')}</select></label>
        <label class="field"><span class="field__label">Duration (days)</span><input class="input" type="number" min="0" max="365" name="durationDays" value="${phase.durationDays}" /></label>
      </div>
      <label><input type="checkbox" name="required"${phase.required ? ' checked' : ''} /> Required phase</label>
      <input type="hidden" name="phaseId" value="${escapeHtml(phase.id)}" />
    </div>`).join('');
  };
  ctx.openModal({
    title: 'Edit workflow',
    subtitle: 'Phase order and workers are saved together. The active phase cannot be removed.',
    body: `<form id="workflow-form"><div id="workflow-editor-rows" class="stack"></div>
      <button class="btn btn--secondary" type="button" id="add-workflow-phase">${icon('plus')}Add phase</button></form>`,
    size: 'lg',
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
      <button class="btn btn--primary" type="submit" form="workflow-form">Save workflow</button>`,
    onMount(modal, close) {
      const rows = modal.querySelector('#workflow-editor-rows');
      renderRows(rows);
      rows.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const row = button.closest('[data-phase-index]');
        const index = Number(row?.dataset.phaseIndex);
        if (button.hasAttribute('data-remove')) {
          phases.splice(index, 1);
        } else if (button.dataset.move) {
          const next = index + Number(button.dataset.move);
          if (next >= 0 && next < phases.length) [phases[index], phases[next]] = [phases[next], phases[index]];
        }
        renderRows(rows);
      });
      modal.querySelector('#add-workflow-phase').addEventListener('click', () => {
        phases.push({
          id: '',
          title: '',
          goal: '',
          required: true,
          durationDays: 1,
          assigneeEmail: options.directory[0].email
        });
        renderRows(rows);
      });
      modal.querySelector('#workflow-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const updated = [...rows.querySelectorAll('[data-phase-index]')].map((row) => ({
          id: row.querySelector('[name="phaseId"]').value,
          title: row.querySelector('[name="phaseTitle"]').value,
          goal: row.querySelector('[name="phaseGoal"]').value,
          assigneeEmail: row.querySelector('[name="assigneeEmail"]').value,
          durationDays: row.querySelector('[name="durationDays"]').value,
          required: row.querySelector('[name="required"]').checked
        }));
        try {
          await workflowRepo.saveWorkflow(request.id, updated);
          close();
          ctx.toast('Workflow saved.', 'success');
          ctx.refresh();
        } catch (error) {
          ctx.toast(error.message || 'Could not save the workflow.', 'danger');
        }
      });
    }
  });
}

function openRequestEditor(ctx, request) {
  const options = workflowRepo.getWorkflowOptions();
  ctx.openModal({
    title: 'Edit request details',
    subtitle: request.id,
    body: `<form id="request-edit-form" class="stack">
      <label class="field"><span class="field__label">Title *</span>
        <input class="input" name="title" maxlength="160" value="${escapeHtml(request.title)}" required /></label>
      <label class="field"><span class="field__label">Description</span>
        <textarea class="textarea" name="description" rows="4">${escapeHtml(request.description)}</textarea></label>
      <div class="form-grid">
        <label class="field"><span class="field__label">Category</span><select class="select" name="category">
          ${options.categories.map((value) => `<option value="${value}"${value === request.category ? ' selected' : ''}>${escapeHtml(label(value))}</option>`).join('')}
        </select></label>
        <label class="field"><span class="field__label">Department *</span><input class="input" name="department" value="${escapeHtml(request.department)}" required /></label>
        <label class="field"><span class="field__label">Priority</span><select class="select" name="priority">
          ${options.priorities.map((value) => `<option${value === request.priority ? ' selected' : ''}>${value}</option>`).join('')}
        </select></label>
        <label class="field"><span class="field__label">Processing</span><select class="select" name="processingType">
          ${['Standard', 'Expedited', 'Extended'].map((value) => `<option${value === request.processingType ? ' selected' : ''}>${value}</option>`).join('')}
        </select></label>
        <label class="field"><span class="field__label">Due date</span><input class="input" type="date" name="dueDate" value="${escapeHtml(request.dueDate)}" /></label>
      </div>
      <label class="field"><span class="field__label">Related links (one URL per line)</span>
        <textarea class="textarea" name="links" rows="3">${escapeHtml(request.links)}</textarea></label>
    </form>`,
    size: 'lg',
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
      <button class="btn btn--primary" type="submit" form="request-edit-form">Save changes</button>`,
    onMount(modal, close) {
      modal.querySelector('#request-edit-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const input = Object.fromEntries(new FormData(form));
        try {
          await workflowRepo.updateRequest(request.id, input);
          close();
          ctx.toast('Request details updated.', 'success');
          ctx.refresh();
        } catch (error) {
          ctx.toast(error.message || 'Could not update the request.', 'danger');
        }
      });
    }
  });
}

export async function render(ctx, route) {
  const id = route.params.id;
  const [request, audit] = await Promise.all([
    workflowRepo.getRequest(id),
    workflowRepo.listAudit(id)
  ]);
  if (!request) {
    return {
      title: 'Request not found',
      breadcrumbs: [{ label: 'Requests', href: '#/requests' }, { label: 'Not found' }],
      html: '<div class="empty-state"><b>Request not found</b><p>This local request does not exist.</p><a class="btn btn--primary" href="#/requests">Back to requests</a></div>'
    };
  }
  const isLocked = ['Suspended', 'Completed'].includes(request.status);
  const allAssignments = request.phases.flatMap((phase) => phase.assignments);
  const html = `${pageHeader({
    eyebrow: `${request.id} · ${escapeHtml(label(request.status))}`,
    title: request.title,
    subtitle: `${escapeHtml(label(request.category))} · ${escapeHtml(request.department)} · ${escapeHtml(request.priority)} priority`,
    actions: `<a class="btn btn--ghost" href="#/requests">${icon('arrow-left')}Requests</a>
      ${!isLocked ? `<button class="btn btn--secondary" type="button" data-request-action="edit-workflow">${icon('sliders')}Edit workflow</button>` : ''}
      ${!isLocked ? `<button class="btn btn--secondary" type="button" data-request-action="edit-details">${icon('edit')}Edit details</button>` : ''}
      ${request.status === 'Suspended'
        ? `<button class="btn btn--secondary" type="button" data-request-action="resume">${icon('play-circle')}Resume</button>`
        : request.status !== 'Completed'
          ? `<button class="btn btn--secondary" type="button" data-request-action="suspend">${icon('clock')}Suspend</button>`
          : `<button class="btn btn--secondary" type="button" data-request-action="restart">${icon('refresh')}Restart</button>`}`
  })}
  <div class="callout callout--info">Local workflow equivalent. No Power Apps, SharePoint, Flow, email, or authentication service is connected.</div>
  <div class="request-detail-grid">
    <div class="stack">
      <section class="card"><div class="card__head"><h2>Request details</h2></div>
        <div class="card__body stack">
          <p>${escapeHtml(request.description || 'No description provided.')}</p>
          <div class="request-facts"><span><strong>Due</strong> ${escapeHtml(request.dueDate || '—')}</span>
            <span><strong>Processing</strong> ${escapeHtml(request.processingType)}</span>
            <span><strong>Point of contact</strong> ${escapeHtml(request.pocName)}</span></div>
          ${request.links ? `<div><strong>Related links</strong><p>${request.links.split(/\r?\n/).filter(Boolean).map((href) => {
            try {
              const url = new URL(href);
              return ['http:', 'https:'].includes(url.protocol)
                ? `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(href)}</a>`
                : escapeHtml(href);
            } catch {
              return escapeHtml(href);
            }
          }).join('<br>')}</p></div>` : ''}
        </div>
      </section>
      <section class="card"><div class="card__head"><h2>Workflow</h2><span class="section-head__hint">${request.phases.filter((phase) => phase.status === 'Completed').length} / ${request.phases.length} phases</span></div>
        <div class="card__body"><div class="workflow-timeline">${request.phases.map(phaseMarkup).join('')}</div></div>
      </section>
      <section class="card"><div class="card__head"><h2>Assignments</h2>
        ${!isLocked && allAssignments.some((item) => item.status !== 'Completed') ? `<button class="btn btn--secondary" type="button" data-request-action="reroute-all">${icon('arrow-right')}Reroute selected/all</button>` : ''}
      </div><div class="card__body request-assignment-list">${assignmentRows(request)}</div></section>
    </div>
    <div class="stack">
      <section class="card"><div class="card__head"><h2>Comments</h2></div><div class="card__body stack">
        <form id="request-comment-form" class="stack"><label class="field"><span class="field__label">Add a comment</span>
          <textarea class="textarea" name="comment" rows="3" required maxlength="2000"></textarea></label>
          <button class="btn btn--primary" type="submit">${icon('message-square')}Add comment</button></form>
        ${request.comments.length ? request.comments.map((comment) => `<div class="timeline__item">
          <strong>${escapeHtml(comment.author)}</strong><p>${escapeHtml(comment.text)}</p>
          <span class="timeline__meta">${escapeHtml(new Date(comment.createdAt).toLocaleString())}</span>
        </div>`).join('') : '<p class="text-muted">No comments yet.</p>'}
      </div></section>
      <section class="card"><div class="card__head"><h2>Audit history</h2></div><div class="card__body">
        ${audit.length ? `<div class="timeline">${audit.map((entry) => `<div class="timeline__item">
          <strong>${escapeHtml(entry.action)}</strong><p>${escapeHtml(entry.detail)}</p>
          <span class="timeline__meta">${escapeHtml(entry.actor)} · ${escapeHtml(new Date(entry.createdAt).toLocaleString())}</span>
        </div>`).join('')}</div>` : '<p class="text-muted">No audit events yet.</p>'}
      </div></section>
      <div class="callout callout--info"><strong>Files and email are not connected.</strong> Links are references only; this build does not upload documents or send notifications.</div>
    </div>
  </div>`;
  return {
    title: request.title,
    breadcrumbs: [{ label: 'Requests', href: '#/requests' }, { label: request.title }],
    html
  };
}

export function mount(ctx, root, route) {
  const requestId = route.params.id;
  root.querySelectorAll('[data-request-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const request = await workflowRepo.getRequest(requestId);
      if (!request) {
        ctx.toast('Request no longer exists.', 'danger');
        return;
      }
      const action = button.dataset.requestAction;
      if (action === 'reroute' || action === 'reroute-all') {
        openReroute(ctx, request, button.dataset.assignmentId || '');
      } else if (action === 'edit-workflow') {
        openWorkflowEditor(ctx, request);
      } else if (action === 'edit-details') {
        openRequestEditor(ctx, request);
      } else if (action === 'complete') {
        try {
          await workflowRepo.completeAssignment(request.id, button.dataset.assignmentId);
          ctx.toast('Assignment completed.', 'success');
          ctx.refresh();
        } catch (error) {
          ctx.toast(error.message, 'danger');
        }
      } else {
        const labels = { suspend: 'Suspend workflow?', resume: 'Resume workflow?', restart: 'Restart workflow?' };
        ctx.confirm({
          title: labels[action],
          message: `This will ${action} the local workflow for “${request.title}”. An audit event will be recorded.`,
          confirmLabel: labels[action].replace('?', ''),
          onConfirm: async () => {
            try {
              await workflowRepo.setWorkflowStatus(request.id, action);
              ctx.toast(`Workflow ${action}ed.`, 'success');
              ctx.refresh();
            } catch (error) {
              ctx.toast(error.message, 'danger');
            }
          }
        });
      }
    });
  });
  root.querySelector('#request-comment-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    try {
      await workflowRepo.addComment(requestId, new FormData(form).get('comment'));
      ctx.toast('Comment added.', 'success');
      ctx.refresh();
    } catch (error) {
      ctx.toast(error.message, 'danger');
    }
  });
}
