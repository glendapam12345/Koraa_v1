# TestFlight — iOS 1.0.3 (build 30)

**Fecha:** 2026-06-04  
**Motivo:** Apple cerró el tren `1.0.2` (errores 90062 / 90186).  
**Incluye:** fix permisos calendario iOS 17 (build 29) + UX build 28.

---

## Versión

| Campo | Valor |
|-------|--------|
| `expo.version` | `1.0.3` |
| `ios.buildNumber` | `30` |

---

## EAS

```bash
eas build --platform ios --profile production
eas submit --platform ios --id <BUILD_ID> --profile production
```

**No reutilizar** el IPA del build 29 (`1.0.2`) — Apple lo rechazará.

---

## What to Test

```
1.0.3 (30) — Hoy simplificado, racha legible, calendario en tareas.
Regresión: check-in Sentir, paywall, login.
```
