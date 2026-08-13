# QA — Design System v1 pass (tabs)

**Fecha:** 2026-07-12  
**Estado:** running  
**Alcance:** Hoy · Tareas · Check-in · Calendario · Para mí · Yo

## Resultado

Sin crashes críticos. Free-plan locking, hero gating en Para mí y progressive disclosure básicos OK.

## Fixes aplicados

| Severidad | Issue | Fix |
|-----------|-------|-----|
| Alta | `MoveTaskToDaySheet` usaba `semana.movePick*` (claves inexistentes) | → `semanaExtra.movePick*` |
| Media | `common.close` inexistente (CareMode / streak) | → `commonExtra.close` |
| Media | Hoy: CTA “Añadir un paso” duplicado + eyebrow duplicado (lite) | CTA solo si hay foco; sin eyebrow externo |
| Media | Calendario: “Ver mes” montaba board denso | Solo grid de mes |
| Media | Yo: Premium CTA + fila Suscripción en “Más” | Suscripción en Más solo si ya es Premium |

## Pendiente manual (dispositivo)

- [ ] Hoy: 1 foco, empty sin doble CTA
- [ ] Calendario: strip → día → mes (sin board extra)
- [ ] Para mí: un hero, patrones/consejos colapsados
- [ ] Yo: un CTA Premium (free)
- [ ] Mover tarea a otro día: copy del calendario OK
