# Esquema Supabase y migraciones (Koraa)

**Propósito:** Evitar errores `42703` (columna inexistente) y fallos de registro por RLS cuando la base remota no tiene el mismo esquema que el repo.

**Checklist rápido (.env + migraciones + reinicio Metro):** [LOCAL_DEV_THREE_STEPS.md](./LOCAL_DEV_THREE_STEPS.md)

## Comprobación rápida de conectividad

```bash
npm run check:supabase
```

Comprueba DNS y `GET /auth/v1/health`. No valida tablas.

## Listar migraciones relevantes (referencia)

```bash
npm run check:supabase:migrations
```

Muestra rutas de SQL que conviene tener aplicadas en **SQL Editor** del proyecto en [supabase.com](https://supabase.com/dashboard) si ves errores de columnas o de perfil.

## Orden recomendado al crear un proyecto nuevo o reparar esquema

### Proyecto nuevo / base de datos vacía

Ejecuta **en este orden** en SQL Editor (lista completa también en `npm run check:supabase:migrations`):

1. `20260104210311_create_kora_schema.sql` — **siempre primero** (crea `profiles`, `tasks`, etc.).
2. `20260105014505_remove_unused_indexes.sql`
3. `20260210000228_add_subtasks_support.sql`
4. `20260210021340_fix_security_issues.sql`
5. `20260210054730_fix_foreign_key_indexes.sql`
6. `20260211044047_remove_unused_indexes_security_fix.sql`
7. `20260211212219_add_foreign_key_indexes.sql`
8. `20260211215310_add_meditations_table.sql`
9. `20260211223550_add_user_preferences_to_profiles.sql`
10. `20260212000000_add_projects_and_weekly_scheduling.sql`
11. `20260321120000_profiles_trigger_on_signup.sql`
12. `20260321140000_ensure_profiles_personalization_columns.sql`
13. `20260321150000_ensure_tasks_parent_task_id.sql`
14. `20250115000000_add_user_preferences.sql` — opcional (solapa con el paso 9; idempotente).

No uses orden alfabético por nombre de archivo: `202501…` iría mal si va antes que `202601…`.

### Solo reparar (ya tienes tablas pero faltan columnas)

1. **Esquema base** — `20260104210311_create_kora_schema.sql` (solo si la BD está vacía).
2. **Subtareas** — `20260210000228_add_subtasks_support.sql` o `20260321150000_ensure_tasks_parent_task_id.sql` (idempotente).
3. **Proyectos / scheduling** — `20260212000000_add_projects_and_weekly_scheduling.sql` (si usas proyectos en la app).
4. **Perfil al signup** — `20260321120000_profiles_trigger_on_signup.sql`.
5. **Columnas de personalización** — `20260321140000_ensure_profiles_personalization_columns.sql`.

Ejecuta cada archivo en **SQL Editor → Run** (o `supabase db push` si usas CLI vinculado al proyecto).

## Auth (desarrollo)

- **Confirm email:** puedes desactivarlo en Authentication → Providers → Email mientras desarrollas.
- **Site URL / Redirect URLs:** para web local con Expo, `http://localhost:8081` y `http://localhost:8081/**`; para Expo Go, `exp://**` o la URL que muestre Metro.

**Fecha:** marzo 2026
