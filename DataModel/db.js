// db.js - Command-line tool for the data model
// Usage:
//   node db.js tables                          - list all tables
//   node db.js columns <table>                 - show columns for a table
//   node db.js rows <table> [limit]            - show rows from a table
//   node db.js sql "<query>"                   - run a read-only SQL query
//   node db.js reset                           - delete the database file

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data_model.sqlite');

const cmd = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (!cmd) {
  console.log('Usage: node db.js <command> [args]');
  console.log('');
  console.log('Commands:');
  console.log('  tables                      List all tables');
  console.log('  columns <table>             Show columns for a table');
  console.log('  rows <table> [limit]        Show rows from a table');
  console.log('  sql "<query>"               Run a read-only SQL query');
  console.log('  reset                       Delete the database file');
  process.exit(0);
}

if (cmd === 'tables') {
  if (!fs.existsSync(DB_PATH)) { console.log('Database not found. Run build_db.js first.'); process.exit(1); }
  const db = new DatabaseSync(DB_PATH);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  console.log('Tables:');
  for (const t of tables) {
    try {
      const n = db.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get().n;
      console.log(`  ${t.name.padEnd(28)} ${n} rows`);
    } catch (e) {
      console.log(`  ${t.name.padEnd(28)} ERROR`);
    }
  }
  db.close();
} else if (cmd === 'columns') {
  if (!arg1) { console.log('Usage: node db.js columns <table>'); process.exit(1); }
  if (!fs.existsSync(DB_PATH)) { console.log('Database not found.'); process.exit(1); }
  const db = new DatabaseSync(DB_PATH);
  const cols = db.prepare(`PRAGMA table_info("${arg1}")`).all();
  console.log(`Columns for ${arg1}:`);
  for (const c of cols) {
    console.log(`  ${c.name.padEnd(30)} ${c.type.padEnd(12)} ${c.notnull ? 'NOT NULL' : 'NULL'} ${c.pk ? 'PK' : ''}`);
  }
  db.close();
} else if (cmd === 'rows') {
  if (!arg1) { console.log('Usage: node db.js rows <table> [limit]'); process.exit(1); }
  const limit = parseInt(arg2) || 20;
  if (!fs.existsSync(DB_PATH)) { console.log('Database not found.'); process.exit(1); }
  const db = new DatabaseSync(DB_PATH);
  const rows = db.prepare(`SELECT * FROM "${arg1}" LIMIT ${limit}`).all();
  console.log(`Rows from ${arg1} (limit ${limit}):`);
  if (rows.length === 0) { console.log('  (no rows)'); }
  for (const row of rows) {
    console.log('  ---');
    for (const [k, v] of Object.entries(row)) {
      console.log(`    ${k}: ${v === null ? 'NULL' : v}`);
    }
  }
  db.close();
} else if (cmd === 'sql') {
  if (!arg1) { console.log('Usage: node db.js sql "<query>"'); process.exit(1); }
  if (!fs.existsSync(DB_PATH)) { console.log('Database not found.'); process.exit(1); }
  const db = new DatabaseSync(DB_PATH);
  try {
    const rows = db.prepare(arg1).all();
    console.log(`${rows.length} row(s)`);
    if (rows.length > 0) {
      const cols = Object.keys(rows[0]);
      console.log(cols.join(' | '));
      console.log('-'.repeat(cols.join(' | ').length));
      for (const row of rows) {
        console.log(cols.map((c) => row[c] == null ? 'NULL' : row[c]).join(' | '));
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  db.close();
} else if (cmd === 'reset') {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Database deleted.');
  } else {
    console.log('Database not found.');
  }
} else {
  console.log('Unknown command: ' + cmd);
}
