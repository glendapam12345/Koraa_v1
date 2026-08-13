# Consejos redesign — Design System v1

**Fecha:** 2026-07-12  
**Estado:** running  
**Relacionado:** [2026-07-11_koraa_design_system_v1.md](./2026-07-11_koraa_design_system_v1.md)

## Objetivo

Consejos como **un tip a la vez**: hero calmado, categorías mist, grid detrás de progressive disclosure.

## Cambios

- `TipsCategoryCard` / `TipsActionHero`: mist, sin gradiente fuerte
- `TipDetailExpanded`: card mist; badge “Para mí” lavanda suave
- Pantalla `/tips/[category]`: menos chrome; “Más consejos” como link; Premium al final
- Copy más corto (“Uno para ahora”, “Uno basta…”)

## Entrada

El tab Consejos redirige a Hoy; el flujo real es Para mí → categoría o tip destacado.

## Verificar

- [ ] Abrir categoría desde Para mí → un tip hero
- [ ] “Más consejos” revela grid
- [ ] Cards de categoría sin gradiente chillón
- [ ] Free: hint Premium al final, no arriba
