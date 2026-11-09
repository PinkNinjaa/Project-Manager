import * as workflowRepo from '../docrouter-repository.js';
import { icon } from '../components/icons.js';
import { escapeHtml, pageHeader } from '../components/ui.js';

const titleFor = (value) => String(value).replaceAll(/([A-Z])/g, ' $1').replace(/^./, (ch) => ch.toUpperCase());

export async function render() {
  const options = workflowRepo.getWorkflowOptions();
  return {
    title: 'New Request',
    breadcrumbs: [{ label: 'Requests', href: '#/requests' }, { label: 'New Request' }],
    html: `${pageHeader({
      eyebrow: 'DocRouter · Local workflow',
      title: 'New Request',
      subtitle: 'Create a local request and seed its approval workflow.',
      actions: `<a class="btn btn--ghost" href="#/requests">Cancel</a>`
    })}
    <div class="card"><form class="card__body stack" id="request-form">
      <div class="form-grid">
        <label class="field form-grid--full"><span class="field__label">Request title *</span>
          <input class="input" name="title" maxlength="160" required /></label>
        <label class="field form-grid--full"><span class="field__label">Description</span>
          <textarea class="textarea" name="description" rows="4"></textarea></label>
        <label class="field"><span class="field__label">Category *</span><select class="select" name="category" required>
          <option value="">Choose category</option>${options.categories.map((value) => `<option value="${value}">${escapeHtml(
            titleFor(value)
          )}</option>`).join('')}</select></label>
        <label class="field"><span class="field__label">Department *</span>
          <select class="select" name="department" required>
            <option value="">Choose department</option>
            ${[
              ['OPS', 'Operations'], ['FIN', 'Finance'], ['LEG', 'Legal'],
              ['IT', 'Information Technology'], ['HR', 'Human Resources'], ['PROC', 'Procurement']
            ].map(([key, name]) => `<option value="${key}">${name}</option>`).join('')}
          </select></label>
        <label class="field"><span class="field__label">Priority</span><select class="select" name="priority">
          ${options.priorities.map((value) => `<option${value === 'Medium' ? ' selected' : ''}>${value}</option>`).join('')}
        </select></label>
        <label class="field"><span class="field__label">Processing</span><select class="select" name="processingType">
          <option>Standard</option><option>Expedited</option><option>Extended</option>
        </select></label>
        <label class="field"><span class="field__label">Due date</span><input class="input" type="date" name="dueDate" value="${options.currentDate}" /></label>
        <label class="field form-grid--full"><span class="field__label">Related links (one URL per line)</span>
          <textarea class="textarea" name="links" rows="2" placeholder="https://..."></textarea></label>
      </div>
      <div class="callout callout--info"><strong>Local workflow only.</strong> Notifications, file storage, and sign-in are not connected to Power Apps, SharePoint, or email.</div>
      <div class="form-actions"><a class="btn btn--ghost" href="#/requests">Cancel</a>
        <button class="btn btn--primary" type="submit">${icon('check')}Create request</button></div>
    </form></div>`
  };
}

export function mount(ctx, root) {
  const form = root.querySelector('#request-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const request = await workflowRepo.createRequest(data);
      ctx.toast('Request created.', 'success');
      ctx.navigate(`#/requests/${encodeURIComponent(request.id)}`);
    } catch (error) {
      button.disabled = false;
      ctx.toast(error.message || 'Could not create the request.', 'danger');
    }
  });
}
