#!/usr/bin/env node
/**
 * Comprueba tablas/columnas mínimas vía PostgREST (misma URL que la app).
 * Uso: npm run check:supabase:schema
 */
import fs from 'fs';
import https from 'https';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const require = createRequire(import.meta.url);

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

function probe(baseUrl, anon, select, label) {
  const path = `/rest/v1/tasks?select=${encodeURIComponent(select)}&limit=0`;
  const url = new URL(path, baseUrl.replace(/\/$/, ''));

  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          Accept: 'application/json',
        },
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, label });
            return;
          }
          const detail = body.slice(0, 280);
          resolve({ ok: false, label, status: res.statusCode, detail });
        });
      }
    );
    req.on('error', (err) => resolve({ ok: false, label, detail: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, label, detail: 'timeout' });
    });
    req.end();
  });
}

function probeTable(baseUrl, anon, table) {
  const url = new URL(`/rest/v1/${table}?select=id&limit=0`, baseUrl.replace(/\/$/, ''));
  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          Accept: 'application/json',
        },
        timeout: 15000,
      },
      (res) => {
        res.resume();
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, label: `table:${table}`, status: res.statusCode });
      }
    );
    req.on('error', (err) => resolve({ ok: false, label: `table:${table}`, detail: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, label: `table:${table}`, detail: 'timeout' });
    });
    req.end();
  });
}

if (!fs.existsSync(envPath)) {
  console.error('\n❌ No existe .env. Ejecuta: npm run env:bootstrap\n');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
const urlStr = env.EXPO_PUBLIC_SUPABASE_URL;
const anon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!urlStr || !anon) {
  console.error('\n❌ Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en .env\n');
  process.exit(1);
}

for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

let extraHost = '';
try {
  const appConfig = require(join(root, 'app.config.js'));
  const extraUrl = appConfig?.expo?.extra?.supabaseUrl;
  if (extraUrl) extraHost = new URL(extraUrl).hostname;
} catch {
  /* ignore */
}

const envHost = new URL(urlStr).hostname;
console.log('\n🔍 Comprobando esquema Supabase (PostgREST)…');
console.log('   Proyecto (.env):', envHost);
if (extraHost && extraHost !== envHost) {
  console.warn(
    '\n⚠️  app.config.js extra.supabaseUrl usa otro host:',
    extraHost,
    '\n   La app en dev prioriza .env; reinicia Metro: npm run dev:clear\n'
  );
}

const checks = [
  () => probeTable(urlStr, anon, 'tasks'),
  () => probe(urlStr, anon, 'id,parent_task_id,project_id,scheduled_date', 'tasks.columns'),
  () => probeTable(urlStr, anon, 'projects'),
  () => probeTable(urlStr, anon, 'profiles'),
];

const results = [];
for (const run of checks) {
  results.push(await run());
}

let failed = 0;
for (const r of results) {
  if (r.ok) {
    console.log('   ✅', r.label);
  } else {
    failed += 1;
    console.log('   ❌', r.label, r.status ? `HTTP ${r.status}` : '', r.detail ? `— ${r.detail}` : '');
  }
}

if (failed > 0) {
  console.log('\n❌ Esquema incompleto o proyecto incorrecto.');
  console.log('   1) npm run check:supabase:migrations');
  console.log(
    '   2) Guía: development_guidelines/learnings/SUPABASE_SCHEMA_AND_MIGRATIONS.md',
    '\n   3) Pega y ejecuta las migraciones en Supabase → SQL Editor\n'
  );
  process.exit(1);
}

console.log('\n✅ Esquema mínimo OK para Koraa.\n');
console.log('   Siguiente: npm run dev:clear (si cambiaste .env)\n');
