# Calendario redesign — Design System v1

**Fecha:** 2026-07-11 (actualizado 2026-07-13)  
**Estado:** running  
**Relacionado:** [2026-07-11_koraa_design_system_v1.md](./2026-07-11_koraa_design_system_v1.md)

## Objetivo

Calendario limpio: **mes + un día**. Sin cinta semanal duplicada.

## Cambios

- Vista por defecto: **Calendario**
- Header: `Calendario` + “Elige un día…”
- Nav de **mes** + grid mensual (única forma de elegir fechas en vista calendario)
- Quitada la cinta semanal / prev-next de semana (redundante con el mes)
- `SemanaDaySection` — detalle del día seleccionado
- Brief semanal oculto; segmented Calendario / Lista

## Verificar en dispositivo

- [ ] Calendario → mes + detalle del día (sin strip de 7 días)
- [ ] Tocar un día en el mes actualiza la sección
- [ ] Prev/next de mes cambia grid y día seleccionado juntos
- [ ] Plan gratis: días bloqueados abren paywall
- [ ] Lista sigue disponible en el segmented control
