import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const TARGETS = ['js', 'scripts', 'tests', 'server.mjs'];
const SKIP = new Set(['node_modules', '.git', 'Src', 'Components', 'Controls', 'References', 'Resources']);

async function collect(path) {
  const absolute = join(ROOT, path);
  let entries;

  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    return [absolute];
  }

  const files = [];
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const child = join(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collect(relative(ROOT, child))));
    } else if (/\.(m?js)$/.test(entry.name)) {
      files.push(child);
    }
  }
  return files;
}

const files = (await Promise.all(TARGETS.map(collect))).flat().sort();
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(`Syntax error in ${relative(ROOT, file)}`);
    if (result.stderr) console.error(result.stderr.trim());
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Syntax checked ${files.length} JavaScript files.`);
