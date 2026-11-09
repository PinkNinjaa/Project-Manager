// build_db.js - Builds the data_model.sqlite database from the workbook.
// Run: node build_db.js
// Options: --empty (no seed data)   --verbose

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { readWorkbook } = require('./lib/xlsx.js');

const ROOT = __dirname;
const WORKBOOK = path.join(ROOT, 'TigerTurf_Data_Model.xlsx');
const DB_PATH = path.join(ROOT, 'data_model.sqlite');
const SCHEMA_PATH = path.join(ROOT, 'schema.sql');
const REPORT_PATH = path.join(ROOT, 'build_report.txt');
const SEED_PATH = path.join(ROOT, 'seed.sql');
const VIEWS_PATH = path.join(ROOT, 'views.sql');
const BACKUP_DIR = path.join(ROOT, 'backups');

const VERBOSE = process.argv.includes('--verbose');
const EMPTY = process.argv.includes('--empty');

function log(...args) { if (VERBOSE) console.log(...args); }

// ---------- Type mapping ----------
const SQL_TYPE = {
  Uuid: 'TEXT',
  Text: 'TEXT',
  LongText: 'TEXT',
  Choice: 'TEXT',
  Lookup: 'TEXT',
  DateTime: 'TEXT',
  Date: 'TEXT',
  Int: 'INTEGER',
  Decimal: 'NUMERIC',
  Money: 'NUMERIC',
  Bool: 'INTEGER',
};
const SKIP_TYPES = new Set(['Calc', 'Rollup']);

// Common fields added to every table (from the workbook's "(all tables)" section).
const COMMON_FIELDS = [
  { name: 'id', type: 'Uuid', required: true, look: '', note: 'Client-generated primary key' },
  { name: 'created_at', type: 'DateTime', required: true, look: '', note: '' },
  { name: 'updated_at', type: 'DateTime', required: true, look: '', note: '' },
  { name: 'created_by', type: 'Lookup', required: true, look: 'user', note: '' },
  { name: 'deleted_at', type: 'DateTime', required: false, look: '', note: 'Soft delete. Null means active' },
  { name: 'row_version', type: 'Int', required: true, look: '', note: 'Optimistic concurrency for multi-user edits' },
];

// ---------- Read workbook ----------
console.log('Reading workbook...');
const sheets = readWorkbook(WORKBOOK);

function cleanRows(rows) {
  return (rows || []).map((r) => (r ? r.map((c) => (c == null ? '' : String(c)).trim()) : null))
    .filter((r) => r && r.some((c) => c !== ''));
}

const entitiesRows = cleanRows(sheets.Entities).slice(1); // skip header
const fieldsRows = cleanRows(sheets.Fields).slice(1);
const relationshipsRows = cleanRows(sheets.Relationships).slice(1);
const stagesRows = cleanRows(sheets.Stages).slice(1);
const rollupsRows = cleanRows(sheets.Rollups).slice(1);
const choiceRows = cleanRows(sheets['Choice Lists']).slice(1);

// ---------- Parse entities ----------
const entities = [];
for (const r of entitiesRows) {
  const [name, module, purpose, fieldsCount, relsCount] = r;
  if (!name || name === 'Total') continue;
  // Skip note rows (e.g. "Relationships total counts each link once...")
  if (name.includes(' ') || name !== name.toLowerCase()) continue;
  entities.push({ name, module, purpose: purpose || '', fieldsCount: fieldsCount || '', relsCount: relsCount || '' });
}

// ---------- Parse fields ----------
// fieldsByEntity[entityName] = [{name, type, required, look, note}, ...]
const fieldsByEntity = {};
for (const r of fieldsRows) {
  const [entity, field, type, required, look, note] = r;
  if (!entity) continue;
  if (!fieldsByEntity[entity]) fieldsByEntity[entity] = [];
  fieldsByEntity[entity].push({ name: field, type, required: (required || 'N') === 'Y', look: look || '', note: note || '' });
}

// Add common fields to every entity
for (const ent of entities) {
  if (!fieldsByEntity[ent.name]) fieldsByEntity[ent.name] = [];
  const existing = new Set(fieldsByEntity[ent.name].map((f) => f.name));
  for (const cf of COMMON_FIELDS) {
    if (!existing.has(cf.name)) fieldsByEntity[ent.name].push({ ...cf });
  }
}

// ---------- Parse relationships ----------
const relationships = [];
for (const r of relationshipsRows) {
  const [parent, child, cardinality, fk, required, onDelete, purpose] = r;
  if (!parent || !child) continue;
  if (cardinality.toLowerCase().includes('polymorphic')) {
    relationships.push({
      parent, child, cardinality: cardinality || '',
      fkTable: '', fkColumn: '',
      required: false,
      onDelete: onDelete || '',
      purpose: purpose || '',
      polymorphic: true,
    });
    continue;
  }
  const fkParts = fk ? fk.split('.') : [];
  const fkTable = fkParts[0] || '';
  const fkColRaw = fkParts[1] || '';
  const fkCols = fkColRaw.split(' / ').map((c) => c.trim());
  const reqRaw = (required || '').split(' / ').map((c) => c.trim());
  for (let i = 0; i < fkCols.length; i++) {
    const isRequired = (reqRaw[i] || '').startsWith('Y');
    relationships.push({
      parent, child, cardinality: cardinality || '',
      fkTable, fkColumn: fkCols[i],
      required: isRequired,
      onDelete: onDelete || '',
      purpose: purpose || '',
      polymorphic: false,
    });
  }
}

// ---------- Parse choice lists ----------
// choiceLists[listKey] = [{order, value}, ...]
const choiceLists = {};
const listOrder = [];
for (const r of choiceRows) {
  const [listKey, order, value] = r;
  if (!listKey) continue;
  if (!choiceLists[listKey]) {
    choiceLists[listKey] = [];
    listOrder.push(listKey);
  }
  choiceLists[listKey].push({ order: parseInt(order, 10) || 0, value: value || '' });
}

// ---------- Validation ----------
const errors = [];
const warnings = [];

const entityNames = new Set(entities.map((e) => e.name));
entityNames.add('choice_value'); // auxiliary table

// Check every field lookup target exists
for (const ent of entities) {
  for (const f of fieldsByEntity[ent.name] || []) {
    if (f.type === 'Lookup' && f.look && !entityNames.has(f.look)) {
      errors.push(`${ent.name}.${f.name}: lookup target "${f.look}" does not exist`);
    }
    if (f.type === 'Choice' && f.look && !choiceLists[f.look]) {
      errors.push(`${ent.name}.${f.name}: choice list "${f.look}" does not exist`);
    }
  }
}

// Check every relationship FK exists
for (const rel of relationships) {
  if (rel.polymorphic) continue;
  if (!entityNames.has(rel.parent)) errors.push(`Relationship: parent "${rel.parent}" does not exist`);
  if (!entityNames.has(rel.child)) errors.push(`Relationship: child "${rel.child}" does not exist`);
  if (rel.fkTable && !entityNames.has(rel.fkTable)) errors.push(`Relationship: FK table "${rel.fkTable}" does not exist`);
}

if (errors.length > 0) {
  console.error('VALIDATION ERRORS:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
if (warnings.length > 0) {
  console.log('WARNINGS:');
  for (const w of warnings) console.log('  -', w);
}

// ---------- Generate schema.sql ----------
let schemaLines = [];
schemaLines.push('-- Generated by build_db.js from TigerTurf_Data_Model.xlsx');
schemaLines.push('-- DO NOT EDIT BY HAND - edit the workbook and re-run build_db.js');
schemaLines.push('');
schemaLines.push('PRAGMA foreign_keys = ON;');
schemaLines.push('');

// Helper: column definition
function colDef(f) {
  const sqlType = SQL_TYPE[f.type];
  if (!sqlType) return null; // Calc/Rollup skipped
  let parts = [`"${f.name}" ${sqlType}`];
  if (f.name === 'id') {
    parts.push('PRIMARY KEY DEFAULT (lower(hex(randomblob(16))))');
  }
  if (f.required && f.name !== 'id' && f.name !== 'created_by' && f.type !== 'Lookup') {
    parts.push('NOT NULL');
  }
  // defaults
  if (f.type === 'DateTime' && !f.required === false) {
    // handled by NOT NULL + default below
  }
  if (f.type === 'Bool') parts.push('DEFAULT 0');
  if (f.type === 'Int' && f.required) parts.push('DEFAULT 0');
  return parts.join(' ');
}

// Build tables in dependency order (tables without incoming FKs first, roughly)
// Simple approach: order entities so that lookup targets come before tables referencing them.
function topologicalSort(ents, rels) {
  const deps = {};
  for (const e of ents) deps[e.name] = new Set();
  for (const rel of rels) {
    if (rel.polymorphic) continue;
    // child depends on parent
    if (deps[rel.child]) deps[rel.child].add(rel.parent);
  }
  const sorted = [];
    const visited = new Set();
  function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);
    for (const dep of (deps[name] || [])) visit(dep);
    sorted.push(name);
  }
  for (const e of ents) visit(e.name);
  return sorted;
}

const orderedNames = topologicalSort(entities, relationships);
const orderedEntities = entities.filter((e) => orderedNames.includes(e.name));

// Collect FK constraints per table
const fkByTable = {};
for (const rel of relationships) {
  if (rel.polymorphic) continue;
  if (!fkByTable[rel.child]) fkByTable[rel.child] = [];
  const onDeleteAction = rel.onDelete === 'Cascade' ? 'CASCADE'
    : rel.onDelete === 'Set null' ? 'SET NULL'
    : 'RESTRICT';
  fkByTable[rel.child].push({
    column: rel.fkColumn,
    refTable: rel.parent,
    refColumn: 'id',
    onDelete: onDeleteAction,
  });
}

for (const ent of orderedEntities) {
  const fields = (fieldsByEntity[ent.name] || []).filter((f) => SQL_TYPE[f.type]);
  const cols = [];
  const fks = [];
  for (const f of fields) {
    const def = colDef(f);
    if (def) cols.push(`  ${def}`);
  }
  // Add FK constraints
  for (const fk of (fkByTable[ent.name] || [])) {
    fks.push(`  FOREIGN KEY ("${fk.column}") REFERENCES "${fk.refTable}"("id") ON DELETE ${fk.onDelete}`);
  }
  const allParts = [...cols, ...fks];
  schemaLines.push(`CREATE TABLE IF NOT EXISTS "${ent.name}" (`);
  schemaLines.push(allParts.join(',\n'));
  schemaLines.push(');');
  schemaLines.push('');
}

// choice_value auxiliary table
schemaLines.push('-- Choice lists (configurable dropdown values)');
schemaLines.push('CREATE TABLE IF NOT EXISTS "choice_value" (');
schemaLines.push('  "list_key" TEXT NOT NULL,');
schemaLines.push('  "sort_order" INTEGER NOT NULL DEFAULT 0,');
schemaLines.push('  "value" TEXT NOT NULL,');
schemaLines.push('  PRIMARY KEY ("list_key", "sort_order")');
schemaLines.push(');');
schemaLines.push('');

// Indexes
schemaLines.push('-- Indexes');
schemaLines.push('CREATE INDEX IF NOT EXISTS idx_choice_value_list ON choice_value(list_key);');
for (const rel of relationships) {
  if (rel.polymorphic || !rel.fkColumn) continue;
  schemaLines.push(`CREATE INDEX IF NOT EXISTS idx_${rel.child}_${rel.fkColumn} ON "${rel.child}"("${rel.fkColumn}");`);
}
// Indexes on common columns
for (const ent of entities) {
  schemaLines.push(`CREATE INDEX IF NOT EXISTS idx_${ent.name}_deleted_at ON "${ent.name}"("deleted_at");`);
  schemaLines.push(`CREATE INDEX IF NOT EXISTS idx_${ent.name}_created_by ON "${ent.name}"("created_by");`);
}

const schemaSql = schemaLines.join('\n') + '\n';
fs.writeFileSync(SCHEMA_PATH, schemaSql, 'utf8');
console.log(`Schema written: ${schemaSql.length} bytes, ${entities.length} tables`);

// ---------- Export field metadata for the browser app ----------
// Maps table -> field -> { type, required, look } so the UI can render
// dropdowns for Choice fields (with the right list key) and Lookup fields.
const fieldMeta = {};
for (const ent of entities) {
  fieldMeta[ent.name] = {};
  for (const f of (fieldsByEntity[ent.name] || [])) {
    fieldMeta[ent.name][f.name] = {
      type: f.type,
      required: f.required,
      look: f.look || '',
      note: f.note || '',
    };
  }
}
fs.writeFileSync(path.join(ROOT, 'field_meta.json'), JSON.stringify(fieldMeta, null, 2), 'utf8');
console.log(`Field metadata written: field_meta.json`);

// ---------- Create database ----------
if (fs.existsSync(DB_PATH)) {
  const backupName = `data_model.backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
  try {
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, backupName));
    fs.unlinkSync(DB_PATH);
  } catch (e) {
    if (e.code === 'EBUSY' || e.code === 'EPERM') {
      console.error('');
      console.error('ERROR: The database is in use and cannot be replaced.');
      console.error('Close the database viewer first (close its browser window or');
      console.error('the server window), then run the rebuild again.');
      console.error('');
      process.exit(1);
    }
    throw e;
  }
  log(`Backed up existing DB to backups/${backupName}`);
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');

// Apply schema
db.exec(schemaSql);
log('Schema applied');

// Insert choice lists
const insertChoice = db.prepare('INSERT INTO choice_value(list_key, sort_order, value) VALUES (?, ?, ?)');
for (const key of listOrder) {
  for (const item of choiceLists[key].sort((a, b) => a.order - b.order)) {
    insertChoice.run(key, item.order, item.value);
  }
}
log(`Choice lists inserted: ${listOrder.length} lists`);

// ---------- Apply views.sql ----------
if (fs.existsSync(VIEWS_PATH)) {
  const viewsSql = fs.readFileSync(VIEWS_PATH, 'utf8');
  db.exec(viewsSql);
  log('Views applied');
} else {
  console.log('Note: views.sql not found - skipping views');
}

// ---------- Apply seed data ----------
if (!EMPTY && fs.existsSync(SEED_PATH)) {
  const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
  // Split into individual statements (respects multiline INSERTs)
  const statements = [];
  let current = '';
  for (const line of seedSql.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('PRAGMA')) continue;
    current += line + '\n';
    if (trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  let seedOk = 0, seedFail = 0;
  for (const stmt of statements) {
    const firstLine = stmt.split('\n')[0];
    try {
      db.exec(stmt);
      seedOk++;
    } catch (e) {
      seedFail++;
      console.log('SEED FAIL:', firstLine.substring(0, 90));
      console.log('  Error:', e.message);
    }
  }
  console.log(`Seed data: ${seedOk} applied, ${seedFail} failed`);
} else if (EMPTY) {
  console.log('Seed data skipped (--empty)');
} else {
  console.log('Note: seed.sql not found - database is empty');
}

// ---------- Build report ----------
let tableCounts = '';
let totalRows = 0;
for (const ent of entities) {
  try {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM "${ent.name}"`).get();
    const n = row.n;
    totalRows += n;
    tableCounts += `  ${ent.name.padEnd(28)} ${n}\n`;
  } catch (e) {
    tableCounts += `  ${ent.name.padEnd(28)} ERROR\n`;
  }
}
try {
  const cv = db.prepare('SELECT COUNT(*) AS n FROM choice_value').get();
  tableCounts += `  choice_value         ${cv.n}\n`;
  totalRows += cv.n;
} catch (e) {}

const report = [
  'TigerTurf Data Model - Build Report',
  '===================================',
  `Generated: ${new Date().toISOString()}`,
  `Source: ${WORKBOOK}`,
  `Database: ${DB_PATH}`,
  '',
  `Entities (tables): ${entities.length}`,
  `Total data rows: ${totalRows}`,
  '',
  'Table row counts:',
  tableCounts,
  '',
  'Errors:',
  errors.length ? errors.map((e) => '  - ' + e).join('\n') : '  None',
  '',
  'Warnings:',
  warnings.length ? warnings.map((w) => '  - ' + w).join('\n') : '  None',
  '',
  'Next steps:',
  '  1. Double-click "Open Database" to browse and edit.',
  '  2. Edit TigerTurf_Data_Model.xlsx to change the design.',
  '  3. Double-click "Rebuild Database" to regenerate from Excel.',
  '',
].join('\n');

fs.writeFileSync(REPORT_PATH, report, 'utf8');
console.log(report);

db.close();
console.log('\nBuild complete.');
