import {
  CURRENT_USER,
  DIRECTORY,
  PRIORITIES,
  PROJECT_TYPES,
  STATUSES,
  todayISO
} from '../domain.js';
import { icon } from '../components/icons.js';
import { escapeHtml, pageHeader, selectOptions } from '../components/ui.js';

function field({ name, label, control, full = false, hint = '', required = false }) {
  return `<label class="field${full ? ' form-grid--full' : ''}">
    <span class="field__label">${escapeHtml(label)}${required ? ' <span>*</span>' : ''}</span>
    ${control}
    ${hint ? `<span class="field__hint">${escapeHtml(hint)}</span>` : ''}
    <span class="field__error" data-error-for="${escapeHtml(name)}"></span>
  </label>`;
}

function clearErrors(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-error-for]').forEach((element) => {
    element.textContent = '';
  });
}

function setError(form, name, message) {
  const input = form.elements.namedItem(name);
  if (input instanceof HTMLElement) input.setAttribute('aria-invalid', 'true');
  const output = form.querySelector(`[data-error-for="${name}"]`);
  if (output) output.textContent = message;
}

function notFound() {
  return {
    title: 'Project not found',
    breadcrumbs: [{ label: 'Projects', href: '#/projects' }, { label: 'Not found' }],
    html: `<div class="error-state">
      <div class="error-state__icon">${icon('alert-triangle')}</div>
      <h1>Project not found</h1>
      <p>The project you tried to edit does not exist in this demo.</p>
      <a class="btn btn--primary" href="#/projects">Back to projects</a>
    </div>`
  };
}

export async function render(ctx, route) {
  const editing = route.name === 'project-edit';
  const project = editing ? await ctx.repo.getProject(route.params.id) : null;

  if (editing && !project) return notFound();

  const values = project || {
    name: '',
    description: '',
    status: 'not_started',
    priority: 'medium',
    type: 'client_delivery',
    ownerName: CURRENT_USER.name,
    ownerEmail: CURRENT_USER.email,
    startDate: todayISO(),
    dueDate: '',
    budget: '',
    team: [CURRENT_USER.name],
    tags: []
  };

  const ownerOptions = DIRECTORY.map((person) => ({ key: person.email, label: person.name }));
  const teamMembers = DIRECTORY.map((person) => person.name);

  const html = `${pageHeader({
    eyebrow: editing ? 'Edit project' : 'New project',
    title: editing ? 'Edit project details' : 'Create a project',
    subtitle: editing
      ? 'Update the plan, owner, dates, and team for this project.'
      : 'Set up a project so tasks, owners, and deadlines have a home.',
    actions: `<a class="btn btn--secondary" href="${
      editing ? `#/projects/${escapeHtml(project.id)}` : '#/projects'
    }">${icon('x')}Cancel</a>`
  })}

  <form id="project-form" novalidate>
    <div class="stack">
      <div class="card">
        <div class="card__head"><h2>Project details</h2></div>
        <div class="card__body">
          <div class="form-grid">
            ${field({
              name: 'name',
              label: 'Project name',
              required: true,
              full: true,
              control: `<input class="input" name="name" maxlength="120" autocomplete="off" placeholder="e.g. Website Redesign" value="${escapeHtml(
                values.name
              )}" />`
            })}
            ${field({
              name: 'description',
              label: 'Description',
              full: true,
              control: `<textarea class="textarea" name="description" placeholder="What is this project trying to achieve?">${escapeHtml(
                values.description
              )}</textarea>`
            })}
            ${field({
              name: 'type',
              label: 'Project type',
              control: `<select class="select" name="type">${selectOptions(
                PROJECT_TYPES,
                values.type
              )}</select>`
            })}
            ${field({
              name: 'status',
              label: 'Status',
              control: `<select class="select" name="status">${selectOptions(
                STATUSES,
                values.status
              )}</select>`
            })}
            ${field({
              name: 'priority',
              label: 'Priority',
              control: `<select class="select" name="priority">${selectOptions(
                PRIORITIES,
                values.priority
              )}</select>`
            })}
            ${field({
              name: 'ownerEmail',
              label: 'Owner',
              control: `<select class="select" name="ownerEmail">${selectOptions(
                ownerOptions,
                values.ownerEmail
              )}</select>`
            })}
            ${field({
              name: 'startDate',
              label: 'Start date',
              control: `<input class="input" type="date" name="startDate" value="${escapeHtml(
                values.startDate || ''
              )}" />`
            })}
            ${field({
              name: 'dueDate',
              label: 'Target date',
              control: `<input class="input" type="date" name="dueDate" value="${escapeHtml(
                values.dueDate || ''
              )}" />`
            })}
            ${field({
              name: 'budget',
              label: 'Budget',
              hint: 'Optional planned spend in USD.',
              control: `<input class="input" type="number" name="budget" min="0" step="500" placeholder="0" value="${escapeHtml(
                values.budget ?? ''
              )}" />`
            })}
            ${field({
              name: 'tags',
              label: 'Tags',
              hint: 'Separate tags with commas.',
              control: `<input class="input" name="tags" autocomplete="off" placeholder="Design, Launch" value="${escapeHtml(
                values.tags?.join(', ') || ''
              )}" />`
            })}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__head">
          <h2>Team</h2>
          <span class="section-head__hint">Choose the people contributing to this project.</span>
        </div>
        <div class="card__body">
          <div class="check-grid">
            ${teamMembers
              .map(
                (name) => `<label class="check">
                  <input type="checkbox" name="team" value="${escapeHtml(name)}"${
                    values.team?.includes(name) ? ' checked' : ''
                  } />
                  ${escapeHtml(name)}
                </label>`
              )
              .join('')}
          </div>
        </div>
      </div>

      <div class="form-actions">
        <a class="btn btn--ghost" href="${
          editing ? `#/projects/${escapeHtml(project.id)}` : '#/projects'
        }">Cancel</a>
        <button class="btn btn--primary" type="submit">${icon('check')}${
          editing ? 'Save changes' : 'Create project'
        }</button>
      </div>
    </div>
  </form>`;

  return {
    title: editing ? 'Edit project' : 'New project',
    breadcrumbs: editing
      ? [
          { label: 'Projects', href: '#/projects' },
          { label: project.name, href: `#/projects/${project.id}` },
          { label: 'Edit' }
        ]
      : [{ label: 'Projects', href: '#/projects' }, { label: 'New project' }],
    html
  };
}

export function mount(ctx, root, route) {
  const form = root.querySelector('#project-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const startDate = String(data.get('startDate') || '');
    const dueDate = String(data.get('dueDate') || '');
    const budget = String(data.get('budget') || '');
    let invalid = false;

    if (!name) {
      setError(form, 'name', 'A project name is required.');
      invalid = true;
    }
    if (startDate && dueDate && dueDate < startDate) {
      setError(form, 'dueDate', 'Target date cannot be before the start date.');
      invalid = true;
    }
    if (budget && Number(budget) < 0) {
      setError(form, 'budget', 'Budget must be zero or more.');
      invalid = true;
    }
    if (invalid) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const payload = {
      name,
      description: String(data.get('description') || ''),
      type: String(data.get('type') || 'client_delivery'),
      status: String(data.get('status') || 'not_started'),
      priority: String(data.get('priority') || 'medium'),
      ownerEmail: String(data.get('ownerEmail') || CURRENT_USER.email),
      startDate,
      dueDate,
      budget,
      team: data.getAll('team').map(String),
      tags: String(data.get('tags') || '')
    };

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;

    try {
      const editing = route.name === 'project-edit';
      const project = editing
        ? await ctx.repo.updateProject(route.params.id, payload)
        : await ctx.repo.createProject(payload);
      ctx.toast(editing ? 'Project updated.' : 'Project created.', 'success');
      ctx.navigate(`#/projects/${project.id}`);
    } catch (error) {
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
      ctx.toast(error?.message || 'Could not save the project.', 'danger');
    }
  });
}
