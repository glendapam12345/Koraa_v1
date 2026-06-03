# Metro config + tests unitarios (auditoría pasos 8 y 9)

**Fecha:** 2026-05-19

## Paso 9 — Metro

**Problema:** `expo-doctor` advertía un `metro.config.js` que no extendía `expo/metro-config`.

**Solución:** `metro.config.js` en la raíz:

```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
```

**Verificación:** `npm run check:metro` (incluido en `verify:local`).

## Paso 8 — Tests

Nuevas suites en `__tests__/lib/`:

| Archivo | Cubre |
|---------|--------|
| `smartPrioritization.test.ts` | Focos tras check-in (2–5 tareas, subtareas excluidas) |
| `redistributeWorkload.test.ts` | Carga diaria y reparto de fechas |
| `offlineStorage.test.ts` | Cola offline check-in / tareas |
| `supabaseConfig.test.ts` | Prioridad `.env` vs `extra`, mismatch hosts |

**Comando:** `npm run test:unit`

## Pre-flight completo

```bash
npm run verify:local
```

Ejecuta: metro, supabase, schema, migraciones, calendario, tests unitarios.
