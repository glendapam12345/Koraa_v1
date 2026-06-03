# P2 UX — entregado (2026-05-19)

**Relacionado:** [2026-05-19_ui_ux_design_audit.md](2026-05-19_ui_ux_design_audit.md), [2026-05-19_p1_ux_improvements.md](2026-05-19_p1_ux_improvements.md)

## Resumen

| # | Tema | Cambio |
|---|------|--------|
| 8 | Copy inclusivo | Etiquetas de emoción neutras (ES); ejemplos onboarding sin femenino fijo; nota inclusiva en onboarding/emotion |
| 9 | FlowIndicator 10px | Ya resuelto en P1 |
| 10 | Tareas densas | Panel **Organizar (opcional)** colapsado: flow card, proyectos, hints, sugerencias |
| 11 | Ajustes duplicados | Eliminado `PremiumTeaserCard` en Yo; Premium solo vía **Ajustes** |
| 12 | Tabs a11y flujo | Labels dinámicos paso 1–3 cuando no hay check-in (`useHasCheckInToday`) |

## Archivos clave

- `app/(tabs)/vaciar.tsx`, `lib/i18n/locales/features/bundle.es.ts`
- `app/(tabs)/yo.tsx`, `lib/i18n/locales/es.ts`
- `hooks/useHasCheckInToday.ts`, `app/(tabs)/_layout.tsx`
- `app/onboarding/emotion.tsx`

## P3 pendiente

- Contraste `text.tertiary` en bloques largos
- Mensaje meditación Expo Go en UI (si aplica)
