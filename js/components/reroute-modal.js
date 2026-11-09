import { icon } from './icons.js';
import { escapeHtml, selectOptions } from './ui.js';

export async function openRerouteModal(ctx, { tasks }) {
  const selectedTasks = tasks.filter(
    (task) => task.status !== 'completed' && task.status !== 'cancelled'
  );
  if (!selectedTasks.length) {
    ctx.toast('There are no open tasks to reroute.', 'warning');
    return;
  }

  const session = await ctx.repo.getSession();
  const assigneeOptions = session.directory.map((person) => ({
    key: person.email,
    label: person.name
  }));
  const taskLabel =
    selectedTasks.length === 1
      ? `Reroute “${selectedTasks[0].title}”`
      : `Reroute ${selectedTasks.length} open tasks`;
  const body = `<form id="reroute-form" novalidate>
    <div class="form-grid">
      <label class="field form-grid--full">
        <span class="field__label">Reassign to</span>
        <select class="select" name="assigneeEmail">
          <option value="" selected disabled>Choose an assignee...</option>
          ${selectOptions(assigneeOptions, '')}
        </select>
        <span class="field__error" data-error-for="assigneeEmail"></span>
      </label>
      <fieldset class="field form-grid--full">
        <legend class="field__label">Reroute type</legend>
        <label><input type="radio" name="mode" value="temporary" checked /> Temporary delegation — return to the original assignee when completed</label>
        <label><input type="radio" name="mode" value="transfer" /> Permanent transfer</label>
      </fieldset>
      <label class="field form-grid--full">
        <span class="field__label">Reason</span>
        <textarea class="textarea" name="reason" maxlength="500" required placeholder="Explain why this task is being reassigned."></textarea>
        <span class="field__error" data-error-for="reason"></span>
      </label>
    </div>
  </form>`;

  ctx.openModal({
    title: taskLabel,
    subtitle: 'A reason is required and the change will be recorded in activity.',
    body,
    footer: `<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
      <button class="btn btn--primary" type="submit" form="reroute-form">${icon('arrow-right')}Confirm reroute</button>`,
    size: 'md',
    onMount(modal, close) {
      const form = modal.querySelector('#reroute-form');
      const submit = modal.querySelector('[form="reroute-form"]');
      if (!form) return;

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        form.querySelectorAll('[data-error-for]').forEach((element) => {
          element.textContent = '';
        });

        const data = new FormData(form);
        const assigneeEmail = String(data.get('assigneeEmail') || '');
        const reason = String(data.get('reason') || '').trim();
        let invalid = false;
        if (!assigneeEmail) {
          form.querySelector('[data-error-for="assigneeEmail"]').textContent = 'Choose an assignee.';
          invalid = true;
        }
        if (!reason) {
          form.querySelector('[data-error-for="reason"]').textContent = 'A reason is required.';
          invalid = true;
        }
        if (invalid) {
          form.querySelector('[aria-invalid="true"]')?.focus();
          return;
        }

        if (submit instanceof HTMLButtonElement) submit.disabled = true;
        try {
          await ctx.repo.rerouteTasks(
            selectedTasks.map((task) => task.id),
            {
              assigneeEmail,
              mode: String(data.get('mode') || 'temporary'),
              reason
            }
          );
          close();
          ctx.toast(
            `${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'} rerouted.`,
            'success'
          );
          ctx.refresh();
        } catch (error) {
          if (submit instanceof HTMLButtonElement) submit.disabled = false;
          ctx.toast(error?.message || 'Could not reroute the selected tasks.', 'danger');
        }
      });
    }
  });
}
