# Supabase: URL equivocada y esquema desactualizado

**Fecha:** 2026-05-19  
**Auditoría:** paso 2  
**Relacionado:** `SUPABASE_SCHEMA_AND_MIGRATIONS.md`, `NETWORK_REQUEST_FAILED.md`

## Problema

- En dev, `.env` (`EXPO_PUBLIC_*`) y `app.config.js` `extra` podían apuntar a **proyectos distintos** → datos “vacíos” o errores confusos.
- Migraciones no aplicadas (`project_id`, `scheduled_date`, `parent_task_id`, tablas `projects`) generaban fallos en Semana/Tareas sin mensaje claro.
- No había comprobación local rápida antes de TestFlight.

## Solución

| Capa | Archivo | Qué hace |
|------|---------|----------|
| Config única | `lib/supabaseConfig.ts` | Prioridad: `.env` → `extra`; `getSupabaseConfigMismatch()` en `__DEV__` |
| Cliente | `lib/supabase.ts` | Usa `resolveSupabaseConfig`; `isSupabaseConfigured` es **boolean** (no función) |
| Esquema | `lib/supabaseSchemaHealth.ts` | Probes PostgREST por tabla/columna |
| UI | `hooks/useSupabaseHealth.ts`, `components/SupabaseHealthBanner.tsx` | Banner en tabs si falta config, red, mismatch o esquema |
| CLI | `scripts/check-supabase-schema.mjs` | `npm run check:supabase:schema` |

## Comandos

```bash
npm run check:supabase          # DNS + /auth/v1/health
npm run check:supabase:schema   # tablas/columnas mínimas + aviso .env vs extra
npm run verify:local            # incluye schema + migraciones
npm run dev:clear               # tras cambiar .env
```

## Notas para dev

- Si cambias `.env`, reinicia Metro con caché limpia (`dev:clear`).
- En TestFlight, solo cuenta lo embebido en build (`extra`); alinear EAS secrets con el proyecto correcto.
- `isSupabaseConfigured` sin paréntesis en hooks; para función usar `isSupabaseConfiguredFromConfig()`.
