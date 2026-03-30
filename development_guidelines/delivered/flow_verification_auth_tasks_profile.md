# Verificación de flujos (auth, tareas, perfil)

**Fecha:** 2026-03-21  
**Estado:** Revisión estática + corrección de `/auth` (no cerrar sesión al entrar con usuario ya logueado).

## Comprobaciones automáticas

- `npm run typecheck` — OK  
- `npm run lint` — OK  
- `npx expo-doctor` — la config vive solo en `app.config.js` (sin `app.json` duplicado). `extra` / Supabase puede venir de variables de entorno al arrancar Metro.

## Flujos revisados en código

| Flujo | Comportamiento esperado | Notas |
|--------|-------------------------|--------|
| **Arranque** | `app/index.tsx`: si hay `user` → `/(tabs)`; si no → `/auth`. Timeout 10s → `/auth`. | Coherente. |
| **Auth** | Login/registro; éxito → `/(tabs)` u onboarding según modo. **Si ya hay sesión al abrir `/auth`**, redirige a `/(tabs)` (no hace `signOut`). | Corregido 2026-03-21. |
| **Deep link / hash** | `_layout.tsx`: `#access_token` + `refresh_token` → `setSession` → tabs o `reset-password`. | Web + nativo. |
| **Perfil / recomendaciones** | `fetchProfilePreferences`: si faltan columnas `age`, etc. (42703) → valores por defecto sin crash. | Ejecutar SQL `20260321140000_...` en Supabase para persistir datos. |
| **Tareas** | `useTasks`: si falta `parent_task_id` (42703) → carga todas las tareas sin subtareas. | Ejecutar SQL `20260321150000_...` en Supabase para subtareas. |
| **Registro** | Trigger `handle_new_user` + fila en `profiles` (migración `20260321120000_...`). | Ejecutar SQL en Supabase si el INSERT de perfil fallaba antes. |

## Prueba manual recomendada

1. **Sin cuenta:** abrir app → `/auth` → registrar → debe entrar (según Supabase: confirm email on/off).  
2. **Con cuenta:** cerrar sesión en Yo → `/auth` → login → `/(tabs)`.  
3. **Sesión activa:** con app abierta y logueado, ir a `/auth` (si el router lo permite) → debe mandarte a tabs **sin** perder sesión.  
4. **Tareas:** pestaña Inicio carga lista; si la BD está al día, subtareas y proyectos funcionan según pantallas que los usan.

## Migraciones SQL a aplicar en Supabase (remoto)

Ejecutar en **SQL Editor** el contenido de estos archivos si aún no están aplicadas:

1. `supabase/migrations/20260321120000_profiles_trigger_on_signup.sql`  
2. `supabase/migrations/20260321140000_ensure_profiles_personalization_columns.sql`  
3. `supabase/migrations/20260321150000_ensure_tasks_parent_task_id.sql`  
4. (Opcional) `20260212000000_add_projects_and_weekly_scheduling.sql` si usas proyectos/semana con columnas en `tasks`.

**Nota:** La app sigue funcionando con fallbacks si faltan columnas, pero la experiencia completa (subtareas, preferencias, proyectos) requiere el esquema actualizado.
