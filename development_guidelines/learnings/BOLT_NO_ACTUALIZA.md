# Bolt no muestra los últimos cambios (app desactualizada)

**Problema:** Bolt sigue mostrando una versión antigua de la app aunque el código ya esté guardado o commiteado.

**Causas habituales:** caché de Metro/Expo, proyecto abierto en otra carpeta, o bundler sirviendo código viejo.

---

## Pasos para forzar que Bolt use el código actual

### 1. Asegurarte de que Bolt abre ESTE proyecto

- La ruta del proyecto en Bolt debe ser exactamente la de este repo, por ejemplo:
  `.../Koraa_v1-1`
- Si Bolt tiene "Abrir proyecto" o "Open folder", abre esta carpeta (Koraa_v1-1), no una copia ni otro clon.

### 2. Tener el código al día (si usas Git)

En la terminal, dentro de la carpeta del proyecto:

```bash
git pull origin main
```

### 3. Arrancar la app con caché limpia

En la misma carpeta:

```bash
npm run dev:fresh
```

Ese script borra la caché de `.expo` y `node_modules/.cache` y arranca Expo con `--clear`. Es la forma más fiable de que Metro use el código actual.

Si prefieres no borrar carpetas, usa:

```bash
npm run dev:clear
```

### 4. En el dispositivo o simulador

- Cierra la app por completo (quit) y vuelve a abrirla, **o**
- Sacude el dispositivo → "Reload", **o**
- En iOS Simulator: Cmd+R para recargar.

---

## Si sigue sin actualizarse

- Cierra Bolt por completo y vuelve a abrirlo.
- Abre el proyecto de nuevo desde la carpeta Koraa_v1-1.
- Vuelve a ejecutar `npm run dev:fresh` desde esa carpeta y recarga la app en el dispositivo.

---

**Última actualización:** febrero 2026
