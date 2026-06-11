# Dictado por voz en Tareas

**Fecha:** 2026-06-08  
**Estado:** Entregado

## Qué hace

- Botón 🎤 junto al campo de captura en Tareas (`VaciarCaptureForm`)
- Transcripción con `expo-speech-recognition` (iOS / Android / web donde esté disponible)
- Texto en vivo en el campo; tap de nuevo para detener
- Hint dismissible en Expo Go: micrófono del teclado del sistema (`dictateHintKeyboardOnly`)

## Archivos clave

- `hooks/useTaskVoiceDictation.ts` — lazy load del módulo nativo; no tumba Expo Go
- `components/tasks/VaciarCaptureForm.tsx` — botón mic + hint teclado
- `lib/taskVoiceLocale.ts` — `es-MX` / `en-US`
- `app.config.js` — plugin `expo-speech-recognition` + permisos micrófono y speech
- `hooks/useVaciarHints.ts` — persistencia `koraa_vaciar_dictate_hint_dismissed_v1_{userId}`

## Expo Go

`ExpoSpeechRecognition` no está en Expo Go → sin botón 🎤 in-app; se muestra hint para dictar con el teclado iOS.

## Release nativo

Incluido en próximo build EAS (plugin + permisos ya en `app.config.js`):

```bash
eas build --platform ios --profile production
```

## Completed

- [x] `expo-speech-recognition` instalado (SDK 54)
- [x] Hook con guard Expo Go / dev build
- [x] UI micrófono + estados escuchando
- [x] Hint teclado reconectado tras refactor de captura
- [x] i18n ES/EN (`vaciarExtra.*`)
- [x] Fix texto invisible en TextInput iOS (sin DM Sans en campo)
