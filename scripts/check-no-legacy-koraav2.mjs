#!/usr/bin/env node
/**
 * Falla si el código activo importa o referencia koraav2/ (carpeta legacy).
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const root = process.cwd();
const ACTIVE_DIRS = ['app', 'components', 'hooks', 'contexts', 'lib', 'constants', '__tests__'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const PATTERN = /koraav2[/\\]|from\s+['"]@?\/?koraav2|require\s*\(\s*['"][^'"]*koraav2/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.has(extname(name))) out.push(full);
  }
  return out;
}

const hits = [];

for (const dir of ACTIVE_DIRS) {
  const base = join(root, dir);
  try {
    statSync(base);
  } catch {
    continue;
  }
  for (const file of walk(base)) {
    const rel = file.slice(root.length + 1);
    const text = readFileSync(file, 'utf8');
    if (PATTERN.test(text)) {
      hits.push(rel);
    }
  }
}

if (hits.length > 0) {
  console.error('❌ Referencias a koraav2/ en código activo (usa solo la raíz del repo):\n');
  for (const h of hits) console.error(`   - ${h}`);
  process.exit(1);
}

console.log('✅ Código activo sin referencias a koraav2/ (carpeta legacy ignorada).');
