# TestFlight — iOS build 26

**Fecha:** 2026-05-19  
**Estado:** Listo para EAS build (config actualizada en repo)  
**Versión app:** `1.0.2` (`expo.version` en `app.config.js`)  
**Build iOS:** `26` (`ios.buildNumber`)  
**Commit base:** `a63e241` y posteriores en `main`  
**Relacionado:** [koraa_ux_flow_audit.md](koraa_ux_flow_audit.md), refactor `components/hoy/`

---

## Qué incluye este binario (desde build 25)

| Área | Cambio |
|------|--------|
| **Hoy** | Progreso de focos, toasts, confetti, explicación del orden, recheck rápido, refactor en `components/hoy/` |
| **Sentir** | Reorganizar rápido si ya hay check-in hoy |
| **Tareas** | Captura rápida (foco + «Más opciones» colapsado) |
| **Boot** | `AppLoadingGate`, reintento si falla perfil |
| **Semana** | Barra de focos + copy free 3 días |
| **Dev** | `npm run dev:cf` para Expo Go en iPhone (no va en el binario Store) |

**Importante:** TestFlight **no** carga JS desde Metro. Todo lo anterior requiere este build (o Expo Go con `main` actual).

---

## Pre-flight (antes de `eas build`)

En la raíz del repo:

```bash
npm install
npm run typecheck
npm run test:unit
npx expo-doctor
```

**Secrets EAS (perfil `production`):** deben existir en el proyecto EAS (no solo en `.env` local):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`

Ver `app.config.js` (`requireForRelease` en perfil production).

---

## Comandos EAS

### 1. Build iOS (App Store / TestFlight)

```bash
eas build --platform ios --profile production
```

Esperar a que termine en [expo.dev](https://expo.dev) → proyecto `koraav1-1`.

### 2. Subir a App Store Connect (opcional si el build no auto-submit)

```bash
eas submit --platform ios --profile production --latest
```

O subir el `.ipa` desde el dashboard de EAS.

### 3. TestFlight en App Store Connect

1. App **Koraa** → **TestFlight** → build **1.0.2 (26)**.
2. Completar export compliance si Apple lo pide (`ITSAppUsesNonExemptEncryption: false` ya en `infoPlist`).
3. Añadir testers internos / externos y **What to Test** (notas abajo).

---

## Notas para testers («What to Test»)

Copiar/adaptar en App Store Connect:

```
Build 26 — UX Hoy y flujo del día

1. Login → completar onboarding si es cuenta nueva.
2. Tareas: captura rápida (texto + foco opcional) y guardar.
3. Sentir: check-in del día; si ya hay check-in, probar «Reorganizar rápido».
4. Hoy: ver lista priorizada, filtros Hoy/Todas, completar una tarea (toast/confetti).
5. Hoy: «¿Cambió tu día?» (si aparece), «Aligerar carga», editar tarea desde menú.
6. Ayuda desde icono en Hoy o Sentir.
7. (Opcional) Ajustes → Idioma → English y repetir pasos 2–4.

Reportar crashes al abrir la app o al completar tareas.
```

---

## Checklist de validación en dispositivo (TestFlight)

- [ ] La app abre sin crash (splash → tabs o auth).
- [ ] Hoy carga tareas y hero de check-in (o banner «¿Cómo te sientes?»).
- [ ] Editar tarea abre modal y guarda.
- [ ] Completar foco muestra feedback (toast / animación).
- [ ] Sentir → recheck rápido actualiza prioridades en Hoy.
- [ ] Meditación mañana/noche abre y cierra sin crash.
- [ ] Redistribuir carga (si hay tareas + check-in) aplica y muestra toast.

---

## Si algo falla en build

| Síntoma | Acción |
|---------|--------|
| `Missing required env var for release` | Añadir secret en EAS → Environment **production** |
| Build rechazado por número duplicado | Subir `ios.buildNumber` en `app.config.js` (solo enteros ascendentes) |
| App crashea al abrir en TestFlight | Revisar [testflight_crash_fix_missing_env_vars.md](../learnings/testflight_crash_fix_missing_env_vars.md) y logs de crash en App Store Connect |

---

## Referencia de versión

| Campo | Valor |
|-------|--------|
| `expo.version` | `1.0.2` |
| `ios.buildNumber` | `26` |
| `ios.bundleIdentifier` | `com.impermanencecasaartisitca.koraav1` |
| EAS `ascAppId` | `6762663394` (`eas.json`) |

Tras publicar build 26, actualizar la fila de build en `APP_STORE_CONNECT_AND_REVENUECAT_CONFIGURATION.md` si se usa como referencia interna.
