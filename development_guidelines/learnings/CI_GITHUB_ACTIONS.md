# CI — GitHub Actions (`verify:all`)

**Fecha:** 2026-06-05  
**Workflow:** `.github/workflows/verify.yml`

## Qué ejecuta

En cada **push a `main`** y en **pull requests**:

```bash
npm run verify:all
```

Equivalente a:

1. `npx expo-doctor`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test` (Jest unificado: unit + hooks)

## Variables en CI

No se usan secretos reales. El workflow define placeholders para Supabase y desactiva analytics:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_ANALYTICS_ENABLED=false`

Los tests mockean Supabase donde hace falta; no se requiere `.env` en el runner.

## Local antes de abrir PR

```bash
npm run verify:all
```

Checks adicionales (schema Supabase, copy CTAs, etc.) siguen en `npm run verify:local` — opcional en máquina de desarrollo, no en CI por ahora.

## Concurrency

Runs duplicados en la misma rama se cancelan (`cancel-in-progress: true`) para ahorrar minutos de Actions.
