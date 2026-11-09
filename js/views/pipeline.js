import { icon } from '../components/icons.js';
import { escapeHtml, kpi, pageHeader, selectOptions } from '../components/ui.js';

const API_BASE = window.TIGERTURF_API_BASE || 'http://127.0.0.1:4321/api';
const state = { query: '', status: 'all', rows: [], error: '' };
const STATUS_OPTIONS = [
  { key: 'all', label: 'All statuses' },
  { key: 'Open', label: 'Open' },
  { key: 'On hold', label: 'On hold' },
  { key: 'Won', label: 'Won' },
  { key: 'Lost', label: 'Lost' }
];

function money(value) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function probability(value) {
  const number = Number(value);
  return `${Math.round((number <= 1 ? number * 100 : number) || 0)}%`;
}

function visibleRows() {
  const query = state.query.trim().toLowerCase();
  return state.rows.filter((row) => {
    const matchesStatus = state.status === 'all' || row.status === state.status;
    const haystack = [
      row.name,
      row.opportunity_number,
      row.account_id,
      row.owner_user_id,
      row.sale_type
    ]
      .join(' ')
      .toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });
}

function errorMarkup() {
  return `<div class="card"><div class="card__body">
    <div class="error-state__icon">${icon('alert-triangle')}</div>
    <h2>Pipeline data is unavailable</h2>
    <p>${escapeHtml(state.error)}</p>
    <p class="text-muted">Start the TigerTurf database API with <code>DataModel\\Open Database.bat</code>, then retry.</p>
    <button class="btn btn--secondary" type="button" data-action="refresh-pipeline">${icon('refresh')}Retry</button>
  </div></div>`;
}

function tableMarkup(rows) {
  if (!rows.length) {
    return '<div class="empty-state"><b>No opportunities found</b><p>Try changing the search or status filter.</p></div>';
  }

  return `<div class="table-wrap">
    <table class="data-table">
      <thead><tr>
        <th>Opportunity</th><th>Status</th><th>Type</th><th>Estimated value</th>
        <th>Probability</th><th>Weighted value</th><th>Expected close</th><th>Account / owner</th>
      </tr></thead>
      <tbody>${rows
        .map(
          (row) => `<tr>
            <td><button class="link-button" type="button" data-opportunity-id="${escapeHtml(
              row.id
            )}">${escapeHtml(row.name || row.opportunity_number || row.id)}</button>
              <div class="data-table__sub">${escapeHtml(row.opportunity_number || row.id)}</div></td>
            <td>${escapeHtml(row.status || '—')}</td>
            <td>${escapeHtml(row.sale_type || '—')}</td>
            <td>${money(row.estimated_value)}</td>
            <td>${probability(row.probability_pct)}</td>
            <td><strong>${money(row.weighted_value)}</strong></td>
            <td>${escapeHtml(row.expected_close_date || '—')}</td>
            <td>${escapeHtml(row.account_id || '—')}<div class="data-table__sub">${escapeHtml(
              row.owner_user_id || '—'
            )}</div></td>
          </tr>`
        )
        .join('')}</tbody>
    </table>
  </div>`;
}

export async function render() {
  state.error = '';
  try {
    const response = await fetch(
      `${API_BASE}/table/v_opportunity_pipeline/rows?limit=1000`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) {
      throw new Error(`TigerTurf API returned HTTP ${response.status}.`);
    }
    const result = await response.json();
    if (!Array.isArray(result?.rows)) {
      throw new Error('TigerTurf API returned an invalid pipeline response.');
    }
    state.rows = result.rows;
  } catch (error) {
    state.rows = [];
    state.error = error?.message || 'The TigerTurf database API could not be reached.';
  }

  const rows = visibleRows();
  const activeRows = state.rows.filter((row) => !['Won', 'Lost'].includes(row.status));
  const openValue = activeRows.reduce((total, row) => total + (Number(row.estimated_value) || 0), 0);
  const weightedValue = activeRows.reduce((total, row) => total + (Number(row.weighted_value) || 0), 0);
  const wonValue = state.rows
    .filter((row) => row.status === 'Won')
    .reduce((total, row) => total + (Number(row.estimated_value) || 0), 0);

  const html = `${pageHeader({
    eyebrow: 'Sales',
    title: 'Opportunity Pipeline',
    subtitle: 'Weighted opportunity value and expected close dates from the TigerTurf data model.',
    actions: `<button class="btn btn--secondary" type="button" data-action="refresh-pipeline">${icon('refresh')}Refresh</button>`
  })}
  ${
    state.error
      ? errorMarkup()
      : `<div class="stack">
          <div class="grid grid--kpi">
            ${kpi({ iconName: 'briefcase', tone: 'primary', value: state.rows.length, label: 'Opportunities', meta: 'Active data model records' })}
            ${kpi({ iconName: 'dollar-sign', tone: 'warn', value: money(openValue), label: 'Open value', meta: 'Excludes won and lost' })}
            ${kpi({ iconName: 'target', tone: 'success', value: money(weightedValue), label: 'Weighted open value', meta: 'Value × probability' })}
            ${kpi({ iconName: 'check-circle', tone: 'group', value: money(wonValue), label: 'Won value', meta: 'Won opportunities' })}
          </div>
          <div class="toolbar">
            <div class="toolbar__search">${icon('search')}<input class="input" id="pipeline-search" type="search" placeholder="Search opportunities..." value="${escapeHtml(
              state.query
            )}" aria-label="Search opportunities" /></div>
            <select class="select" id="pipeline-status" aria-label="Filter by status">${selectOptions(
              STATUS_OPTIONS,
              state.status
            )}</select>
            <span class="toolbar__spacer"></span><span class="toolbar__count" id="pipeline-count">${rows.length} of ${state.rows.length} opportunities</span>
          </div>
          <div class="card" id="pipeline-results">${tableMarkup(rows)}</div>
        </div>`
  }}`;

  return {
    title: 'Opportunity Pipeline',
    breadcrumbs: [{ label: 'Pipeline' }],
    html
  };
}

export function mount(ctx, root) {
  const bindOpportunityButtons = () => {
    root.querySelectorAll('[data-opportunity-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          const id = encodeURIComponent(button.dataset.opportunityId);
          const response = await fetch(`${API_BASE}/table/opportunity/row/${id}`, {
            headers: { Accept: 'application/json' }
          });
          if (!response.ok) throw new Error(`TigerTurf API returned HTTP ${response.status}.`);
          const opportunity = await response.json();
          if (!opportunity || typeof opportunity !== 'object') {
            throw new Error('The opportunity record could not be found.');
          }
          const fields = Object.entries(opportunity)
            .map(
              ([key, value]) => `<div class="field form-grid--full">
                <span class="field__label">${escapeHtml(key.replaceAll('_', ' '))}</span>
                <span>${escapeHtml(value == null ? '—' : String(value))}</span>
              </div>`
            )
            .join('');
          ctx.openModal({
            title: opportunity.name || opportunity.opportunity_number || 'Opportunity',
            subtitle: opportunity.opportunity_number || opportunity.id,
            size: 'lg',
            body: `<div class="form-grid">${fields}</div>`,
            footer: '<button class="btn btn--ghost" type="button" data-modal-close>Close</button>'
          });
        } catch (error) {
          ctx.toast(error?.message || 'Could not load the opportunity.', 'danger');
        }
      });
    });
  };
  const paintResults = () => {
    const results = root.querySelector('#pipeline-results');
    const count = root.querySelector('#pipeline-count');
    if (results) {
      results.innerHTML = tableMarkup(visibleRows());
      bindOpportunityButtons();
    }
    if (count) count.textContent = `${visibleRows().length} of ${state.rows.length} opportunities`;
  };
  root.querySelector('#pipeline-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    paintResults();
  });
  root.querySelector('#pipeline-status')?.addEventListener('change', (event) => {
    state.status = event.target.value;
    paintResults();
  });
  root.querySelectorAll('[data-action="refresh-pipeline"]').forEach((button) => {
    button.addEventListener('click', () => ctx.refresh());
  });
  bindOpportunityButtons();
}
