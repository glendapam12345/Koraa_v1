# Check-in redesign — Design System v1

**Fecha:** 2026-07-11  
**Estado:** running  
**Relacionado:** [2026-07-11_koraa_design_system_v1.md](./2026-07-11_koraa_design_system_v1.md)

## Objetivo

Check-in como el mock: **una pregunta**, escala 1–5 con caras, CTA Continuar.  
Tiempo/mente en progressive disclosure.

## Cambios

- `FeelingEnergyScale` — escala horizontal 1–5 con emoji + palabra
- `QuickRecheckInModal` — hero calm, escala, emoción en chips, nota opcional (no persistida), advanced colapsado
- Onboarding `energy` usa la misma escala
- `VisualStepSlider` / Sentir hero sin gradient pesado

## Verificar

- [ ] Desde Hoy → Actualizar cómo me siento → modal mock
- [ ] Continuar guarda y vuelve a Hoy con card de energía
- [ ] Onboarding energy: tocar cara avanza
- [ ] Tiempo/mente siguen opcionales detrás del toggle
