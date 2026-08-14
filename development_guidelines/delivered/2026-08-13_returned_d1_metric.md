# Métrica norte: returned_d1

**Fecha:** 2026-08-13  
**Estado:** Entregado (cliente + consulta SQL)  
**Relacionado:** [KORAA_ANALYTICS_PHASE_D.md](./KORAA_ANALYTICS_PHASE_D.md)

## Definición

- **Día 0 (cohorte):** calendario local en que la persona completa onboarding (`cohort_day0` / ancla Hoy lite).
- **returned_d1:** abre la app **exactamente al día calendario siguiente** (no día 2+).
- Sin culpa ni racha dura: es medición de producto, no UI de presión.

## Eventos cliente

| Evento | Cuándo |
|--------|--------|
| `onboarding_completed` | Al marcar onboarding (check-in corto o finishOnboarding) |
| `cohort_day0` | Una vez; `local_date`, `source` |
| `returned_d1` | Una vez; `day0`, `local_date`, `expected_d1` |

Código: `lib/retentionD1.ts` · disparo en `AnalyticsScreenTracker`.

## Consulta SQL (histórico / sin evento aún)

Zona: `America/Mexico_City`. Excluye `screen_view` del día 0 para no inflar cohorte solo por un frame.

```sql
with user_days as (
  select
    user_id,
    (created_at at time zone 'America/Mexico_City')::date as local_day
  from app_events
  where event_name <> 'screen_view'
),
first_day as (
  select user_id, min(local_day) as d0
  from user_days
  group by user_id
),
eligible as (
  select * from first_day
  where d0 < (now() at time zone 'America/Mexico_City')::date
),
returned as (
  select e.user_id
  from eligible e
  join user_days u
    on u.user_id = e.user_id
   and u.local_day = e.d0 + 1
  group by e.user_id
)
select
  (select count(*) from eligible) as eligible_d1_cohort,
  (select count(*) from returned) as returned_d1_users,
  round(
    100.0 * (select count(*) from returned)::numeric
      / nullif((select count(*) from eligible), 0),
    1
  ) as returned_d1_pct;
```

### Con eventos explícitos (tras el ship)

```sql
select
  (select count(distinct user_id) from app_events where event_name = 'cohort_day0') as cohort,
  (select count(distinct user_id) from app_events where event_name = 'returned_d1') as returned_d1,
  round(
    100.0 * (select count(distinct user_id) from app_events where event_name = 'returned_d1')::numeric
      / nullif((select count(distinct user_id) from app_events where event_name = 'cohort_day0'), 0),
    1
  ) as returned_d1_pct;
```

## Baseline (2026-08-13)

Consulta histórica (eligible): **30** usuarios · **4** volvieron D1 · **~13.3%**.

Norte de producto: subir D1 con el loop día 1 (check-in → un paso → cita suave), no con más features.
