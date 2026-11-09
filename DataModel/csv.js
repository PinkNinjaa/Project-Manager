// csv.js - Export/import tables as CSV
// Usage:
//   node csv.js export <table> [file.csv]     - export a table to CSV
//   node csv.js import <table> <file.csv>     - import CSV into a table
//   node csv.js export-all                    - export all tables to csv/ folder

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data_model.sqlite');
const CSV_DIR = path.join(ROOT, 'csv');

function quoteCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function parseCsvLine(line) {
  // Simple CSV parser
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let field = '';
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else { field += line[i]; i++; }
      }
      fields.push(field);
      if (i < line.length && line[i] === ',') i++;
    } else {
      const end = line.indexOf(',', i);
      if (end === -1) { fields.push(line.slice(i)); i = line.length; }
      else { fields.push(line.slice(i, end)); i = end + 1; }
    }
  }
  return fields;
}

const cmd = process.argv[2];

if (!fs.existsSync(DB_PATH)) {
  console.log('Database not found. Run build_db.js first.');
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);

if (cmd === 'export') {
  const table = process.argv[3];
  const file = process.argv[4] || path.join(CSV_DIR, table + '.csv');
  if (!table) { console.log('Usage: node csv.js export <table> [file.csv]'); process.exit(1); }
  if (!fs.existsSync(CSV_DIR)) fs.mkdirSync(CSV_DIR, { recursive: true });
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();
  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
  let csv = cols.map(quoteCsv).join(',') + '\n';
  for (const row of rows) {
    csv += cols.map((c) => quoteCsv(row[c])).join(',') + '\n';
  }
  fs.writeFileSync(file, csv, 'utf8');
  console.log(`Exported ${rows.length} rows from ${table} to ${file}`);
} else if (cmd === 'import') {
  const table = process.argv[3];
  const file = process.argv[4];
  if (!table || !file) { console.log('Usage: node csv.js import <table> <file.csv>'); process.exit(1); }
  if (!fs.existsSync(file)) { console.log('File not found: ' + file); process.exit(1); }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) { console.log('CSV must have header + at least one row.'); process.exit(1); }
  const headers = parseCsvLine(lines[0]);
  const cols = headers.map((h) => '"' + h.replace(/"/g, '""') + '"').join(', ');
  const placeholders = headers.map(() => '?').join(', ');
  const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const values = fields.map((f) => f === '' ? null : f);
    stmt.run(values);
    count++;
  }
  console.log(`Imported ${count} rows into ${table} from ${file}`);
} else if (cmd === 'export-all') {
  if (!fs.existsSync(CSV_DIR)) fs.mkdirSync(CSV_DIR, { recursive: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  for (const t of tables) {
    const rows = db.prepare(`SELECT * FROM "${t.name}"`).all();
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    let csv = cols.map(quoteCsv).join(',') + '\n';
    for (const row of rows) {
      csv += cols.map((c) => quoteCsv(row[c])).join(',') + '\n';
    }
    fs.writeFileSync(path.join(CSV_DIR, t.name + '.csv'), csv, 'utf8');
    console.log(`Exported ${t.name}: ${rows.length} rows`);
  }
  console.log(`All tables exported to ${CSV_DIR}/`);
} else {
  console.log('Usage:');
  console.log('  node csv.js export <table> [file.csv]');
  console.log('  node csv.js import <table> <file.csv>');
  console.log('  node csv.js export-all');
}

db.close();
