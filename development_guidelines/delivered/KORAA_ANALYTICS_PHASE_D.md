# Medición de producto (Fase D)

**Fecha:** 2026-03-27  
**Estado:** Entregado en código + migración SQL

## Qué incluye

- Tabla **`app_events`** (Supabase): `user_id`, `event_name`, `properties` (jsonb, sin PII), `platform`, `created_at`. RLS: cada usuario inserta y lee solo sus filas.
- Cliente: **`lib/analytics.ts`** — `track(name, props?)` y `trackScreen(path)` (vía `screen_view`).
- **`AnalyticsScreenTracker`** en el layout raíz: envía `screen_view` al cambiar la ruta (solo si hay sesión).
- Eventos explícitos:
  - `auth_sign_in`, `auth_sign_out`
  - `auth_sign_up` (solo si el registro devuelve sesión inmediata; si pide confirmar email, no hay fila hasta que inicie sesión)
  - `check_in_completed` (`source`, `offline`)
  - `task_created` (`priority`, `has_project`, `has_date`, `has_subtasks`, opcional `offline`)

## Cómo activar en el proyecto Supabase

1. Ejecuta la migración `supabase/migrations/20260327120000_app_events.sql` en el SQL Editor (o `supabase db push` si usas CLI).
2. Reinicia Metro tras cambiar `.env`.

## Desactivar envíos

En `.env`: `EXPO_PUBLIC_ANALYTICS_ENABLED=false`

## Consultas útiles

En Supabase → Table Editor → `app_events`, o SQL:

```sql
select event_name, count(*) from app_events group by 1 order by 2 desc;
```

No guardar texto de tareas ni email en `properties`.
