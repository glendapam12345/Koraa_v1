# Onboarding obligatorio y protección de tabs

**Entrega:** Gate con `profiles.onboarding_completed`, tabs solo con sesión + onboarding hecho, propagación `from=quick`, cierre de sesión → `/auth`.

## Comportamiento

- **`lib/onboardingGate.ts`**: `getPostAuthRoute`, `markOnboardingCompleted`.
- **`app/index.tsx`** y **`app/auth.tsx`**: tras sesión o login, `welcome` si `onboarding_completed !== true`, si no `/(tabs)`.
- **`app/onboarding/how-it-works.tsx`**: al continuar, actualiza perfil y navega a `/auth`.
- **`app/(tabs)/_layout.tsx`**: sin usuario → `/auth`; con usuario y onboarding incompleto → `/onboarding/welcome`.
- **Migración** `20260327150000_backfill_onboarding_completed.sql`: una vez en Supabase, marca onboarding completado en perfiles existentes; los **nuevos** registros siguen con `false` (trigger).

## SQL en Supabase

Ejecutar también la migración de backfill tras desplegar la app, para no mandar a intro a cuentas antiguas.
