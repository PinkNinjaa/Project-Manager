// server.js - Local HTTP server for the data model browser app
// Provides a REST API over SQLite. No installation required - runs with Node.js only.
// Double-click "Open Database.bat" to start this server and open your browser.

const fs = require('fs');
const path = require('path');
const http = require('http');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data_model.sqlite');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = parseInt(process.env.PORT || '4321', 10);
const HOST = process.env.HOST || '127.0.0.1';
const MAX_LIMIT = 500;
const MAX_IMPORT_ROWS = 1000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MUTABLE_SYSTEM_COLUMNS = new Set(['created_at', 'updated_at', 'deleted_at', 'row_version']);

// Open the database (read-write)
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA busy_timeout = 5000');

// Helper: send JSON response
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// Helper: read request body
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on('data', (ch) => {
      bytes += ch.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(ch);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// Helper: quote an identifier for SQL
function quoteId(id) {
  return '"' + id.replace(/"/g, '""') + '"';
}

function getEntity(name, { allowView = true, writable = false } = {}) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw Object.assign(new Error('Invalid table or view name.'), { status: 400 });
  }
  const entity = db.prepare(
    "SELECT name, type FROM sqlite_master WHERE name = ? AND type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'"
  ).get(name);
  if (!entity || (!allowView && entity.type !== 'table')) {
    throw Object.assign(new Error(`Unknown ${allowView ? 'table or view' : 'table'}: ${name}`), { status: 404 });
  }
  if (writable && entity.type !== 'table') {
    throw Object.assign(new Error('Views are read-only.'), { status: 405 });
  }
  return entity;
}

// Helper: get column info for a table
function getTableInfo(tableName) {
  getEntity(tableName);
  const cols = db.prepare(`PRAGMA table_info(${quoteId(tableName)})`).all();
  return cols.map((c) => ({
    name: c.name,
    type: c.type,
    notnull: c.notnull,
    pk: c.pk,
    dflt_value: c.dflt_value,
  }));
}

// Helper: get all rows from a table
function getTableRows(tableName, limit = 100, offset = 0, { sort = '', direction = 'asc', includeDeleted = false } = {}) {
  const entity = getEntity(tableName);
  const columns = getTableInfo(tableName);
  const columnNames = new Set(columns.map((column) => column.name));
  if (sort && !columnNames.has(sort)) {
    throw Object.assign(new Error('Sort column is not valid for this table.'), { status: 400 });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw Object.assign(new Error(`Limit must be between 1 and ${MAX_LIMIT}.`), { status: 400 });
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > 1_000_000) {
    throw Object.assign(new Error('Offset must be between 0 and 1000000.'), { status: 400 });
  }
  // Hide soft-deleted rows by default (deleted_at null = active)
  const hasDeleted = entity.type === 'table' && columnNames.has('deleted_at');
  const effectiveWhere = hasDeleted && !includeDeleted ? ' WHERE "deleted_at" IS NULL' : '';
  if (hasDeleted) {
    // Soft-delete filtering is table-only; SQL views already define their own scope.
  }
  const countSql = `SELECT COUNT(*) AS n FROM ${quoteId(tableName)}${effectiveWhere}`;
  const total = db.prepare(countSql).get().n;

  const orderBy = sort ? ` ORDER BY ${quoteId(sort)} ${direction === 'desc' ? 'DESC' : 'ASC'}` : '';
  const sql = `SELECT * FROM ${quoteId(tableName)}${effectiveWhere}${orderBy} LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(limit, offset);
  return { total, rows };
}

// Helper: get a single row by id
function getTableRow(tableName, rowId) {
  getEntity(tableName);
  const row = db.prepare(`SELECT * FROM ${quoteId(tableName)} WHERE id = ?`).get(rowId);
  return row;
}

// Helper: insert a row
function insertRow(tableName, values) {
  getEntity(tableName, { allowView: false, writable: true });
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw Object.assign(new Error('Expected a record object.'), { status: 400 });
  }
  const vals = { ...values };
  const columnsAvailable = new Set(getTableInfo(tableName).map((column) => column.name));
  for (const column of Object.keys(vals)) {
    if (!columnsAvailable.has(column) || MUTABLE_SYSTEM_COLUMNS.has(column)) {
      throw Object.assign(new Error(`Column cannot be set: ${column}`), { status: 400 });
    }
  }
  // Omit blank id so the column DEFAULT (random hex) kicks in
  if (vals.id === null || vals.id === undefined || vals.id === '') delete vals.id;
  // Auto-fill required audit timestamps
  if (!vals.created_at) vals.created_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (!vals.updated_at) vals.updated_at = vals.created_at;
  if (vals.row_version === null || vals.row_version === undefined) vals.row_version = 0;
  const cols = Object.keys(vals);
  const colList = cols.map((c) => quoteId(c)).join(', ');
  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  const info = stmt.run(...cols.map((c) => vals[c]));
  return info.lastInsertRowid;
}

// Helper: update a row
function updateRow(tableName, rowId, values) {
  getEntity(tableName, { allowView: false, writable: true });
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw Object.assign(new Error('Expected a record object.'), { status: 400 });
  }
  const columnsAvailable = new Set(getTableInfo(tableName).map((column) => column.name));
  const expectedVersion = values.row_version;
  const vals = { ...values };
  delete vals.row_version;
  for (const column of Object.keys(vals)) {
    if (!columnsAvailable.has(column) || column === 'id' || MUTABLE_SYSTEM_COLUMNS.has(column)) {
      throw Object.assign(new Error(`Column cannot be updated: ${column}`), { status: 400 });
    }
  }
  if (expectedVersion !== undefined && columnsAvailable.has('row_version')) {
    const current = db.prepare(`SELECT row_version FROM ${quoteId(tableName)} WHERE id = ? AND deleted_at IS NULL`).get(rowId);
    if (!current) throw Object.assign(new Error('Record not found.'), { status: 404 });
    if (Number(expectedVersion) !== Number(current.row_version)) {
      throw Object.assign(new Error('This record changed since it was loaded. Refresh and retry.'), { status: 409 });
    }
  }
  const cols = Object.keys(vals);
  if (!cols.length) throw Object.assign(new Error('No editable values were provided.'), { status: 400 });
  const setList = cols.map((c) => quoteId(c) + ' = ?').join(', ');
  const versionSet = columnsAvailable.has('row_version') ? ', "row_version" = "row_version" + 1' : '';
  const activeClause = columnsAvailable.has('deleted_at') ? ' AND deleted_at IS NULL' : '';
  const sql = `UPDATE ${quoteId(tableName)} SET ${setList}, updated_at = datetime('now')${versionSet} WHERE id = ?${activeClause}`;
  const stmt = db.prepare(sql);
  const result = stmt.run(...cols.map((c) => vals[c]), rowId);
  if (!Number(result.changes)) throw Object.assign(new Error('Record not found.'), { status: 404 });
  return result;
}

// Helper: delete a row (soft delete per the workbook design: deleted_at null = active)
function deleteRow(tableName, rowId) {
  getEntity(tableName, { allowView: false, writable: true });
  const cols = getTableInfo(tableName).map((c) => c.name);
  if (cols.includes('deleted_at')) {
    const result = db.prepare(`UPDATE ${quoteId(tableName)} SET deleted_at = datetime('now'), updated_at = datetime('now'), row_version = row_version + 1 WHERE id = ? AND deleted_at IS NULL`).run(rowId);
    if (!Number(result.changes)) throw Object.assign(new Error('Record not found.'), { status: 404 });
    return result;
  }
  const result = db.prepare(`DELETE FROM ${quoteId(tableName)} WHERE id = ?`).run(rowId);
  if (!Number(result.changes)) throw Object.assign(new Error('Record not found.'), { status: 404 });
  return result;
}

// Helper: get choice list values
function getChoiceList(listKey) {
  return db.prepare('SELECT value FROM choice_value WHERE list_key = ? ORDER BY sort_order').all(listKey);
}

// Helper: get FK options (referenced table rows)
function getFkOptions(fkTable) {
  try {
    getEntity(fkTable, { allowView: false });
    const cols = db.prepare(`PRAGMA table_info("${fkTable}")`).all().map((c) => c.name);
    // Pick the best display column
    const displayCol = ['name', 'full_name', 'title', 'label', 'account_number', 'email', 'id']
      .find((c) => cols.includes(c)) || cols[0];
    const extraCols = cols.includes('full_name') && displayCol !== 'full_name' ? ['full_name'] : [];
    const selectCols = ['id', displayCol, ...extraCols.filter((c) => c !== displayCol)]
      .map((c) => `"${c}"`).join(', ');
    const where = cols.includes('deleted_at') ? ' WHERE deleted_at IS NULL' : '';
    return db.prepare(`SELECT ${selectCols} FROM ${quoteId(fkTable)}${where} ORDER BY ${quoteId(displayCol)} LIMIT 200`).all();
  } catch (e) {
    if (e.status) throw e;
    throw Object.assign(new Error(`Could not load lookup options for ${fkTable}.`), { status: 400 });
  }
}

// Helper: run a raw SQL query (read-only)
function runQuery(sql) {
  if (typeof sql !== 'string' || sql.trim().length === 0 || sql.length > 10000) {
    throw Object.assign(new Error('Enter a query of 1 to 10000 characters.'), { status: 400 });
  }
  const trimmed = sql.trim();
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    throw Object.assign(new Error('Only read-only SELECT queries are allowed.'), { status: 400 });
  }
  db.exec('PRAGMA query_only = ON');
  try {
    const iterator = db.prepare(sql).iterate();
    const rows = [];
    for (const row of iterator) {
      rows.push(row);
      if (rows.length >= 5000) break;
    }
    return rows;
  } finally {
    db.exec('PRAGMA query_only = OFF');
  }
}

function importRows(tableName, rows) {
  getEntity(tableName, { allowView: false, writable: true });
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_IMPORT_ROWS) {
    throw Object.assign(new Error(`Import must contain between 1 and ${MAX_IMPORT_ROWS} rows.`), { status: 400 });
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw Object.assign(new Error('Each imported row must be an object.'), { status: 400 });
      }
      const importedRow = { ...row };
      for (const column of MUTABLE_SYSTEM_COLUMNS) delete importedRow[column];
      insertRow(tableName, importedRow);
    }
    db.exec('COMMIT');
    return { imported: rows.length };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// ---------- HTTP server ----------
const server = http.createServer(async (req, res) => {
  const method = req.method;
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;
  const allowedOrigins = new Set([
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    `http://${HOST}:${PORT}`,
    `http://localhost:${PORT}`,
  ]);
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  // CORS preflight
  if (method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) {
      res.writeHead(403);
      res.end();
      return;
    }
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Static files
  if (method === 'GET' && pathname === '/') {
    const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  if (method === 'GET' && pathname === '/app.js') {
    const js = fs.readFileSync(path.join(PUBLIC_DIR, 'app.js'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(js);
    return;
  }

  // API routes
  if (method === 'GET' && pathname === '/api/health') {
    json(res, 200, { ok: true, sqlite: true });
    return;
  }

  if (method === 'GET' && pathname === '/api/tables') {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    json(res, 200, tables.map((t) => t.name));
    return;
  }

  if (method === 'GET' && pathname === '/api/views') {
    const views = db.prepare("SELECT name FROM sqlite_master WHERE type='view' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    json(res, 200, views.map((view) => view.name));
    return;
  }

  if (method === 'GET' && pathname === '/api/field-meta') {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'field_meta.json'), 'utf8'));
      json(res, 200, meta);
    } catch (error) {
      json(res, 500, { error: `Could not read field metadata: ${error.message}` });
    }
    return;
  }

  const tableMatch = pathname.match(/^\/api\/table\/([^/]+)(\/rows)?(\/.*)?$/);
  if (tableMatch && method === 'GET') {
    const tableName = decodeURIComponent(tableMatch[1]);
    const rest = tableMatch[3] || '';
    try {
      if (rest === '/columns') {
        json(res, 200, getTableInfo(tableName));
      } else if (rest.match(/^\/row\/([^/]+)$/)) {
        const rowId = rest.match(/^\/row\/([^/]+)$/)[1];
        const row = getTableRow(tableName, rowId);
        json(res, row ? 200 : 404, row || { error: 'Record not found.' });
      } else {
        const limit = Number(requestUrl.searchParams.get('limit') || '100');
        const offset = Number(requestUrl.searchParams.get('offset') || '0');
        const sort = requestUrl.searchParams.get('sort') || '';
        const direction = requestUrl.searchParams.get('direction') || 'asc';
        const includeDeleted = requestUrl.searchParams.get('includeDeleted') === 'true';
        if (!['asc', 'desc'].includes(direction)) {
          throw Object.assign(new Error('Sort direction must be asc or desc.'), { status: 400 });
        }
        const result = getTableRows(tableName, limit, offset, { sort, direction, includeDeleted });
        json(res, 200, result);
      }
    } catch (error) {
      json(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (method === 'POST' && pathname.match(/^\/api\/table\/([^/]+)\/row$/)) {
    const tableName = decodeURIComponent(pathname.match(/^\/api\/table\/([^/]+)\/row$/)[1]);
    try {
      const body = await readBody(req);
      const values = JSON.parse(body);
      const id = insertRow(tableName, values);
      json(res, 201, { id });
    } catch (error) {
      json(res, error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.message });
    }
    return;
  }

  if (method === 'PUT' && pathname.match(/^\/api\/table\/([^/]+)\/row\/([^/]+)$/)) {
    const [, encodedTable, encodedId] = pathname.match(/^\/api\/table\/([^/]+)\/row\/([^/]+)$/);
    const tableName = decodeURIComponent(encodedTable);
    const rowId = decodeURIComponent(encodedId);
    try {
      const body = await readBody(req);
      const values = JSON.parse(body);
      updateRow(tableName, rowId, values);
      json(res, 200, { ok: true });
    } catch (error) {
      json(res, error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.message });
    }
    return;
  }

  if (method === 'DELETE' && pathname.match(/^\/api\/table\/([^/]+)\/row\/([^/]+)$/)) {
    const [, encodedTable, encodedId] = pathname.match(/^\/api\/table\/([^/]+)\/row\/([^/]+)$/);
    const tableName = decodeURIComponent(encodedTable);
    const rowId = decodeURIComponent(encodedId);
    try {
      deleteRow(tableName, rowId);
      json(res, 200, { ok: true });
    } catch (error) {
      json(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (method === 'POST' && pathname.match(/^\/api\/import\/([^/]+)$/)) {
    const tableName = decodeURIComponent(pathname.match(/^\/api\/import\/([^/]+)$/)[1]);
    try {
      const body = JSON.parse(await readBody(req));
      json(res, 201, importRows(tableName, body.rows));
    } catch (error) {
      json(res, error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.message });
    }
    return;
  }

  if (method === 'GET' && pathname.match(/^\/api\/export\/([^/]+)$/)) {
    const entityName = decodeURIComponent(pathname.match(/^\/api\/export\/([^/]+)$/)[1]);
    try {
      const entity = getEntity(entityName);
      const columns = getTableInfo(entityName).map((column) => column.name);
      const rows = [];
      let offset = 0;
      while (true) {
        const page = getTableRows(entityName, MAX_LIMIT, offset, { includeDeleted: false });
        rows.push(...page.rows);
        offset += page.rows.length;
        if (!page.rows.length || offset >= page.total) break;
        if (rows.length >= 20000) {
          throw Object.assign(new Error('Export is limited to 20000 rows.'), { status: 413 });
        }
      }
      json(res, 200, { name: entity.name, type: entity.type, columns, rows });
    } catch (error) {
      json(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (method === 'GET' && pathname.match(/^\/api\/choices\/([^/]+)$/)) {
    const listKey = decodeURIComponent(pathname.match(/^\/api\/choices\/([^/]+)$/)[1]);
    try {
      json(res, 200, getChoiceList(listKey));
    } catch (error) {
      json(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (method === 'GET' && pathname.match(/^\/api\/fk-options\/([^/]+)$/)) {
    const fkTable = decodeURIComponent(pathname.match(/^\/api\/fk-options\/([^/]+)$/)[1]);
    try {
      json(res, 200, getFkOptions(fkTable));
    } catch (error) {
      json(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (method === 'POST' && pathname === '/api/query') {
    try {
      const body = await readBody(req);
      const { sql } = JSON.parse(body);
      const rows = runQuery(sql);
      json(res, 200, rows);
    } catch (error) {
      json(res, error.status || (error instanceof SyntaxError ? 400 : 400), { error: error.message });
    }
    return;
  }

  // 404
  if (pathname.startsWith('/api/')) {
    json(res, 404, { error: 'Not found.' });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log('Data model server running at http://' + HOST + ':' + PORT);
  console.log('Database:', DB_PATH);
});
