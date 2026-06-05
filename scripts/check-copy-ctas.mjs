#!/usr/bin/env node
/**
 * Valida CTAs de la app v1-1 contra la guía de microcopy.
 * Uso: npm run check:copy
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const TARGET_DIRS = [path.join(root, 'app'), path.join(root, 'components')];
const ALLOWED_CTAS = new Set([
  'Continuar',
  'Comenzar',
  'Guardar',
  'Guardar tarea',
  'Ver prioridades',
  'Ver Premium',
  'Elegir este plan',
  'Seguir con versión gratis',
  'Restaurar compras',
  'Ir a Sentir',
  'Ir a Tareas',
  'Iniciar sesión',
  // Contextuales permitidos
  'Crear cuenta',
  'Enviar código',
  'Verificar',
  'Entendido',
  'Reintentar',
  'Mostrar todo ahora',
  'Vacía tu mente',
]);

const IGNORE_DIR_PARTS = new Set(['node_modules', '.git', 'koraav2', 'dist', '.expo']);
const CTA_PATTERNS = [
  { name: 'CalmPrimaryButton.label', re: /<CalmPrimaryButton[\s\S]*?\blabel="([^"]+)"/g },
  { name: 'primaryCta.label', re: /primaryCta\([^,]+,\s*'([^']+)'/g },
  { name: 'ctaText', re: /<Text\s+style=\{styles\.ctaText\}>([^<]+)</g },
  { name: 'buttonText', re: /<Text\s+style=\{styles\.buttonText\}>([^<]+)</g },
  { name: 'btnText', re: /<Text\s+style=\{styles\.[A-Za-z0-9_]*BtnText\}>([^<]+)</g },
];

function shouldIgnorePath(absPath) {
  return absPath
    .split(path.sep)
    .some((part) => IGNORE_DIR_PARTS.has(part));
}

function walkTsxFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (shouldIgnorePath(abs)) continue;
    if (entry.isDirectory()) {
      walkTsxFiles(abs, out);
      continue;
    }
    if (entry.isFile() && abs.endsWith('.tsx')) out.push(abs);
  }
  return out;
}

function collectCtasFromFile(absPath) {
  const rel = path.relative(root, absPath);
  const text = fs.readFileSync(absPath, 'utf8');
  const found = [];
  for (const pattern of CTA_PATTERNS) {
    for (const match of text.matchAll(pattern.re)) {
      const raw = match[1]?.trim();
      if (!raw) continue;
      // Ignora CTAs dinámicos (templates/expresiones) para evitar falsos positivos.
      if (raw.includes('{') || raw.includes('}') || raw.includes('${')) continue;
      found.push({ value: raw, source: pattern.name, file: rel });
    }
  }
  return found;
}

const files = TARGET_DIRS.flatMap((d) => walkTsxFiles(d));
const all = files.flatMap((f) => collectCtasFromFile(f));
const disallowed = all.filter((c) => !ALLOWED_CTAS.has(c.value));

if (disallowed.length === 0) {
  console.log('✅ check:copy: todos los CTAs detectados están permitidos.');
  process.exit(0);
}

console.error('\n❌ check:copy: se detectaron CTAs fuera de la lista permitida:\n');
for (const item of disallowed) {
  console.error(`- "${item.value}"  (${item.source})  en ${item.file}`);
}

console.error('\nPermitidos:\n' + Array.from(ALLOWED_CTAS).sort().map((v) => `- ${v}`).join('\n'));
process.exit(1);
