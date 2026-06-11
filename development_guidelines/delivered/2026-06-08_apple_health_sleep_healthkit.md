# Sueño + App Salud (HealthKit) — Fase 2

**Fecha:** 2026-06-08  
**Estado:** Entregado (código; requiere nuevo build iOS)  
**Relacionado:** `lib/appleHealthKit.ts`, `lib/appleHealthSleep.ts`, `hooks/useAppleHealthConnection.ts`

## Qué hace

1. **HealthKit (TestFlight / dev client):** lee `SleepAnalysis` de anoche y calcula horas dormidas.
2. **Ajustes → App Salud:** pide permiso iOS, muestra `~X h` cuando hay datos, botón actualizar.
3. **Hoy:** tarjeta con horas de Salud; si sueño &lt; 6 h, **solo 1 paso visible** (como día abrumado).
4. **Expo Go:** sigue abriendo Salud por deep link; sin lectura automática.

## Build iOS obligatorio

```bash
npx expo prebuild --platform ios
eas build --platform ios --profile production
```

Plugin en `app.config.js`: `react-native-health` con `NSHealthShareUsageDescription`.

En [Apple Developer](https://developer.apple.com/account/resources/identifiers/list): capability **HealthKit** en el bundle `com.impermanencecasaartisitca.koraav1`.

## Prueba en dispositivo físico

HealthKit no funciona en simulador. Necesitas iPhone con datos de sueño en Salud.

1. Ajustes → Conectar con Salud → aceptar permiso de sueño.
2. Hoy por la mañana con &lt; 6 h → un solo paso sugerido visible.
3. Tarjeta: «Según Salud, anoche ~X h».

## Anti-presión

- Sin metas de 8 h ni rachas.
- Umbral interno `SHORT_SLEEP_HOURS = 6` solo para suavizar UI, no para juzgar.
