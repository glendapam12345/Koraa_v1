# Unificación del design system

**Fecha:** 2026-05-19  
**Estado:** running — fase tabs completada

## Reglas

1. Un margen horizontal: `THEME.layout.screenPaddingX` vía `CalmScreen`.
2. Tarjetas: `THEME.surfaces.elevated` / `muted` / `panel` / `chip` / `CalmCard`.
3. Títulos de tab: `ScreenHeader` + `typography.screenTitle` / `screenSubtitle`.
4. Secciones: `typography.sectionTitle`.

## Hecho

### Infra
- `constants/theme.ts`: `surfaces.*`, tipografía de pantalla/sección
- `components/ui/ScreenHeader.tsx`
- `lib/screenLayout.ts`
- `CalmScreen` en Hoy, Semana, Vaciar, Sentir, Tips, Para mí, Yo

### Tabs pulidas (excepto Hoy ya trabajado)
- **Semana:** `ScreenHeader`, chips/listas con `surfaces`
- **Vaciar:** `ScreenHeader`, inputs/toggles/paneles unificados
- **Tips:** `ScreenHeader`, tarjetas y paneles `surfaces`, `TipGridCard`
- **Para mí:** `sectionTitle` token
- **Yo:** inputs modal, badge racha, `sectionTitle` en modal

### Onboarding decorativo
- **`OnboardingHighlightCard`**: tarjeta destacada con `surfaces.tinted` (reemplaza gradientes decorativos en `intro3`, `how-it-works`)
- CTAs: `CalmPrimaryButton` en todo onboarding/auth; **`GradientButton` eliminado**

## Pendiente

- Auditoría `TaskCard` y chips en Semana list view
- ~~CI con `verify:all`~~ → ver `development_guidelines/learnings/CI_GITHUB_ACTIONS.md`
