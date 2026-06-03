# P1 UX — entregado (2026-05-19)

**Relacionado:** [2026-05-19_ui_ux_design_audit.md](2026-05-19_ui_ux_design_audit.md), P0 flujo tabs + banner Supabase.

## Resumen

| # | Tema | Cambio |
|---|------|--------|
| 3 | Densidad Hoy | «Más para hoy» colapsa meditación, recomendaciones y pill «Agregar tareas» hasta expandir (con check-in) |
| 4 | 6 tabs | `tabBarAccessibilityLabel` con «opcional» en Semana/Consejos; tour paso 4 actualizado |
| 5 | Paywall | Una salida «Seguir gratis» prominente; sin duplicado en onboarding; banner Expo Go visible; fix typo CSS |
| 6 | Premium | Matriz «Gratis vs Premium» en Ayuda; `PremiumTeaserCard` unificado en Semana (`premiumTeaser.semanaBody`) |
| 7 | Onboarding | Botón «Empezar ya» en welcome → `/onboarding/emotion` (salta intro2/intro3) |

## Archivos clave

- `app/(tabs)/index.tsx`, `components/hoy/HoyQuickActions.tsx`
- `components/PaywallScreen.tsx`
- `app/(tabs)/_layout.tsx`, `app/help.tsx`, `app/onboarding/welcome.tsx`
- `components/FlowIndicator.tsx` (hints ≥ meta, sin 10px)
- i18n: `es.ts`, `en.ts`, `bundle*.ts`, `bundle-ui.*.ts`

## P2 pendiente (no incluido)

- Acordeón en Tareas (`vaciar.tsx`)
- Ajustes duplicados Yo/settings
- Variantes de género en copy emocional
