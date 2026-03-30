#!/usr/bin/env node
/**
 * Lista migraciones SQL del repo que suelen aplicarse en Supabase remoto.
 * Uso: npm run check:supabase:migrations
 */
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, 'supabase', 'migrations');

const priorityHints = [
  '20260104210311_create_kora_schema.sql — esquema base (solo si BD vacía)',
  '20260210000228_add_subtasks_support.sql — parent_task_id en tasks',
  '20260212000000_add_projects_and_weekly_scheduling.sql — projects + columnas en tasks',
  '20260321120000_profiles_trigger_on_signup.sql — trigger perfil al registrarse',
  '20260321140000_ensure_profiles_personalization_columns.sql — age, interests, etc.',
  '20260321150000_ensure_tasks_parent_task_id.sql — idempotente subtareas',
];

/** Orden correcto para BD nueva (no uses orden alfabético: 202501… va al final). */
const fullOrderNewProject = [
  '20260104210311_create_kora_schema.sql',
  '20260105014505_remove_unused_indexes.sql',
  '20260210000228_add_subtasks_support.sql',
  '20260210021340_fix_security_issues.sql',
  '20260210054730_fix_foreign_key_indexes.sql',
  '20260211044047_remove_unused_indexes_security_fix.sql',
  '20260211212219_add_foreign_key_indexes.sql',
  '20260211215310_add_meditations_table.sql',
  '20260211223550_add_user_preferences_to_profiles.sql',
  '20260212000000_add_projects_and_weekly_scheduling.sql',
  '20260321120000_profiles_trigger_on_signup.sql',
  '20260321140000_ensure_profiles_personalization_columns.sql',
  '20260321150000_ensure_tasks_parent_task_id.sql',
  '20260328120000_projects_due_date.sql',
  '20250115000000_add_user_preferences.sql',
];

console.log('\n📋 Migraciones SQL en el repo (referencia para Supabase SQL Editor):\n');
console.log('   Carpeta:', migrationsDir);
console.log('');

if (!fs.existsSync(migrationsDir)) {
  console.error('   (No existe supabase/migrations)\n');
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  console.log('   •', f);
}

console.log('\n⭐ Orden sugerido si el proyecto remoto falla por columnas/tablas:\n');
for (const line of priorityHints) {
  console.log('   ', line);
}

console.log('\n🆕 Proyecto nuevo / BD vacía — ejecuta en SQL Editor en ESTE orden (uno por uno):\n');
for (let i = 0; i < fullOrderNewProject.length; i++) {
  const f = fullOrderNewProject[i];
  const path = join(migrationsDir, f);
  if (!fs.existsSync(path)) {
    console.log('   ⚠️  Falta en disco:', f);
    continue;
  }
  console.log(`   ${i + 1}.`, f);
}
console.log(
  '\n   En Supabase: SQL Editor → New query → pega el contenido del archivo → Run.',
  '\n   Si un paso dice "already exists", suele ser seguro en migraciones idempotentes.',
  '\n   El último (202501…) es redundante con 20260211223550; puedes omitirlo si ya corriste ese.'
);

console.log('\n📖 Guía: development_guidelines/learnings/SUPABASE_SCHEMA_AND_MIGRATIONS.md');
console.log('\n   Tras cambiar .env, reinicia Metro: npm run dev:clear\n');
