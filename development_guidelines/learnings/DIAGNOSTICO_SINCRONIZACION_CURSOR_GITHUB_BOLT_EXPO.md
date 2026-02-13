# Diagnóstico: errores de sincronización entre Cursor, GitHub, Bolt y Expo Go

**Objetivo:** Entender por qué a veces no ves los últimos cambios y dónde se rompe la cadena.

---

## 1. Flujo de sincronización (cómo debería funcionar)

```
Cursor (tu Mac)     →  GitHub (remoto)  →  Bolt (nube)     →  Expo Go (app)
   código aquí           repo único          clon del repo      carga el bundle
   git push          ←  recibe commits    pull / "Update"    Metro en 8081
```

- **Cursor:** Donde editas (carpeta local `Koraa_v1-1`). Los cambios solo existen aquí hasta que haces commit y push.
- **GitHub:** Repo `glendapamelaramirezgarcia/.../Koraa_v1` (o `glendapam12345/Koraa_v1`). Es la “fuente de verdad” compartida.
- **Bolt:** Abre el mismo repo desde GitHub. Lo que Bolt ve = lo último que haya bajado (pull / “Update codebase with external changes”).
- **Expo Go:** Conecta a Metro (servidor de desarrollo). Metro puede estar en Bolt (nube, puerto 8081) o en tu Mac (Cursor). La app carga el JavaScript que sirve ese Metro.

---

## 2. Puntos de fallo y causas

### A. Cursor → GitHub (push no hecho o fallido)

| Síntoma | Causa | Qué hacer |
|--------|--------|-----------|
| Bolt no tiene el script `dev:bolt` ni el diseño nuevo | Los commits están solo en tu Mac; no se ha hecho push | En Cursor (terminal): `git push origin main`. Si pide usuario/contraseña, usa tu GitHub (o token). |
| "Failed to push" / "could not read Username" | GitHub no acepta la conexión (auth) | Configurar credenciales: SSH key o token en HTTPS. Desde Cursor no se puede push sin tu login. |

**Comprobar:** En Cursor, `git status` y `git log --oneline -3`. Si dice "Your branch is ahead of 'origin/main' by X commits", falta push.

---

### B. GitHub → Bolt (Bolt no tiene lo último de GitHub)

| Síntoma | Causa | Qué hacer |
|--------|--------|-----------|
| Bolt sigue mostrando código viejo tras subir desde Cursor | Bolt no ha bajado los últimos commits | En Bolt: "Update codebase with external changes" (o Pull). Luego "Start application". |
| Bolt abre otro branch o commit viejo | Bolt clonó hace tiempo y no hace pull | Asegurarse de estar en `main` y de hacer "Update codebase" / pull después de cada push desde Cursor. |

**Comprobar:** En Bolt no hay `git` útil en la terminal; la única señal es si el código (p. ej. `package.json` con `dev:bolt`, o `app/(tabs)/index.tsx` con "# Tareas") coincide con lo que ves en Cursor/GitHub.

---

### C. Bolt → Metro (puerto 8081 y túnel)

| Síntoma | Causa | Qué hacer |
|--------|--------|-----------|
| "WS-tunnel only supports tunneling over port 8081, attempted to use port 8082" | Algo en Bolt ya usa 8081; Expo arrancó en 8082; el túnel de Bolt solo escucha 8081 | No aceptar 8082. Cerrar Bolt y volver a abrir el proyecto; usar "Start application" de Bolt. En la terminal de Bolt no hay `lsof`/`grep`/`ss` para liberar 8081. |
| "Port 8081 is being used by another process" | Proceso previo (Bolt o Expo) sigue en 8081 | Mismo enfoque: cerrar Bolt, reabrir, arrancar con el botón de Bolt. Si persiste, es limitación del entorno Bolt. |

**Comprobar:** En Bolt no puedes diagnosticar el puerto (shell limitado). Solo puedes probar a reiniciar Bolt y usar su flujo oficial de "Start application".

---

### D. Metro → Expo Go (app no muestra cambios)

| Síntoma | Causa | Qué hacer |
|--------|--------|-----------|
| La app en el móvil/simulador no cambia tras actualizar código | Caché de Metro o de Expo Go | En terminal donde corre Metro: reiniciar con `npm run dev:clear` o `npm run dev:fresh`. En Expo Go: cerrar app por completo y reabrir, o sacudir → Reload. |
| "Unable to connect" / no carga | Expo Go no alcanza a Metro (red, túnel, puerto) | Si usas Bolt: el túnel solo funciona con Metro en 8081 (ver C). Si usas Cursor en Mac: mismo WiFi que el móvil o tunnel con `npx expo start --tunnel`. |

**Comprobar:** Que Metro esté corriendo en la misma máquina (o túnel) que usa Expo Go para escanear el QR o abrir la URL.

---

## 3. Resumen por herramienta

| Herramienta | Rol | Errores típicos de sincronización |
|-------------|-----|-----------------------------------|
| **Cursor** | Editas y haces commit aquí | Cambios sin commit; commits sin push → GitHub y Bolt no se actualizan. |
| **GitHub** | Repo remoto compartido | Solo se actualiza con `git push` desde Cursor (o desde otro cliente con acceso). |
| **Bolt** | Clon del repo en la nube; corre Metro y túnel | Código viejo si no hace pull/"Update" tras tu push. Túnel solo en 8081; terminal sin `lsof`/`grep` para diagnosticar puertos. |
| **Expo Go** | App que carga el bundle de Metro | Muestra versión antigua si Metro no se reinició con caché limpia o si Expo Go no recarga (cerrar y abrir, o Reload). |

---

## 4. Checklist rápido cuando “no se ve el cambio”

1. **Cursor:** ¿Hay cambios sin commit? → `git status`. ¿Commits sin push? → `git push origin main`.
2. **GitHub:** ¿El archivo que cambiaste está actualizado en github.com en `main`? (revisar en el navegador.)
3. **Bolt:** ¿Hiciste "Update codebase with external changes" después del push? ¿Ves el código nuevo (p. ej. "# Tareas" en `index.tsx`)?
4. **Bolt/Metro:** ¿Arrancaste con "Start application" y sin aceptar 8082? Si aceptaste 8082, el túnel falla.
5. **Expo Go:** ¿Cerraste la app y la volviste a abrir, o sacudiste y Reload? ¿Estás en la misma red/túnel que Metro?

---

## 5. Cómo corregir o mitigar el tema de los túneles (puerto 8081)

El túnel de Bolt **solo funciona si Metro corre en el puerto 8081**. Si Metro usa 8082, aparece: *"WS-tunnel only supports tunneling over port 8081"*.

**Qué está hecho en el proyecto:**

- Script **`npm run dev:bolt`** en `package.json`: arranca Expo con `--port 8081` y `REACT_NATIVE_PACKAGER_PORT=8081` para que Metro use siempre 8081 cuando arranques con ese comando.
- En la terminal de Bolt no hay `lsof` ni `grep`, así que **no se puede liberar el 8081 desde ahí** si ya está ocupado.

**Qué hacer cuando el 8081 está ocupado en Bolt:**

1. **No aceptar 8082** cuando Expo pregunte "Use port 8082 instead?" (responde **n**).
2. **Cerrar Bolt por completo** (pestaña o ventana del proyecto) y volver a abrirlo; a veces así se libera el 8081.
3. En Bolt, **usar solo "Start application"** (el botón/enlace que ejecuta el servidor) en lugar de escribir `npm run dev` a mano; ese flujo a veces reserva 8081 desde el inicio.
4. Cuando Bolt tenga el código actualizado, en la terminal de Bolt ejecutar **`npm run dev:bolt`** (no `npm run dev`), para forzar el puerto 8081.

**Resumen:** No se puede “corregir” el túnel desde el repo (es limitación de Bolt). Sí se puede: (1) usar siempre `dev:bolt` en Bolt, (2) no usar 8082, (3) reiniciar Bolt si 8081 sigue ocupado.

---

## 6. Flujo recomendado para ver cambios en Bolt + Expo Go

1. En **Cursor:** terminar cambios → `git add` → `git commit` → `git push origin main`.
2. En **Bolt:** cuando diga "I've detected changes made externally" → **Update codebase with external changes** (Write changes).
3. En **Bolt:** usar **Start application** (no escribir `npm run dev` a mano si antes daba conflicto de puerto).
4. En **Expo Go:** abrir el proyecto (QR o URL); si no cambia nada, cerrar la app y reabrirla o Reload.

Si Bolt sigue sin poder usar 8081, la alternativa es desarrollar y probar en **Cursor + tu Mac**: terminal en la carpeta del proyecto, `npm run dev`, y abrir en simulador o Expo Go en el mismo Mac / misma red.

---

## 7. Comprobar que todo está sincronizado (Cursor ↔ GitHub ↔ Bolt)

| Paso | Dónde | Comando o acción |
|------|--------|-------------------|
| 1 | Cursor | `git status` → no debe haber archivos "modified" o "untracked" que quieras subir. Si los hay: `git add .` y `git commit -m "..."` |
| 2 | Cursor | `git log --oneline -1` y en github.com abrir el repo y comparar: el último commit en la web debe ser el mismo. Si en Cursor dice "ahead of 'origin/main'", hacer **`git push origin main`**. |
| 3 | GitHub | En el navegador, repo → pestaña "Code" → revisar que los archivos (p. ej. `package.json`, `app/(tabs)/index.tsx`) tengan los cambios recientes. |
| 4 | Bolt | "Update codebase with external changes" (o Pull) para bajar los últimos commits. Comprobar que `package.json` tenga el script `dev:bolt`. |
| 5 | Bolt | Arrancar con **"Start application"** o con **`npm run dev:bolt`** (no `npm run dev`). Si pide puerto 8082, responder **n** y cerrar/reabrir Bolt. |
| 6 | Expo Go | Cerrar la app y abrirla de nuevo, o sacudir → Reload, para cargar el bundle nuevo. |

---

**Última actualización:** febrero 2026
