# Bolt no muestra los últimos cambios (app desactualizada)

**Problema:** Bolt sigue mostrando una versión antigua de la app aunque el código ya esté guardado o commiteado.

Hay **dos causas** distintas; sigue la checklist según lo que veas.

---

## 1. Bolt tiene código viejo (no ha bajado lo de GitHub)

Si editas en **Cursor** y haces push a GitHub, **Bolt no se actualiza solo**. Bolt es un clon del repo en la nube y solo ve lo que haya “bajado”.

### Qué hacer (en este orden)

| Paso | Dónde | Acción |
|------|--------|--------|
| 1 | **Cursor** | Hacer commit y **push**: `git push origin main` |
| 2 | **Bolt** | Cuando aparezca *"I've detected changes made externally"* → **"Update codebase with external changes"** (o "Write changes") |
| 3 | **Bolt** | Pulsar **"Start application"** (así Bolt arranca Metro en el puerto 8081 y el túnel funciona) |
| 4 | **Expo Go** | Cerrar la app por completo y volver a abrirla, o sacudir → **Reload** |

**Comprobar:** En Bolt, abre un archivo que hayas cambiado (por ejemplo `app/(tabs)/semana.tsx`). Si ves el código nuevo (p. ej. "Tu semana", gradientes), Bolt ya tiene el código al día.

---

## 2. Bolt tiene el código nuevo pero la app en el móvil no cambia

A veces Bolt ya tiene los archivos actualizados pero Metro o Expo Go siguen mostrando el bundle anterior (caché).

### Qué hacer

| Paso | Dónde | Acción |
|------|--------|--------|
| 1 | **Bolt** | Dejar de usar "Start application" (parar el servidor si puedes). |
| 2 | **Bolt** | Volver a pulsar **"Start application"**. El proyecto usa `npm run dev` con puerto **8081** fijo, así el túnel de Bolt funciona. |
| 3 | **Expo Go** | Cerrar la app por completo (quit) y volver a abrirla. Escanear de nuevo el QR que muestra Bolt. |
| 4 | Si sigue igual | En Bolt, **cerrar la pestaña/ventana del proyecto** y volver a abrir el mismo repo desde GitHub; luego "Start application" de nuevo. |

### Si en Bolt tienes terminal y quieres limpiar caché

Puedes ejecutar (si Bolt lo permite):

```bash
npm run dev:fresh
```

Eso borra `.expo` y `node_modules/.cache` y arranca con `--clear`. Luego en Expo Go: cerrar app y reabrir, o Reload.

---

## Resumen rápido

| Síntoma | Causa | Solución |
|--------|--------|----------|
| Bolt muestra archivos viejos | No has hecho "Update codebase" tras el push | En Bolt: **Update codebase with external changes** → **Start application** |
| La app en el celular no cambia | Caché de Metro o de Expo Go | Reiniciar "Start application" en Bolt; en Expo Go **cerrar y reabrir** la app o Reload |
| "Use port 8082?" en Bolt | El túnel solo funciona en 8081 | Responder **No**. Cerrar Bolt y reabrir el proyecto; usar solo "Start application". El script `dev` del proyecto ya usa `--port 8081`. |

---

## Comprobar que todo está al día

1. **Cursor:** `git status` y `git log --oneline -3`. Si dice *"Your branch is ahead of 'origin/main'"*, haz **push**.
2. **GitHub:** En github.com, rama `main`, revisa que el archivo que cambiaste esté actualizado.
3. **Bolt:** ¿Hiciste **"Update codebase with external changes"** después del push? ¿Ves el código nuevo al abrir un archivo?
4. **Bolt:** ¿Arrancaste con **"Start application"** y no aceptaste el puerto 8082?
5. **Expo Go:** ¿Cerraste la app y la volviste a abrir, o sacudiste y Reload?

---

**Última actualización:** febrero 2026

**Relacionado:** [DIAGNOSTICO_SINCRONIZACION_CURSOR_GITHUB_BOLT_EXPO.md](./DIAGNOSTICO_SINCRONIZACION_CURSOR_GITHUB_BOLT_EXPO.md), [BOLT_Y_EXPO_GO_CONECTADOS.md](./BOLT_Y_EXPO_GO_CONECTADOS.md)
