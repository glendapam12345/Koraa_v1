# Carpeta `koraav2/` — legacy (auditoría paso 10)

**Fecha:** 2026-05-19  
**Actualización:** 2026-06-04 — carpeta **eliminada del disco** por decisión del equipo.  
**Severidad:** Baja (confusión en desarrollo, no afecta EAS si no se importa)

## Problema

`koraav2/` es una copia antigua del proyecto (~1.2 GB, con `node_modules` anidados). No entra al build de la raíz, pero:

- El README parecía un proyecto Expo válido → riesgo de `expo start` en la carpeta equivocada.
- Búsquedas en el IDE/IA pueden abrir archivos con bugs ya corregidos en la app activa.
- Contiene `toISOString()` y patrones viejos sin el fix de fecha local.

## App activa

Todo desarrollo y EAS usan la **raíz del repo**:

- `app.config.js`, `app/`, `components/`, `lib/`, `package.json` (raíz)

## Salvaguardas añadidas

| Medida | Archivo |
|--------|---------|
| Aviso visible | `koraav2/README.md` |
| Metro no empaqueta legacy | `metro.config.js` → `blockList` |
| ESLint ignora legacy | `eslint.config.js` |
| Cursor no indexa | `.cursorignore` |
| CI local | `npm run check:legacy` |
| Jest / TS | ya excluían `koraav2` |

## Comandos

```bash
npm run check:legacy   # sin imports a koraav2 en código activo
npm run verify:local   # incluye check:legacy
```

## Eliminar la carpeta (opcional)

Cuando no necesites referencia histórica:

```bash
rm -rf koraav2
```

Hazlo solo si confirmas que no hay trabajo sin commitear ahí. El build de producción no depende de esta carpeta.
