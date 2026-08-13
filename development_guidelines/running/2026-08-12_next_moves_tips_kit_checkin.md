# Next moves — Consejos / Kit / Check-in (ago 2026)

**Fecha:** 2026-08-12  
**Estado:** running  
**Contexto:** Retención + claridad de valor; inspiración Musa sin copiar síntomas/ciclo.

## Decisions

1. **Consejos** siguen freemium (3/categoría gratis). No son todo Premium.
2. **Kit de calma** se oculta de la superficie (Para mí). Care Mode en Hoy se mantiene. Código del kit no se borra.
   Norte: **Hoy se achica cuando duele.** El Kit no es el producto; es compañía opcional más adelante. Koraa no saca del duelo: quita la presión de producir dentro de él.
3. **Check-in** sigue emoción → energía (capacidad del día). Forma más “un tap” / círculos; no grilla de síntomas.

## Done in this pass

- Tips categoría: lista uniforme (sin hero gigante); label “Para hoy” solo en el primero.
- `TipDetailExpanded` más compacto (cardTitle, emoji 22).
- `EmergencyKitEntryCard` quitado de Para mí.
- `EmotionCard` + Sentir embedded: círculos 3 columnas estilo Musa.
- CTA Premium en consejos más suave (“Hay más cuando quieras”).
- Care Mode guide: CTA principal “Entendido”; Kit solo link opcional si hay sesión previa.
- **Puente Para mí → Hoy:** CTA “Usar esto en Hoy” guarda tip + lo muestra como coach line al abrir Hoy (`patternHoyBridge`).

## Next

- QA en Expo Go (Consejos, Para mí sin kit, check-in, Care Mode, CTA patrón → Hoy).
- Cuando D1 mejore: re-superficie Kit como capa Premium.
- Analytics Kit/Care Mode si vuelve a UI.
- (Opcional) quitar Kit de copy del paywall hasta que vuelva a superficie.
- Medir % días con check-in y ≥1 paso sugerido cerrado (cierre, no productividad bruta).
