import { CURRENT_USER } from '../domain.js';
import { icon } from '../components/icons.js';
import { escapeHtml, pageHeader } from '../components/ui.js';

const VIEW_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tasks', label: 'My Tasks' },
  { key: 'projects', label: 'Projects' },
  { key: 'reports', label: 'Reports' }
];

function switchRow({ setting, title, description, checked }) {
  return `<div class="settings-row">
    <div class="settings-row__text">
      <div class="settings-row__title">${escapeHtml(title)}</div>
      <div class="settings-row__sub">${escapeHtml(description)}</div>
    </div>
    <label class="switch">
      <input type="checkbox" data-setting="${escapeHtml(setting)}"${
        checked ? ' checked' : ''
      } aria-label="${escapeHtml(title)}" />
      <span class="switch__track"></span>
    </label>
  </div>`;
}

export async function render(ctx) {
  const [session, storage] = await Promise.all([ctx.repo.getSession(), ctx.repo.getStorageStatus()]);
  const { settings } = session;
  const storageDescription = storage.persistent
    ? 'Saved in this browser only. No cookies or backend.'
    : 'Temporary session storage only — this browser blocked persistent storage.';

  const html = `${pageHeader({
    eyebrow: 'Workspace',
    title: 'Settings',
    subtitle: 'Preferences for this demo. Changes are saved in this browser.',
    actions: `<a class="btn btn--secondary" href="#/help">${icon('help-circle')}Help &amp; About</a>`
  })}

  <div class="settings-grid">
    <div class="stack">
      <div class="card">
        <div class="card__head"><h2>Appearance</h2></div>
        <div class="card__body">
          <div class="field">
            <span class="field__label">Colour theme</span>
            <div class="theme-options">
              <button class="theme-option${settings.theme === 'light' ? ' is-active' : ''}" type="button" data-theme-set="light" aria-pressed="${
                settings.theme === 'light'
              }">
                <span class="theme-option__preview"></span>
                <span class="theme-option__label">${icon('sun')}Light</span>
              </button>
              <button class="theme-option${settings.theme === 'dark' ? ' is-active' : ''}" type="button" data-theme-set="dark" aria-pressed="${
                settings.theme === 'dark'
              }">
                <span class="theme-option__preview theme-option__preview--dark"></span>
                <span class="theme-option__label">${icon('moon')}Dark</span>
              </button>
            </div>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <div class="settings-row__title">Default view</div>
            <div class="settings-row__sub">Where the app opens when you visit the root URL.</div>
          </div>
          <select class="select" id="default-view" aria-label="Default view" style="max-width:170px">
            ${VIEW_OPTIONS.map(
              (option) =>
                `<option value="${option.key}"${settings.defaultView === option.key ? ' selected' : ''}>${escapeHtml(
                  option.label
                )}</option>`
            ).join('')}
          </select>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <div class="settings-row__title">Compact tables</div>
            <div class="settings-row__sub">Remember a denser table preference.</div>
          </div>
          <label class="switch">
            <input type="checkbox" data-setting="compactTables"${
              settings.compactTables ? ' checked' : ''
            } aria-label="Compact tables" />
            <span class="switch__track"></span>
          </label>
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Notifications</h2></div>
        ${switchRow({
          setting: 'emailNotifications',
          title: 'Task reminders',
          description: 'A fictional email when a task is due soon.',
          checked: settings.emailNotifications
        })}
        ${switchRow({
          setting: 'weeklyDigest',
          title: 'Weekly portfolio digest',
          description: 'A made-up summary of project health every Monday.',
          checked: settings.weeklyDigest
        })}
      </div>
    </div>

    <div class="stack">
      <div class="card">
        <div class="card__head"><h2>Session</h2></div>
        <div class="settings-row">
          <div class="settings-row__text">
            <div class="settings-row__title">${escapeHtml(CURRENT_USER.name)}</div>
            <div class="settings-row__sub">${escapeHtml(CURRENT_USER.email)} · ${escapeHtml(
              CURRENT_USER.role
            )}</div>
          </div>
          ${icon('user')}
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <div class="settings-row__title">Data storage</div>
            <div class="settings-row__sub">${escapeHtml(storageDescription)}</div>
          </div>
          ${icon('database')}
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <div class="settings-row__title">Authentication</div>
            <div class="settings-row__sub">Disabled for the mockup. You are always signed in as Jordan.</div>
          </div>
          ${icon('shield')}
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Demo data</h2></div>
        <div class="card__body">
          <p class="text-muted">
            Reset restores the original fictional projects, tasks, activity, and settings. Any
            changes saved in this browser will be lost.
          </p>
          <button class="btn btn--danger" type="button" data-action="reset-demo" style="margin-top:14px">
            ${icon('rotate-ccw')}Reset demo data
          </button>
        </div>
      </div>

      <div class="about-box">
        <strong>ProjectDesk</strong> is a standalone mockup. It reuses the visual language of the
        exported DocRouter Power Apps app but has no Power Apps runtime, connector, or external
        service behind it.
      </div>
    </div>
  </div>`;

  return {
    title: 'Settings',
    breadcrumbs: [{ label: 'Settings' }],
    html
  };
}

export function mount(ctx, root) {
  root.querySelectorAll('[data-theme-set]').forEach((button) => {
    button.addEventListener('click', async () => {
      const theme = button.dataset.themeSet;
      await ctx.repo.updateSettings({ theme });
      ctx.applyTheme(theme);
      ctx.toast(`${theme === 'dark' ? 'Dark' : 'Light'} theme applied.`, 'success');
      ctx.refresh();
    });
  });

  root.querySelector('#default-view')?.addEventListener('change', async (event) => {
    await ctx.repo.updateSettings({ defaultView: event.target.value });
    ctx.toast('Default view updated.', 'success');
  });

  root.querySelectorAll('[data-setting]').forEach((input) => {
    input.addEventListener('change', async () => {
      await ctx.repo.updateSettings({ [input.dataset.setting]: input.checked });
      ctx.toast('Preference saved.', 'success');
    });
  });
}
