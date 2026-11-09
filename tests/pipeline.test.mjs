import assert from 'node:assert/strict';
import { after, test } from 'node:test';

const originalFetch = globalThis.fetch;
globalThis.window = { TIGERTURF_API_BASE: 'http://127.0.0.1:4321/api' };
const { render } = await import('../js/views/pipeline.js');

after(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
});

test('renders weighted pipeline data and opportunity drill-in controls', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(
      url,
      'http://127.0.0.1:4321/api/table/v_opportunity_pipeline/rows?limit=1000'
    );
    return {
      ok: true,
      json: async () => ({
        rows: [
          {
            id: 'opp_test_1',
            opportunity_number: 'OPP-0001',
            name: 'Test sports field',
            account_id: 'acc_test',
            sale_type: 'Project',
            status: 'Open',
            estimated_value: 10000,
            probability_pct: 0.4,
            weighted_value: 4000,
            expected_close_date: '2026-12-15',
            owner_user_id: 'usr_test'
          }
        ]
      })
    };
  };

  const page = await render();
  assert.equal(page.title, 'Opportunity Pipeline');
  assert.match(page.html, /Test sports field/);
  assert.match(page.html, /data-opportunity-id="opp_test_1"/);
  assert.match(page.html, /Weighted open value/);
});

test('shows an explicit error when the TigerTurf API is unavailable', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 503 });

  const page = await render();
  assert.match(page.html, /Pipeline data is unavailable/);
  assert.match(page.html, /HTTP 503/);
  assert.match(page.html, /DataModel\\Open Database\.bat/);
});
