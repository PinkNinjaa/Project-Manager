// debug.js - Run and Debug test suite for the TigerTurf data model
// Starts a temporary server on port 4399, runs automated checks against the
// database, the REST API and the command-line tools, then prints a report.
//
// Usage:
//   node debug.js            run all tests (non-destructive; test rows are removed)
//   node debug.js --rebuild  also stop the server and rebuild the database from Excel
//
// Your normal viewer on port 4321 is not touched.

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data_model.sqlite');
const TEST_PORT = 4399;
const BASE = `http://localhost:${TEST_PORT}`;
const API = BASE + '/api';
const TEST_ROW_ID = 'dbg_test_task';
const DO_REBUILD = process.argv.includes('--rebuild');

// ---------- result collection ----------
const results = [];
let serverProc = null;

function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
  console.log(`  PASS  ${name}${detail ? '  (' + detail + ')' : ''}`);
}
function fail(name, detail = '') {
  results.push({ ok: false, name, detail });
  console.log(`  FAIL  ${name}${detail ? '  (' + detail + ')' : ''}`);
}
function section(title) {
  console.log('');
  console.log(' ' + title);
  console.log(' ' + '-'.repeat(title.length));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function check(name, fn) {
  try {
    const detail = await fn();
    pass(name, detail || '');
    return true;
  } catch (e) {
    fail(name, e.message);
    return false;
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---------- helpers ----------
async function api(method, urlPath, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API + urlPath, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { /* non-JSON */ }
  return { status: res.status, data };
}
async function query(sql) {
  const r = await api('POST', '/query', { sql });
  if (r.status !== 200 || (r.data && r.data.error)) {
    throw new Error((r.data && r.data.error) || ('HTTP ' + r.status));
  }
  return r.data;
}
function openDb(readOnly) {
  return new DatabaseSync(DB_PATH, readOnly ? { readOnly: true } : {});
}

// Remove leftovers from an earlier interrupted run
function cleanTestRows() {
  if (!fs.existsSync(DB_PATH)) return;
  try {
    const db = openDb();
    db.exec(`DELETE FROM task WHERE id LIKE 'dbg_%' OR title LIKE 'DBG-%'`);
    db.close();
  } catch (e) {
    // table may not exist yet if build never ran - checked elsewhere
  }
}

// ---------- server control ----------
function startServer() {
  serverProc = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  serverProc.stdout.on('data', (d) => (out += d));
  serverProc.stderr.on('data', (d) => (out += d));
  serverProc.on('exit', () => { serverProc = null; });
  return () => out;
}
async function waitForServer(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(API + '/tables');
      if (res.ok) return true;
    } catch (e) { /* not up yet */ }
    await sleep(200);
  }
  return false;
}
function stopServer() {
  if (serverProc) {
    try { serverProc.kill(); } catch (e) { /* already gone */ }
    serverProc = null;
  }
}
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(130); });

// ---------- build a valid test row from live schema + metadata ----------
async function buildTestRow() {
  const cols = (await api('GET', '/table/task/columns')).data;
  const meta = (await api('GET', '/field-meta')).data;
  const taskMeta = meta.task || {};
  const row = { id: TEST_ROW_ID };

  for (const c of cols) {
    if (['id', 'created_at', 'updated_at', 'deleted_at', 'row_version'].includes(c.name)) continue;
    if (!c.notnull) continue; // leave optional columns null

    const fm = taskMeta[c.name] || {};
    if (fm.type === 'Choice' && fm.look) {
      const vals = (await api('GET', '/choices/' + fm.look)).data || [];
      row[c.name] = vals.length ? vals[0].value : 'DBG-TEST';
    } else if ((fm.type === 'Lookup' || c.name.endsWith('_id')) && c.name !== 'id') {
      const table = fm.look || c.name.replace(/_id$/, '');
      const opts = (await api('GET', '/fk-options/' + table)).data || [];
      if (opts.length) row[c.name] = opts[0].id;
      else if (c.notnull && !c.pk) throw new Error(`no rows in lookup table ${table} for required ${c.name}`);
    } else if (fm.type === 'Bool') {
      row[c.name] = 0;
    } else if (['Int', 'Decimal', 'Money'].includes(fm.type)) {
      row[c.name] = 1;
    } else if (c.type && /INT|REAL|NUMERIC|DECIMAL/i.test(c.type)) {
      row[c.name] = 1;
    } else {
      row[c.name] = 'DBG-TEST';
    }
  }
  return row;
}

// ======================================================================
// TESTS
// ======================================================================
async function run() {
  console.log('');
  console.log(' ============================================');
  console.log('   TigerTurf Data Model - Run and Debug');
  console.log(' ============================================');

  // ----- A. Environment -----
  section('A. Environment and files');
  await check('Node.js supports node:sqlite', () => {
    const major = parseInt(process.version.slice(1), 10);
    assert(major >= 22, `found ${process.version}, need v22+`);
    return process.version;
  });
  await check('Required files present', () => {
    const required = [
      'TigerTurf_Data_Model.xlsx', 'build_db.js', 'schema.sql', 'views.sql',
      'seed.sql', 'server.js', 'field_meta.json', 'db.js', 'csv.js',
      'public/index.html', 'public/app.js',
    ];
    const missing = required.filter((f) => !fs.existsSync(path.join(ROOT, f)));
    assert(missing.length === 0, 'missing: ' + missing.join(', '));
    return required.length + ' files';
  });
  await check('Database file exists', () => {
    assert(fs.existsSync(DB_PATH), 'run "Rebuild Database.bat" first');
    return (fs.statSync(DB_PATH).size / 1024).toFixed(0) + ' KB';
  });

  // ----- B. Database -----
  section('B. Database contents');
  await check('All 32 workbook tables exist', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'field_meta.json'), 'utf8'));
    const db = openDb(true);
    const names = new Set(
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t) => t.name)
    );
    db.close();
    const missing = Object.keys(meta).filter((t) => !names.has(t));
    assert(Object.keys(meta).length === 32, `field_meta has ${Object.keys(meta).length} tables, expected 32`);
    assert(missing.length === 0, 'missing tables: ' + missing.join(', '));
    assert(names.has('choice_value'), 'choice_value table missing');
    return '32 tables + choice_value';
  });
  await check('Seed data present (451 rows)', () => {
    const db = openDb(true);
    const n = db.prepare("SELECT COUNT(*) AS n FROM choice_value").get().n;
    const acct = db.prepare('SELECT COUNT(*) AS n FROM account').get().n;
    db.close();
    assert(n === 182, `choice_value has ${n} rows, expected 182`);
    assert(acct === 8, `account has ${acct} rows, expected 8`);
    return `${n} choices, ${acct} accounts`;
  });

  // ----- start the server -----
  section('C. Web server');
  const getServerOutput = startServer();
  await check(`Server starts on port ${TEST_PORT}`, async () => {
    const up = await waitForServer();
    assert(up, 'server did not answer in 10s: ' + getServerOutput().slice(-300));
    return 'listening';
  });
  await check('Home page serves the viewer', async () => {
    const res = await fetch(BASE + '/');
    const html = await res.text();
    assert(res.status === 200, 'HTTP ' + res.status);
    assert(html.includes('TigerTurf Data Model'), 'title not found');
    assert(html.includes('app.js'), 'app.js not referenced');
    return 'index.html';
  });
  await check('Frontend script serves', async () => {
    const res = await fetch(BASE + '/app.js');
    const js = await res.text();
    assert(res.status === 200, 'HTTP ' + res.status);
    assert(js.includes('saveRow'), 'saveRow not found - frontend broken?');
    return js.length + ' bytes';
  });

  // ----- D. API -----
  section('D. REST API');
  await check('GET /api/tables lists 33 tables', async () => {
    const r = await api('GET', '/tables');
    assert(r.status === 200, 'HTTP ' + r.status);
    assert(r.data.length === 33, `got ${r.data.length}, expected 33`);
    return '33 tables';
  });
  await check('GET account columns (20 columns)', async () => {
    const r = await api('GET', '/table/account/columns');
    assert(r.status === 200, 'HTTP ' + r.status);
    assert(r.data.length === 20, `got ${r.data.length}, expected 20`);
    return '20 columns';
  });
  await check('GET account rows (8 rows, soft-deleted hidden)', async () => {
    const r = await api('GET', '/table/account/rows');
    assert(r.status === 200, 'HTTP ' + r.status);
    assert(r.data.total === 8, `got ${r.data.total}, expected 8`);
    assert(r.data.rows.every((x) => x.deleted_at == null), 'soft-deleted row visible');
    return '8 active rows';
  });
  await check('GET single row by id', async () => {
    const r = await api('GET', '/table/account/row/acc_northshore');
    assert(r.status === 200, 'HTTP ' + r.status);
    assert(r.data && r.data.id === 'acc_northshore', 'wrong row');
    assert(r.data.name, 'name column missing');
    return r.data.name;
  });
  await check('GET choice list (quote_status)', async () => {
    const r = await api('GET', '/choices/quote_status');
    assert(r.status === 200, 'HTTP ' + r.status);
    assert(r.data.length >= 3, `only ${r.data.length} values`);
    return r.data.map((v) => v.value).join(', ');
  });
  await check('GET FK options show user names', async () => {
    const r = await api('GET', '/fk-options/user');
    assert(r.status === 200, 'HTTP ' + r.status);
    assert(r.data.length >= 5, `only ${r.data.length} users`);
    assert(r.data.every((u) => u.full_name), 'full_name missing');
    return r.data.length + ' users with names';
  });
  await check('GET field-meta drives dropdowns', async () => {
    const r = await api('GET', '/field-meta');
    assert(r.status === 200, 'HTTP ' + r.status);
    assert(Object.keys(r.data).length === 32, 'expected 32 tables');
    const st = r.data.quote && r.data.quote.status;
    assert(st && st.type === 'Choice' && st.look === 'quote_status', 'quote.status not a Choice');
    const q = r.data.sale && r.data.sale.quote_id;
    assert(q && q.type === 'Lookup' && q.look === 'quote', 'sale.quote_id not a Lookup');
    return 'Choice + Lookup metadata OK';
  });
  await check('View: v_quote_totals computes money', async () => {
    const rows = await query('SELECT id, subtotal, tax_amount, total FROM v_quote_totals');
    assert(rows.length >= 3, `only ${rows.length} quotes`);
    const r0 = rows[0];
    assert(typeof r0.subtotal === 'number', 'subtotal not numeric');
    assert(typeof r0.tax_amount === 'number', 'tax not numeric');
    assert(typeof r0.total === 'number', 'total not numeric');
    assert(Math.abs(r0.total - (r0.subtotal + r0.tax_amount)) < 0.02, 'total != subtotal + tax');
    return rows.length + ' quotes, e.g. ' + r0.total;
  });
  await check('View: v_invoice_balances', async () => {
    const rows = await query('SELECT id, balance FROM v_invoice_balances');
    assert(rows.length === 8, `got ${rows.length}, expected 8`);
    return '8 invoices';
  });
  await check('View: v_quote_lines', async () => {
    const rows = await query('SELECT id, line_total FROM v_quote_lines');
    assert(rows.length === 30, `got ${rows.length}, expected 30`);
    assert(rows.every((r) => typeof r.line_total === 'number'), 'line_total not numeric');
    return '30 lines';
  });
  await check('SQL box rejects writes (read-only)', async () => {
    const r = await api('POST', '/query', { sql: 'DELETE FROM account' });
    assert(r.status === 500, 'HTTP ' + r.status);
    assert(/SELECT/i.test(r.data.error || ''), 'not rejected: ' + r.data.error);
    return 'rejected as expected';
  });
  await check('Foreign keys enforced (bad insert rejected)', async () => {
    const r = await api('POST', '/table/task/row', {
      id: 'dbg_bad_fk', title: 'DBG bad fk', status: 'todo', priority: 'normal',
      assigned_user_id: 'no_such_user',
    });
    assert(r.status === 500, 'HTTP ' + r.status);
    assert(/FOREIGN KEY/i.test(r.data.error || ''), 'not rejected: ' + r.data.error);
    return 'FK error surfaced';
  });

  // ----- E. CRUD cycle -----
  section('E. Add / edit / delete cycle (table: task)');
  let insertedRow = null;
  await check('INSERT new row (auto timestamps + audit fields)', async () => {
    const row = await buildTestRow();
    const r = await api('POST', '/table/task/row', row);
    assert(r.status === 200 && !r.data.error, (r.data && r.data.error) || 'HTTP ' + r.status);
    return 'id=' + row.id;
  });
  await check('Row reads back with auto-filled fields', async () => {
    const r = await api('GET', '/table/task/row/' + TEST_ROW_ID);
    assert(r.status === 200 && r.data, 'row not found after insert');
    insertedRow = r.data;
    assert(r.data.created_at, 'created_at not auto-filled');
    assert(r.data.updated_at, 'updated_at not auto-filled');
    assert(r.data.row_version === 0 || r.data.row_version === '0', 'row_version not 0');
    assert(r.data.deleted_at == null, 'new row already soft-deleted');
    return 'created_at=' + r.data.created_at;
  });
  await check('EDIT row persists', async () => {
    const r = await api('PUT', `/table/task/row/${TEST_ROW_ID}`, { title: 'DBG-TEST-UPDATED' });
    assert(r.status === 200 && !r.data.error, (r.data && r.data.error) || 'HTTP ' + r.status);
    const after = await api('GET', '/table/task/row/' + TEST_ROW_ID);
    assert(after.data.title === 'DBG-TEST-UPDATED', 'title not updated');
    return 'title updated';
  });
  await check('DELETE is a soft delete and hides the row', async () => {
    const before = (await api('GET', '/table/task/rows')).data.total;
    const r = await api('DELETE', `/table/task/row/${TEST_ROW_ID}`);
    assert(r.status === 200 && !r.data.error, (r.data && r.data.error) || 'HTTP ' + r.status);
    const row = (await api('GET', '/table/task/row/' + TEST_ROW_ID)).data;
    assert(row && row.deleted_at, 'deleted_at not set (should be soft delete)');
    const after = (await api('GET', '/table/task/rows')).data;
    assert(after.total === before - 1, `listing total ${after.total}, expected ${before - 1}`);
    assert(!after.rows.some((x) => x.id === TEST_ROW_ID), 'row still listed');
    return 'deleted_at=' + row.deleted_at;
  });

  // ----- F. Command-line tools -----
  section('F. Command-line tools');
  await check('db.js tables', () => {
    const r = spawnSync(process.execPath, ['db.js', 'tables'], { cwd: ROOT, encoding: 'utf8' });
    assert(r.status === 0, 'exit ' + r.status + ': ' + (r.stderr || '').slice(0, 200));
    assert(/\baccount\b/.test(r.stdout), 'account table not listed');
    return 'lists tables + row counts';
  });
  await check('db.js sql query', () => {
    const r = spawnSync(process.execPath, ['db.js', 'sql', 'SELECT COUNT(*) AS n FROM account'], { cwd: ROOT, encoding: 'utf8' });
    assert(r.status === 0, 'exit ' + r.status + ': ' + (r.stderr || '').slice(0, 200));
    assert(/\b8\b/.test(r.stdout), 'expected 8 accounts, got: ' + r.stdout.slice(0, 100));
    return 'COUNT = 8';
  });
  await check('csv.js export', () => {
    const tmp = path.join(ROOT, 'csv', '_debug_export_test.csv');
    const r = spawnSync(process.execPath, ['csv.js', 'export', 'account', tmp], { cwd: ROOT, encoding: 'utf8' });
    assert(r.status === 0, 'exit ' + r.status + ': ' + (r.stderr || '').slice(0, 200));
    assert(fs.existsSync(tmp), 'CSV file not created');
    const lines = fs.readFileSync(tmp, 'utf8').trim().split(/\r?\n/);
    assert(lines.length === 9, `expected header + 8 rows, got ${lines.length}`);
    fs.unlinkSync(tmp);
    return '9 lines exported';
  });

  // ----- G. Optional rebuild -----
  if (DO_REBUILD) {
    section('G. Rebuild from Excel (--rebuild)');
    const portFree = await check('Port 4321 is free (close the viewer first)', async () => {
      let reachable = false;
      try {
        await fetch('http://localhost:4321/api/tables', { signal: AbortSignal.timeout(1500) });
        reachable = true;
      } catch (e) {
        // connection refused / timeout = nothing listening = free
      }
      assert(!reachable, 'the database viewer is running - close it, then re-run with --rebuild');
      return 'free';
    });
    if (portFree) {
      stopServer();
      await sleep(500);
      await check('build_db.js rebuilds cleanly', () => {
        const r = spawnSync(process.execPath, ['build_db.js'], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
        assert(r.status === 0, 'exit ' + r.status + ': ' + (r.stdout + r.stderr).slice(-400));
        assert(/Build complete/.test(r.stdout + r.stderr), 'no "Build complete" in output');
        return 'backup + rebuild OK';
      });
      await check('Rebuilt database has 33 tables', () => {
        const db = openDb(true);
        const n = db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get().n;
        db.close();
        assert(n === 33, `got ${n}, expected 33`);
        return '33 tables';
      });
      const getOut2 = startServer();
      await check('Server restarts after rebuild', async () => {
        const up = await waitForServer();
        assert(up, 'server did not restart: ' + getOut2().slice(-300));
        return 'listening';
      });
    } else {
      console.log('  SKIP  rebuild tests - close the viewer (port 4321) and run --rebuild again');
    }
  }

  // ----- cleanup -----
  stopServer();
  cleanTestRows();
}

// ---------- main ----------
(async () => {
  try {
    cleanTestRows(); // remove leftovers from a previously interrupted run
    await run();
  } catch (e) {
    fail('Unexpected error', e.stack || e.message);
  } finally {
    stopServer();
    cleanTestRows();
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log('');
  console.log(' ============================================');
  console.log(`   ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log(' ============================================');
  if (failed > 0) {
    console.log('');
    console.log(' Failed checks:');
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`   - ${r.name}: ${r.detail}`);
    }
    console.log('');
  }
  process.exit(failed > 0 ? 1 : 0);
})();
