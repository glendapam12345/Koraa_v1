# Hoy redesign — Design System v1

**Fecha:** 2026-07-11  
**Estado:** running  
**Relacionado:** [2026-07-11_koraa_design_system_v1.md](./2026-07-11_koraa_design_system_v1.md)

## Objetivo

Aplicar a Hoy la regla **1 hero / 1 CTA / 1 sección de apoyo**, acercada al mock de producto.

## Cambios

- Composición mock: **wordmark → saludo → headline italic** (`HoyScreenHeader`)
- Card de energía con mascota + barra 1–5 + mensaje suave (`HoyFeelHero`)
- **1 foco** visible (`HOY_DEFAULT_FOCUS_LIMIT = 1`, `HoyPrimaryFocusCard`); el resto en “puede esperar”
- Nudge de respiro opcional (`HoyBreathNudge`)
- Copy/espacio calmado; CTA “Añadir un paso”

## Verificar en dispositivo

- [ ] Sin check-in: hero invita a sentir + mascota
- [ ] Con check-in: card de energía + 1 foco grande
- [ ] Con >1 pasos sugeridos: overflow en “puede esperar”
- [ ] Headline “Hoy cuidamos de ti.” / “Let's take care of you today.”
- [ ] Respiro abre el modal corto
- [ ] Día 1 lite sigue usable
