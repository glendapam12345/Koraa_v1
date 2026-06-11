# Emergency Kit — plan y fases

**Fecha:** 2026-06-08  
**Estado:** MVP en app (fase 1)

## Objetivo

Espacio de apoyo emocional en Para mí — no productividad. Pregunta: *¿Qué necesitas ahora mismo?*

## Fase 1 (entregado en código)

- Tarjeta premium en `/(tabs)/parami`
- Check-in por situación (`/emergency-kit`)
- Sesión con mensaje IA + fallback local, acciones suaves, modo crisis
- 9 módulos de confort con guardado local (AsyncStorage)
- Edge function `emergency-kit` (mismo flag `EXPO_PUBLIC_HOY_COACH_AI_ENABLED`)
- Contexto IA: check-ins recientes, energía, cartas guardadas

## Modo crisis en Hoy (fase 1.5)

Tras abrir Emergency Kit con situación de crisis, `Hoy` muestra:

- Banner «Modo cuidado activo» con enlace a Emergency Kit
- Pasos sugeridos ocultos (sin presión de tareas)
- Sin nudges de «nada hecho», aligerar carga ni celebración de tareas vacías
- Expira automáticamente a las **48 h** o al cerrar el banner

Archivos: `hooks/useCrisisMode.ts`, `components/hoy/HoyCrisisBanner.tsx`, `HoyFocusPanel` + `app/(tabs)/index.tsx`.

## Fase 2 (pendiente)

- Diario / journal en Supabase para enriquecer contexto IA
- Subida de fotos/voz en Caja de recuerdos (expo-image-picker)
- Preferencias IA persistentes (favoritos aprendidos)
- Recomendaciones Spotify/OMDb opcionales

## Despliegue IA

```bash
supabase functions deploy emergency-kit
```

Requiere `OPENAI_API_KEY` en el proyecto Supabase.
