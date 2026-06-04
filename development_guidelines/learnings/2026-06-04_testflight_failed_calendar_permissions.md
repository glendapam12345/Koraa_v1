# TestFlight build Failed — ITMS-90683 calendario iOS 17+

**Fecha:** 2026-06-04  
**Builds afectados:** 27, 28 (processing → Failed en App Store Connect)

## Síntoma

Tras subir el IPA, Apple marca el build como **Failed** en TestFlight (no es fallo de EAS compile).

## Causa probable

Build **27** añadió `expo-calendar` con solo `calendarPermission` (`NSCalendarsUsageDescription`). En **iOS 17+**, Apple exige además:

- `NSCalendarsWriteOnlyAccessUsageDescription` (solo escribir eventos), o  
- `NSCalendarsFullAccessUsageDescription` (lectura + escritura)

Koraa solo **añade** eventos → `writeOnlyAccess: true` en el plugin.

También existía `expo-camera` en `package.json` **sin uso** — puede disparar `NSCameraUsageDescription` en análisis estático.

## Fix (build 29+)

En `app.config.js`:

```js
['expo-calendar', {
  calendarPermission: '...',
  writeOnlyAccess: true,
  writeOnlyCalendarPermission: '...',
}],
ios.infoPlist: {
  NSCalendarsUsageDescription: '...',
  NSCalendarsWriteOnlyAccessUsageDescription: '...',
},
```

- Quitar `expo-camera` de dependencias.
- Subir `ios.buildNumber` → **29**.

## Verificación

Revisar email de Apple Developer (asunto suele incluir **ITMS-90683** y el key faltante).

Tras nuevo build + submit manual:

```bash
eas build --platform ios --profile production
eas submit --platform ios --id <BUILD_ID> --profile production
```
