# TestFlight — iOS build 27 (calendario nativo)

**Fecha:** 2026-05-19  
**Auditoría:** paso 3 — `expo-calendar`  
**Versión app:** `1.0.2`  
**Build iOS:** `27`  
**Relacionado:** [2026-05-19_testflight_build_26.md](2026-05-19_testflight_build_26.md)

---

## Qué resuelve este build

| Problema (build 26) | Solución (build 27) |
|---------------------|---------------------|
| Botón «Calendario» sin módulo nativo | Plugin `expo-calendar` enlazado en binario EAS |
| Crash posible con OTA + JS nuevo | `isDeviceCalendarNativeLinked()` + import dinámico |
| Permiso iOS | `NSCalendarsUsageDescription` vía plugin en `app.config.js` |

**Funcionalidad:** agregar tareas con `scheduled_date` al Calendario del iPhone (evento día completo).

**Dónde aparece:**
- Tarjeta de tarea (Hoy, Semana, etc.) — chip «Calendario»
- Tareas → fecha opcional — «Agregar al Calendario del iPhone»

---

## Pre-flight

```bash
npm run typecheck
npm run test:unit
npm run check:calendar
npm run verify:local
```

`check:calendar` exige `ios.buildNumber >= 27` y plugin en `app.config.js`.

---

## EAS

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

---

## What to Test (TestFlight)

```
Build 27 — Calendario del iPhone

1. Tareas → nueva tarea → Organizar → elegir fecha → «Agregar al Calendario del iPhone».
2. Aceptar permiso de Calendarios → abrir app Calendario de iOS y ver evento día completo.
3. En Hoy, tarea con fecha → tocar «Calendario» en la tarjeta.
4. Segundo intento en la misma tarea → mensaje «Ya en tu Calendario».
5. (Opcional) Idioma English → mismos textos en EN.
```

---

## Notas

- **Expo Go:** funciona si el SDK de Expo Go incluye `expo-calendar` (SDK 54).
- **Build 26 + EAS Update:** el JS nuevo **no** añade calendario nativo; el botón permanece oculto (`isDeviceCalendarSupported()` false).
- **Notas del evento:** i18n `deviceCalendar.eventNotes`.
