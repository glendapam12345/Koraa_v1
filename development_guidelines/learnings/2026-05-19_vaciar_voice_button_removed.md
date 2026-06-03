# Tareas: botón de micrófono engañoso (auditoría paso 5)

**Fecha:** 2026-05-19

## Problema

El botón de micrófono en **Tareas** (`vaciar.tsx`) no grababa voz: abría `Alert.prompt` y sugería el micrófono del teclado. Generaba expectativa rota.

## Solución

- **Eliminado** el botón flotante de micrófono y `handleVoiceInput`.
- **Añadido** consejo dismissible bajo el campo de texto (solo iOS/Android): cómo dictar con el teclado del sistema.
- Persistencia: `koraa_vaciar_dictate_hint_dismissed_v1_{userId}` en AsyncStorage.

## Futuro

Reconocimiento in-app requeriría módulo nativo (p. ej. `@react-native-voice/voice` o API de Expo cuando exista en el SDK). Hasta entonces, no mostrar controles que simulen grabación.

## i18n

- `vaciarExtra.dictateHint` (ES/EN)
- `vaciarExtra.a11yDismissDictateHint`
