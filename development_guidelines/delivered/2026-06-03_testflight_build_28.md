# TestFlight — iOS build 28 (Hoy más simple + legibilidad)

**Fecha:** 2026-06-03  
**Versión app:** `1.0.2`  
**Build iOS:** `28`  
**Relacionado:** [2026-05-19_testflight_build_27_calendar.md](2026-05-19_testflight_build_27_calendar.md)

---

## Qué incluye respecto al build 27

| Área | Cambio |
|------|--------|
| **Hoy** | Eliminada tarjeta duplicada «Cómo funciona Koraa» (el `FlowIndicator` arriba basta) |
| **Hoy** | Saludo («Good morning» / «Buenos días») a ancho completo; ya no compite con racha e iconos |
| **Hoy** | Número de racha en badge con más espacio (sin recorte) |
| **Yo** | Número grande de racha y etiquetas del gráfico de 14 días legibles (sin recorte) |
| **Yo** | Cabecera «X%» + «N/14 días» con más espacio |

Build 27 sigue siendo la base (calendario nativo, UX P0–P3, banner Supabase, etc.).

---

## Pre-flight

```bash
npm run typecheck
npm run test:unit
npm run check:calendar
npm run verify:local
```

---

## EAS

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

Si el auto-submit falla con *already submitted this version*, usa el `--id` del build concreto:

```bash
eas submit --platform ios --id <BUILD_ID> --profile production
```

---

## What to Test (TestFlight)

```
Build 28 — Hoy más claro

1. Abrir Hoy: saludo completo arriba; NO debe aparecer la tarjeta «How Koraa works» en el scroll.
2. FlowIndicator arriba sigue mostrando Tareas → Sentir → Hoy (tocable).
3. Badge de racha: el número se ve entero (probar con racha ≥ 10 si puedes).
4. Yo → gráfico de 14 días: abreviaturas (Lun, Mié, Sáb…) sin cortar.
5. Regresión: calendario en tareas, paywall, check-in Sentir → priorización Hoy.
```
