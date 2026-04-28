#!/usr/bin/env node
/**
 * Verifica que EXPO_PUBLIC_SUPABASE_URL exista en DNS y que /auth/v1/health responda.
 * Uso: npm run check:supabase
 */
import fs from 'fs';
import dns from 'dns/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

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

if (!fs.existsSync(envPath)) {
  console.error('\n❌ No existe .env en la raíz del proyecto.\n');
  console.error('   Copia .env.example → .env y rellena con Supabase → Settings → API.\n');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
const urlStr = env.EXPO_PUBLIC_SUPABASE_URL;
const anon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!urlStr || !anon) {
  console.error('\n❌ Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en .env\n');
  console.error('   Crea .env: npm run env:bootstrap  (o cp .env.example .env)\n');
  process.exit(1);
}

if (!anon.startsWith('eyJ')) {
  console.warn(
    '\n⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY no parece un JWT (suele empezar por eyJ).',
    '\n   Asegúrate de copiar la clave **anon public**, no la service_role.\n'
  );
}

let host;
try {
  host = new URL(urlStr).hostname;
} catch {
  console.error('\n❌ EXPO_PUBLIC_SUPABASE_URL no es una URL válida:', urlStr, '\n');
  process.exit(1);
}

console.log('\n🔍 Comprobando Supabase…');
console.log('   Host:', host);

try {
  await dns.lookup(host);
  console.log('   DNS: ✅ el dominio existe\n');
} catch (e) {
  console.error('\n❌ DNS: este proyecto NO existe en internet (NXDOMAIN).');
  console.error('   Eso provoca "Network request failed" en la app.\n');
  console.error('   Qué hacer:');
  console.error('   1. Entra en https://supabase.com/dashboard');
  console.error('   2. Abre tu proyecto (o crea uno nuevo).');
  console.error('   3. Settings (⚙️) → API');
  console.error('   4. Copia "Project URL" y "anon public" al archivo .env');
  console.error('   5. Guarda y ejecuta: npx expo start -c\n');
  process.exit(1);
}

const health = new URL('/auth/v1/health', urlStr.replace(/\/$/, ''));
await new Promise((resolve, reject) => {
  const req = https.request(
    health,
    {
      method: 'GET',
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      timeout: 12000,
    },
    (res) => {
      res.resume();
      console.log('   API health:', res.statusCode, '(esperado 200)');
      if (res.statusCode === 200) {
        console.log('\n✅ Supabase responde bien.\n');
        console.log('   Siguiente (si aún no lo hiciste):');
        console.log('   2) Migraciones → npm run check:supabase:migrations');
        console.log(
          '      Guía: development_guidelines/learnings/SUPABASE_SCHEMA_AND_MIGRATIONS.md'
        );
        console.log('   3) Tras cambiar .env → npm run dev:clear\n');
      } else {
        console.log('\n⚠️ Respuesta inusual. Revisa que la anon key sea del mismo proyecto que la URL.\n');
      }
      resolve();
    }
  );
  req.on('error', (err) => {
    console.error('\n❌ No se pudo conectar por HTTPS:', err.message);
    console.error('   Revisa firewall / red en esta Mac.\n');
    reject(err);
  });
  req.on('timeout', () => {
    req.destroy();
    reject(new Error('timeout'));
  });
  req.end();
}).catch(() => process.exit(1));
