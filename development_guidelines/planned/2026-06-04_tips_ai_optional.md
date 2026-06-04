# Consejos con IA (opcional, fase futura)

**Fecha:** 2026-06-04  
**Estado:** Planificado  

## Hoy (sin IA)

- Catálogo local ~30 consejos en 4 categorías (`lib/i18n/locales/tipsCatalog.*.ts`).
- Scoring por emoción y energía (`lib/tipsPersonalization.ts`).
- UI tipo Musa: grid en Consejos → pantalla `/tips/[category]` con grid y detalle al tocar.
- Vista previa en Hoy al elegir emoción (`HoyTipsPeek`).

## IA opcional (cuando quieran)

1. Supabase Edge Function `generate-tips` con OpenAI/Anthropic.
2. Input: `emotion`, `energy`, últimos 7 check-ins (patrones), locale.
3. Output: 3–5 tips `{ title, body, emoji }` cacheados por día/usuario.
4. Variable `EXPO_PUBLIC_TIPS_AI_ENABLED=true` en cliente; fallback al catálogo local si falla.

No requiere IA en el dispositivo; mantiene privacidad y costos controlados.
