# Musa P3 — Yo «Para ti» (historial + patrones Premium)

**Fecha:** 2026-06-04  
**Estado:** Entregado

---

## Resumen

Sección **Para ti** en el tab **Yo**, alineada con Musa «Para mí»:

- **Historial** de check-ins (30 días con Premium; 7 visibles en plan gratis + CTA a paywall).
- **Patrones** con mini-gráficos de energía (sparkline 14 días) y emociones (barras por frecuencia).
- Tarjetas **bloqueadas** para usuarios gratis (overlay + candado → `/paywall`).
- Insights textuales (`generateEmotionalInsights`) solo para suscriptores Premium.
- `PremiumTeaserCard` con copy `premiumTeaser.yoPatternsBody`.

---

## Archivos

| Archivo | Rol |
|---------|-----|
| `app/(tabs)/yo.tsx` | Sección Para ti, carga historial 30 días |
| `components/yo/YoCheckInHistory.tsx` | Lista historial |
| `components/yo/YoPatternCard.tsx` | Tarjeta patrón + lock Premium |
| `components/yo/MiniSparklineChart.tsx` | Gráfico energía |
| `components/yo/MiniEmotionBars.tsx` | Barras emociones |
| `lib/checkInPatterns.ts` | Datos para gráficos |
| `lib/i18n/locales/es.ts`, `en.ts` | Claves `yo.paraMi*`, `yo.pattern*`, `yo.history*` |
| `lib/i18n/locales/features/bundle-ui.*.ts` | `premiumTeaser.yoPatternsBody` |

---

## Criterios

- [x] Historial ordenado por fecha descendente
- [x] Gratis: 7 entradas + enlace Premium para 30 días
- [x] Premium: historial completo + gráficos sin overlay
- [x] Mínimo 3 check-ins para mostrar gráficos (si no, mensaje vacío)
- [x] `npm run typecheck` y `npm run lint` OK

---

**Relacionado:** [2026-06-04_musa_inspired_flow_koraa.md](../planned/2026-06-04_musa_inspired_flow_koraa.md), P2 calendario en `semana.tsx`.
