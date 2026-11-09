import { icon } from '../components/icons.js';
import { escapeHtml, pageHeader } from '../components/ui.js';

const CARDS = [
  {
    icon: 'dashboard',
    title: 'Find your way',
    text: 'Use the sidebar on desktop or the bottom bar on mobile. Breadcrumbs in the top bar show where you are.'
  },
  {
    icon: 'check-square',
    title: 'Manage tasks',
    text: 'Tick a task to complete it, or open the edit action to change its owner, priority, status, or due date.'
  },
  {
    icon: 'folder',
    title: 'Run projects',
    text: 'Create a project, add tasks, and track progress on the project detail page. Table and card views are both available.'
  },
  {
    icon: 'bar-chart',
    title: 'Read reports',
    text: 'Reports recalculate from the live demo data. Export CSV downloads the current project list as a snapshot.'
  },
  {
    icon: 'moon',
    title: 'Switch theme',
    text: 'Toggle light or dark mode from the sidebar, the top bar, or Settings. The choice is saved in this browser.'
  },
  {
    icon: 'database',
    title: 'Reset safely',
    text: 'Changes are saved in this browser. Use Settings → Reset demo data to restore the original fictional records.'
  }
];

const FAQS = [
  {
    question: 'Is any data saved or sent anywhere?',
    answer:
      'Your changes are saved in this browser’s local storage so they survive a refresh. Nothing is sent to a server: there is no backend, authentication, cookie, or external API. Use Settings → Reset demo data to restore the seed records.'
  },
  {
    question: 'Can I use this with real company data?',
    answer:
      'Not as-is. This is a UI mockup with fictional Contoso-style records. The repository and storage modules are deliberately isolated so a real API can replace the local store later.'
  },
  {
    question: 'Where did the design come from?',
    answer:
      'The palette, spacing, navigation patterns, and screen structure were adapted from the exported DocRouter Power Apps source. The runtime does not depend on Power Apps.'
  },
  {
    question: 'How do I add or remove a project?',
    answer:
      'Use New project on the dashboard or Projects page. Open a project and choose Delete to remove it along with its tasks and activity. Deletions are saved in this browser.'
  },
  {
    question: 'Why do dates look current?',
    answer:
      'Seed dates are generated relative to today when the demo is first seeded, so due-soon and overdue states stay meaningful. Reset demo data regenerates them relative to the current date.'
  }
];

export async function render() {
  const html = `${pageHeader({
    eyebrow: 'Support',
    title: 'Help & About',
    subtitle: 'A short guide to the ProjectDesk mockup and what it does — and does not — do.',
    actions: `<a class="btn btn--secondary" href="#/settings">${icon('settings')}Settings</a>
      <a class="btn btn--primary" href="#/dashboard">${icon('dashboard')}Back to dashboard</a>`
  })}

  <div class="stack">
    <div class="help-grid">
      ${CARDS.map(
        (card) => `<div class="help-card">
          <div class="help-card__icon">${icon(card.icon)}</div>
          <h3>${escapeHtml(card.title)}</h3>
          <p>${escapeHtml(card.text)}</p>
        </div>`
      ).join('')}
    </div>

    <div class="card">
      <div class="card__head"><h2>Frequently asked questions</h2></div>
      <div class="faq">
        ${FAQS.map(
          (faq, index) => `<details${index === 0 ? ' open' : ''}>
            <summary>${escapeHtml(faq.question)}</summary>
            <p>${escapeHtml(faq.answer)}</p>
          </details>`
        ).join('')}
      </div>
    </div>

    <div class="about-box">
      <strong>About this mockup.</strong> ProjectDesk is a standalone, dependency-free project
      management demo. It reuses the visual language and navigation ideas from the exported
      DocRouter Power Apps app, but runs as plain HTML, CSS, and JavaScript with a small local
      static server. All names, projects, tasks, and activity are fictional. Data is saved only
      in this browser. No Power Apps runtime, connector, authentication, or backend is used.
    </div>
  </div>`;

  return {
    title: 'Help & About',
    breadcrumbs: [{ label: 'Help & About' }],
    html
  };
}
