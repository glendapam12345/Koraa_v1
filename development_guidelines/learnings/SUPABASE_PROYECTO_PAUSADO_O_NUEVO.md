# Proyecto Supabase inactivo / pausado / después de un reset

**Síntoma:** La app no conecta (`Network request failed`). En el dashboard el proyecto aparece **pausado**, **inactivo** o lo **reiniciaste** y la base quedó vacía.

## Opción 1 — Reactivar el mismo proyecto (si Supabase lo permite)

1. Entra en [supabase.com/dashboard](https://supabase.com/dashboard).
2. Abre **Koraa_v1-1** (o el proyecto que uses).
3. Si ves **“Restore project”**, **“Resume”** o **“Unpause”**, haz clic y espera unos minutos hasta que el estado sea **Active / Healthy**.
4. **Project Settings → API**: copia de nuevo **Project URL** y **anon public** al `.env`.
5. En la Mac: `npm run check:supabase` → debe dar OK; luego `npx expo start -c`.

En el plan **Free**, los proyectos sin actividad se **pausan**; al restaurarlos vuelve la misma URL y mismas keys (salvo que las hayas rotado).

---

## Opción 2 — Crear un proyecto NUEVO (si no puedes reactivar o quieres empezar limpio)

1. Dashboard → **New project** (nombre, contraseña DB, región).
2. Espera a que termine el aprovisionamiento (**Active**).
3. **Settings → API**: copia **Project URL** y **anon public**.
4. En tu repo, edita **`.env`**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://TU_NUEVO_REF.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. **SQL Editor** en el nuevo proyecto: ejecuta **todas** las migraciones **en este orden** (pega cada archivo completo, Run):

| Orden | Archivo |
|------|---------|
| 1 | `20250115000000_add_user_preferences.sql` |
| 2 | `20260104210311_create_kora_schema.sql` |
| 3 | `20260105014505_remove_unused_indexes.sql` |
| 4 | `20260210000228_add_subtasks_support.sql` |
| 5 | `20260210021340_fix_security_issues.sql` |
| 6 | `20260210054730_fix_foreign_key_indexes.sql` |
| 7 | `20260211044047_remove_unused_indexes_security_fix.sql` |
| 8 | `20260211212219_add_foreign_key_indexes.sql` |
| 9 | `20260211215310_add_meditations_table.sql` |
| 10 | `20260211223550_add_user_preferences_to_profiles.sql` |
| 11 | `20260212000000_add_projects_and_weekly_scheduling.sql` |

Ruta local: `supabase/migrations/`

6. **Auth:** en el nuevo proyecto, en **Authentication → Providers**, deja **Email** habilitado como en el anterior.
7. `npm run check:supabase` y `npx expo start -c`.
8. **Usuarios:** en un proyecto nuevo no existen cuentas antiguas; hay que **registrarse de nuevo** en la app (o invitar usuarios manualmente en Auth).

---

## Si “habíamos hecho reset”

- **Reset de la base (SQL / truncate):** la app sigue usando el mismo proyecto; solo faltan datos. Reactiva el proyecto si está pausado; si borraste tablas, vuelve a ejecutar las migraciones que fallen o restaura backup.
- **Proyecto borrado / nuevo:** sigue **Opción 2** y el orden de migraciones de arriba.

**Fecha:** marzo 2026
