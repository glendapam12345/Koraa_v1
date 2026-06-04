# TestFlight — tren de versión cerrado (90062 / 90186)

**Fecha:** 2026-06-04

## Errores Apple

| Código | Significado |
|--------|-------------|
| **90062** | `CFBundleShortVersionString` debe ser **mayor** que la versión ya aprobada en App Store |
| **90186** | El tren de pre-release (p. ej. `1.0.2`) está **cerrado** — no acepta más builds |

## Causa

`expo.version` **1.0.2** ya fue **aprobada** o enviada a revisión de App Store. Apple no permite subir más IPAs con la misma versión de marketing; solo un **`buildNumber`** nuevo no basta.

## Fix

1. Subir **`expo.version`** → `1.0.3` (o `1.1.0` si es release mayor).
2. Subir **`ios.buildNumber`** → entero nuevo (p. ej. `30`).
3. **Nuevo** `eas build` — no reutilizar IPA de builds anteriores con `1.0.2`.
4. `eas submit --platform ios --id <BUILD_ID> --profile production`

## Relacionado

- Permisos calendario iOS 17: incluidos desde build 29 en código; el primer submit válido en tren nuevo es **1.0.3 (30)**.
- Guía release: [2026-06-04_testflight_build_30_v103.md](../delivered/2026-06-04_testflight_build_30_v103.md)
