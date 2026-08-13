# Yo redesign — Design System v1

**Fecha:** 2026-07-12 (actualizado 2026-07-13)  
**Estado:** running  
**Relacionado:** [2026-07-11_koraa_design_system_v1.md](./2026-07-11_koraa_design_system_v1.md)

## Objetivo

**Tu espacio** con presencia clara (inspiración estructural tipo perfil Musa): hero visual + 1 CTA + lista que se entiende de un vistazo — en lenguaje calmado Koraa (mist, no dark).

## Cambios

- Header: `Tu espacio` + “Tu rincón en Koraa”
- **Hero:** `YoSpaceHero` — aura + avatar + nombre + “Ver mi perfil”
- **CTA:** `YoPrimaryActionRow` — Premium (free) o frentes/proyectos (Premium)
- **Lista:** proyectos/suscripción, ajustes, cómo funciona, invitar, soporte, privacidad, ayuda, cerrar sesión
- Footer: solo versión
- Sin copiar estética oscura de otras apps

## Verificar en dispositivo

- [ ] Hero grande; “Ver mi perfil” abre editar
- [ ] Free: CTA Premium destacado; lista incluye proyectos
- [ ] Premium: CTA proyectos; lista incluye suscripción
- [ ] Ayuda abre `/help`; cerrar sesión confirma
- [ ] Deep link `?editProfile=1` sigue abriendo el modal
