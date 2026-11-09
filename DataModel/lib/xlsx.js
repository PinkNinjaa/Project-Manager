// lib/xlsx.js - Dependency-free .xlsx reader
// Reads a .xlsx workbook (which is a ZIP archive) and returns structured data by sheet name.
// No external packages required - uses the Node standard library + PowerShell for unzip.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function decodeXmlEntities(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

function colToNum(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

// Parse one worksheet XML into a sparse array of rows ([rowNum - 1]).
// Each row is an array of cell strings by column index.
function parseSheetXml(xml, shared) {
  const rows = [];
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let m;
  while ((m = rowRe.exec(xml)) !== null) {
    const rn = parseInt(m[1], 10);
    const cells = [];
    const cellInner = m[2];
    const cellRe = /<c([^>]*?)\/>|<c([^>]*)>([\s\S]*?)<\/c>/g;
    let cm;
    while ((cm = cellRe.exec(cellInner)) !== null) {
      const attrs = cm[2] !== undefined ? cm[2] : cm[1];
      const inner = cm[3] || '';
      const refM = attrs.match(/r="([A-Z]+)(\d+)"/);
      const typeM = attrs.match(/t="([^"]+)"/);
      const col = refM ? colToNum(refM[1]) : cells.length + 1;
      let val = '';
      const vm = inner.match(/<v>([\s\S]*?)<\/v>/);
      if (typeM && typeM[1] === 's' && vm) {
        val = shared[parseInt(vm[1], 10)] ?? '';
      } else if (typeM && typeM[1] === 'inlineStr') {
        val = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXmlEntities(x[1])).join('');
      } else if (vm) {
        val = decodeXmlEntities(vm[1]);
      }
      cells[col - 1] = val;
    }
    rows[rn - 1] = cells;
  }
  return rows;
}

function parseSharedStrings(xml) {
  const shared = [];
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const txt = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXmlEntities(x[1])).join('');
    shared.push(txt);
  }
  return shared;
}

function extractXlsx(xlsxPath, destDir) {
  // Use .NET System.IO.Compression.ZipFile via PowerShell (handles .xlsx extension)
  const src = xlsxPath.replace(/'/g, "''");
  const dest = destDir.replace(/'/g, "''");
  const ps = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${src}', '${dest}')`;
  execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { stdio: 'pipe' });
}

function readWorkbook(xlsxPath) {
  const tmpDir = path.join(os.tmpdir(), 'tigerturf_xlsx_' + Date.now());
  extractXlsx(xlsxPath, tmpDir);

  const xl = path.join(tmpDir, 'xl');

  const wbXml = fs.readFileSync(path.join(xl, 'workbook.xml'), 'utf8');
  const sheets = {};
  for (const m of wbXml.matchAll(/<sheet name="([^"]+)"[^>]*r:id="(rId\d+)"/g)) {
    sheets[m[2]] = { name: m[1], id: m[2] };
  }

  const relsXml = fs.readFileSync(path.join(xl, '_rels', 'workbook.xml.rels'), 'utf8');
  const rels = {};
  for (const m of relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>/g)) {
    let target = m[2];
    if (target.startsWith('/')) target = target.slice(1);
    rels[m[1]] = path.join(xl, target);
  }

  const ssXml = fs.readFileSync(path.join(xl, 'sharedStrings.xml'), 'utf8');
  const shared = parseSharedStrings(ssXml);

  const result = {};
  for (const [rId, info] of Object.entries(sheets)) {
    const sheetFile = rels[rId];
    if (!sheetFile) {
      console.log('WARNING: no rels entry for', rId, info.name);
      continue;
    }
    const xml = fs.readFileSync(sheetFile, 'utf8');
    const rows = parseSheetXml(xml, shared);
    result[info.name] = rows;
  }

  // Clean up temp folder
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

  return result;
}

module.exports = { readWorkbook };
