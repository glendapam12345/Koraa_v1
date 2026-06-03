# expo-calendar: módulo nativo y builds

**Fecha:** 2026-05-19  
**Auditoría:** paso 3

## Regla

`expo-calendar` es **módulo nativo**. Solo funciona en:

- Expo Go (si el SDK del cliente lo trae)
- **Development build** o **EAS production** con plugin en `app.config.js`

Un `eas update` **no** añade calendario a un binario viejo (p. ej. build 26).

## Código defensivo

| Archivo | Comportamiento |
|---------|----------------|
| `lib/deviceCalendar.ts` | `requireOptionalNativeModule('ExpoCalendar')`; `import('expo-calendar')` solo si existe |
| `AddToDeviceCalendarButton` | No renderiza si `!isDeviceCalendarSupported()` |
| `scripts/check-calendar-native.mjs` | `npm run check:calendar` antes de EAS |

## Config

```js
// app.config.js
['expo-calendar', {
  calendarPermission: 'Koraa usa tu calendario para agregar tareas con fecha como eventos.',
}],
```

`ios.buildNumber` debe ser **27+** para releases con calendario.

## Comandos

```bash
npm run check:calendar
eas build --platform ios --profile production
```

Ver entrega: [2026-05-19_testflight_build_27_calendar.md](../delivered/2026-05-19_testflight_build_27_calendar.md).
