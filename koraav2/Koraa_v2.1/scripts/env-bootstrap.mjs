#!/usr/bin/env node
/**
 * Si no existe .env, lo crea copiando .env.example.
 * Uso: npm run env:bootstrap
 */
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplePath = join(root, '.env.example');
const envPath = join(root, '.env');

if (fs.existsSync(envPath)) {
  console.log('\n✅ Ya existe .env en la raíz del proyecto.\n');
  console.log('   Edítalo con tu URL y anon key de Supabase (Settings → API).\n');
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.error('\n❌ No se encontró .env.example\n');
  process.exit(1);
}

fs.copyFileSync(examplePath, envPath);
console.log('\n✅ Creado .env desde .env.example\n');
console.log('   1. Abre .env y pega Project URL + anon public de Supabase.');
console.log('   2. Aplica migraciones: npm run check:supabase:migrations');
console.log('   3. Arranca: npm run dev:clear\n');
