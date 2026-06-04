# Musa-inspired P0 — check-in visual + hero Hoy

**Fecha:** 2026-06-04  
**Estado:** Entregado

## Entregas

1. **Sentir** — `SentirVisualCheckIn` cuando no hay check-in del día: hero con gradiente, emociones en fila horizontal, slider de energía, guardado con tiempo/foco por defecto (`Medio (2-4hrs)` + `Normal`) o enlace «Ajustar tiempo y enfoque».
2. **Hoy** — `HoyCheckInHero` con un solo CTA «Hacer check-in» si falta check-in.
3. Sin ciclo menstrual (decisión de producto documentada en plan Musa).

## Archivos nuevos

- `components/sentir/SentirVisualCheckIn.tsx`
- `components/sentir/VisualStepSlider.tsx`
- `components/hoy/HoyCheckInHero.tsx`
- `lib/checkInDefaults.ts`

## Probar en Expo Go

```bash
npm run dev
```

1. Sin check-in hoy → pestaña **Sentir**: flujo visual; **Hoy**: hero con CTA.
2. Guardar → navega a Hoy con prioridades y toast/celebración.
3. Con check-in ya hecho → Sentir muestra tarjeta de hoy + rejilla clásica para actualizar.
