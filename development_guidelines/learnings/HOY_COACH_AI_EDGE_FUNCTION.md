# Coach de Hoy con IA (Edge Function)

**Fecha:** 2026-05-19  
**Estado:** Implementado en código; requiere despliegue y secretos en Supabase.

## Qué hace

- Pantalla **Hoy** (con check-in): mensaje personalizado (`greeting`, `body`, `actionLine`).
- Por defecto usa reglas locales (`lib/hoyDailyCoach.ts`).
- Si `EXPO_PUBLIC_HOY_COACH_AI_ENABLED=true`, llama a la Edge Function **`hoy-coach`** (OpenAI) con JWT del usuario.
- Cache por día + emoción + energía en AsyncStorage (`lib/hoyCoachAi.ts`).
- Si la IA falla o no está configurada → fallback local sin romper la app.

## Archivos

| Archivo | Rol |
|---------|-----|
| `supabase/functions/hoy-coach/index.ts` | Edge Function (auth + OpenAI) |
| `lib/hoyCoachAi.ts` | Cliente invoke + cache |
| `hooks/useHoyCoachMessage.ts` | Hook en `HoyFocusPanel` |

## Activar en producción / pruebas

### 1. Secretos en Supabase (Dashboard → Project Settings → Edge Functions → Secrets)

```
OPENAI_API_KEY=sk-...
```

Opcional:

```
OPENAI_MODEL=gpt-4o-mini
```

`SUPABASE_URL` y `SUPABASE_ANON_KEY` los inyecta Supabase automáticamente en runtime.

### 2. Desplegar la función

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase functions deploy hoy-coach --no-verify-jwt
```

> Usa `--no-verify-jwt` solo si tu CLI lo exige; la función valida el usuario con `auth.getUser()` del Bearer token.

### 3. Cliente (.env)

```bash
EXPO_PUBLIC_HOY_COACH_AI_ENABLED=true
```

Reinicia Metro: `npm run dev:clear`

### 4. Probar

1. Check-in en Hoy.
2. El banner debe mostrar texto distinto al fallback (más natural).
3. Segunda visita el mismo día → cache (sin nueva llamada OpenAI).

## Costes y privacidad

- Solo se envía: nombre, emoción, energía, sugerencia corta, locale, día de la semana.
- No se envían tareas ni email.
- Una llamada por combinación día/emoción/energía (cache local).

## Desactivar IA

Quita o pon `EXPO_PUBLIC_HOY_COACH_AI_ENABLED=false` → solo reglas locales.

## Koraa Brain (`koraa-brain`) — brief diario unificado

Desde jun 2026, Hoy también puede invocar la Edge Function **`koraa-brain`** (modo `daily_brief`) vía `lib/ai/fetchKoraaDailyBrief.ts`.

| Requisito | Detalle |
|-----------|---------|
| Flag cliente | `EXPO_PUBLIC_HOY_COACH_AI_ENABLED=true` |
| Supabase | `EXPO_PUBLIC_SUPABASE_URL` + anon key configurados |
| Deploy | `npx supabase functions deploy koraa-brain` |
| Secretos | `OPENAI_API_KEY` (igual que hoy-coach) |

Si falta el flag, la función no está desplegada o la red falla → **fallback local** (reglas en `lib/hoyDailyCoach.ts` + priorización). La app no muestra error al usuario; en desarrollo busca logs `[koraa-brain] fallback local` en Metro.

Helper de diagnóstico: `getKoraaBrainClientStatus()` en `lib/ai/isKoraaBrainEnabled.ts`.
