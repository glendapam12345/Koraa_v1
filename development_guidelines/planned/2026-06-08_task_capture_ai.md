# Captura inteligente de tareas (IA + voz)

**Fecha:** 2026-06-08  
**Estado:** Boceto en código (MVP texto + preview)  
**Relacionado:** `task-capture-ai`, `lib/taskCaptureAi.ts`, `TaskCaptureAiPreview`

## Qué hace el boceto

1. **Tareas → escribir** → botón **«Koraa, entiéndelo»**
2. Parser local (siempre) o OpenAI vía Edge Function `task-capture-ai`
3. **Vista previa** antes de guardar: título, fechas, pasos de preparación sugeridos
4. **Guardar así** → crea varias tareas sueltas con `scheduled_date` repartido
5. **Solo rellenar** → aplica título/fecha al formulario manual

## Activar IA (igual que coach Hoy)

```bash
# Supabase secrets (ya usado por hoy-coach)
OPENAI_API_KEY=sk-...

npx supabase functions deploy task-capture-ai --no-verify-jwt
```

Cliente: `EXPO_PUBLIC_HOY_COACH_AI_ENABLED=true` o `EXPO_PUBLIC_TASK_CAPTURE_AI_ENABLED=true`

Sin IA → parser local (viernes, mañana, «importante», etc.).

## Voz (siguiente fase)

- **Corto plazo:** dictado del teclado iOS (ver `2026-05-19_vaciar_voice_button_removed.md`)
- **Fase 2:** `@react-native-voice/voice` o Whisper en Edge Function

## Privacidad

Texto de tareas se envía a OpenAI cuando IA está activa. Actualizar política de privacidad antes de release público.

## Pendiente producto

- [ ] Confirmar copy anti-presión en prompts
- [ ] Integrar energía/emoción del check-in en el body de la función
- [ ] Voz in-app
- [ ] Analytics `ai_capture_confirmed` / `ai_capture_dismissed`
