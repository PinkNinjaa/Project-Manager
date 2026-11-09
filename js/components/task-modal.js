/**
 * Shared create/edit task dialog used by the dashboard, task list, and project
 * detail views.
 */

import { TASK_STATUSES } from '../domain.js';
import { icon } from './icons.js';
import { escapeHtml, selectOptions } from './ui.js';

function field({ label, control, full = false, hint = '', name }) {
  return `<label class="field${full ? ' form-grid--full' : ''}">
    <span class="field__label">${escapeHtml(label)}</span>
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

export async function openTaskModal(ctx, { task = null, projectId = null } = {}) {
  const [projects, session] = await Promise.all([ctx.repo.listProjects(), ctx.repo.getSession()]);
  const availableProjects = projects.filter(
    (project) => project.status !== 'cancelled' || project.id === task?.projectId
  );
  const defaultProject =
    task?.projectId ||
    projectId ||
    availableProjects.find((project) => project.status === 'in_progress')?.id ||
    availableProjects[0]?.id ||
    '';

  const projectOptions = availableProjects.map((project) => ({
    key: project.id,
    label: `${project.name} · ${project.id}`
  }));
  const assigneeOptions = session.directory.map((person) => ({
    key: person.email,
    label: person.name
  }));

  const body = `<form id="task-form" novalidate>
    <div class="form-grid">
      ${field({
        name: 'title',
        label: 'Task title',
        full: true,
        control: `<input class="input" name="title" maxlength="140" autocomplete="off" placeholder="What needs to happen?" value="${escapeHtml(
          task?.title || ''
        )}" />`
      })}
      ${field({
        name: 'description',
        label: 'Description',
        full: true,
        control: `<textarea class="textarea" name="description" placeholder="Add context, acceptance criteria, or links.">${escapeHtml(
          task?.description || ''
        )}</textarea>`
      })}
      ${field({
        name: 'projectId',
        label: 'Project',
        control: `<select class="select" name="projectId">${selectOptions(
          projectOptions,
          defaultProject
        )}</select>`
      })}
      ${field({
        name: 'assigneeEmail',
        label: 'Assignee',
        control: `<select class="select" name="assigneeEmail">${selectOptions(
          assigneeOptions,
          task?.assigneeEmail || session.user.email
        )}</select>`
      })}
      ${field({
        name: 'status',
        label: 'Status',
        control: `<select class="select" name="status">${selectOptions(
          TASK_STATUSES,
          task?.status || 'not_started'
        )}</select>`
      })}
      ${field({
        name: 'priority',
        label: 'Priority',
        control: `<select class="select" name="priority">${selectOptions(
          [
            { key: 'high', label: 'High' },
            { key: 'medium', label: 'Medium' },
            { key: 'low', label: 'Low' }
          ],
          task?.priority || 'medium'
        )}</select>`
      })}
      ${field({
        name: 'dueDate',
        label: 'Due date',
        hint: 'Leave empty if the task has no deadline.',
        control: `<input class="input" type="date" name="dueDate" value="${escapeHtml(
          task?.dueDate || ''
        )}" />`
      })}
    </div>
  </form>`;

  const footer = `<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
    <button class="btn btn--primary" type="submit" form="task-form">${icon('check')}${
      task ? 'Save changes' : 'Create task'
    }</button>`;

  ctx.openModal({
    title: task ? 'Edit task' : 'New task',
    subtitle: task ? `${task.id} · ${task.projectId}` : 'Add a task to a project.',
    size: 'lg',
    body,
    footer,
    footerSplit: Boolean(task),
    onMount(modal, close) {
      if (task) {
        const dangerZone = document.createElement('button');
        dangerZone.className = 'btn btn--danger modal__danger-zone';
        dangerZone.type = 'button';
        dangerZone.textContent = 'Delete task';
        modal.querySelector('.modal__foot')?.prepend(dangerZone);

        dangerZone.addEventListener('click', () => {
          ctx.confirm({
            title: 'Delete task?',
            message: `“${task.title}” will be removed from this demo. This cannot be undone.`,
            confirmLabel: 'Delete task',
            onConfirm: async () => {
              await ctx.repo.deleteTask(task.id);
              ctx.toast('Task deleted.', 'success');
              ctx.refresh();
            }
          });
        });
      }

      const form = modal.querySelector('#task-form');
      const submitButton = modal.querySelector('[form="task-form"]');
      if (!form) return;

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearErrors(form);

        const data = new FormData(form);
        const title = String(data.get('title') || '').trim();
        const project = String(data.get('projectId') || '');
        let invalid = false;

        if (!title) {
          setError(form, 'title', 'A task title is required.');
          invalid = true;
        }
        if (!project) {
          setError(form, 'projectId', 'Choose a project.');
          invalid = true;
        }
        if (invalid) {
          form.querySelector('[aria-invalid="true"]')?.focus();
          return;
        }

        const payload = {
          title,
          description: String(data.get('description') || ''),
          projectId: project,
          assigneeEmail: String(data.get('assigneeEmail') || ''),
          status: String(data.get('status') || 'not_started'),
          priority: String(data.get('priority') || 'medium'),
          dueDate: String(data.get('dueDate') || '')
        };

        if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
        try {
          if (task) {
            await ctx.repo.updateTask(task.id, payload);
            ctx.toast('Task updated.', 'success');
          } else {
            await ctx.repo.createTask(payload);
            ctx.toast('Task created.', 'success');
          }
          close();
          ctx.refresh();
        } catch (error) {
          if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
          ctx.toast(error?.message || 'Could not save the task.', 'danger');
        }
      });
    }
  });
}
