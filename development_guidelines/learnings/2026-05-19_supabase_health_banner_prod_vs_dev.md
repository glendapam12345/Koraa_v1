# Banner Supabase: producción vs desarrollo

**Fecha:** 2026-05-19  
**Relacionado:** P0 auditoría UI/UX, `SupabaseHealthBanner`, `lib/supabaseHealthBannerMode.ts`

## Problema

El banner en tabs mostraba copy técnico (migraciones SQL, `.env`, hosts distintos) en TestFlight, dando sensación de app rota.

## Solución

| Entorno | Qué se muestra |
|---------|----------------|
| **`__DEV__`** | Títulos y cuerpos técnicos + hints de migraciones + Ayuda |
| **Producción / TestFlight** | Solo `unreachable` y `schema_incomplete` con copy **“No pudimos sincronizar”** + Reintentar |
| **Producción** | Oculto: `missing_config`, `config_mismatch` (no accionables por el usuario) |

`connectionDetail` (p. ej. error HTTP) solo aparece en desarrollo.

## Archivos

- `lib/supabaseHealthBannerMode.ts` — `shouldShowSupabaseHealthBanner`, `isSupabaseHealthDevDetail`
- `components/SupabaseHealthBanner.tsx`
- i18n: `supabaseHealth.syncTitle`, `supabaseHealth.syncBody` (ES/EN)

## Tests

`lib/__tests__/supabaseHealthBannerMode.test.ts`
