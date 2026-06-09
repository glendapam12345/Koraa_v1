# Onboarding, auth gate y protección de tabs

**Entrega:** Gate con `profiles.onboarding_completed`, tabs solo con sesión + onboarding hecho, auth guard para sesiones activas.  
**Última actualización:** 2026-06-05  
**Relacionado:** [2026-06-05_flow_audit_buttons_cleanup.md](./2026-06-05_flow_audit_buttons_cleanup.md)

---

## Comportamiento post-login

```text
Login/Signup → / (index) → resolvePostAuthGate()
  ├─ onboarding_completed = false → /onboarding/welcome
  └─ true → /(tabs) Hoy
```

**Doble gate (redundante pero seguro):**

- `app/index.tsx` — primera resolución tras boot
- `app/(tabs)/_layout.tsx` — protege tabs si alguien navega directo

---

## Marcar onboarding completo

| Camino | Marca `onboarding_completed` | Guarda check-in |
|--------|------------------------------|-----------------|
| Skip (welcome / intro) | ✅ | ❌ |
| intro2 → 3 → how-it-works | ✅ | ❌ |
| Quick start → emotion → focus | ✅ | ✅ |
| **Cualquier check-in guardado** | ✅ (automático) | ✅ |

Desde 2026-06-05, `saveDailyCheckInAndPrioritize` en `lib/checkInService.ts` llama `markOnboardingCompleted()` — evita loop si el usuario hace check-in en Hoy sin pasar por welcome.

---

## Auth guard (sesión activa)

`app/auth/_layout.tsx`:

- Si `user` existe y no está `loading` → `router.replace('/')`
- Muestra `AppLoadingGate` mientras carga o redirige
- Aplica a login, signup, forgot-password

---

## Protección de tabs

`app/(tabs)/_layout.tsx`:

- Sin usuario → `/auth/login`
- Usuario + onboarding incompleto → `/onboarding/welcome`
- Usuario + onboarding OK → tabs visibles + tour primera sesión si aplica

---

## Primera sesión

1. `FirstSessionTourModal` — 4 pasos alineados a tabs visibles (Hoy → Calendario → Para mí → Tu espacio)
2. Al terminar u omitir → `/(tabs)` Hoy (ya no redirige a vaciar)
3. `shouldLandOnTasksFirst` ya no fuerza landing en vaciar

---

## Paywall con retorno

`lib/paywallNavigation.ts`:

```typescript
openPaywall(router, '/settings')  // vuelve a Ajustes al cerrar
```

Usado desde Yo, Settings, Para mí, Calendario, tips por categoría.

---

## SQL en Supabase

Migración `20260327150000_backfill_onboarding_completed.sql`: marca onboarding completado en perfiles existentes; registros nuevos siguen con `false` (trigger).

---

## Archivos clave

| Área | Archivo |
|------|---------|
| Gate | `lib/onboardingGate.ts` |
| Check-in + onboarding | `lib/checkInService.ts` |
| Boot | `app/index.tsx` |
| Tabs | `app/(tabs)/_layout.tsx` |
| Auth guard | `app/auth/_layout.tsx` |
| Tour | `components/onboarding/FirstSessionTourModal.tsx`, `lib/firstSessionTour.ts` |
| Paywall | `lib/paywallNavigation.ts` |
