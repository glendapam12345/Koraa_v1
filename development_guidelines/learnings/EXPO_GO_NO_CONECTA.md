# Expo Go no conecta: qué revisar

Cuando Expo Go muestra **"Could not connect to the server"** o "There was a problem running the requested app" con una URL tipo `exp://192.168.x.x:8081`, el teléfono **no puede alcanzar** el servidor de desarrollo en tu computadora. Suele ser por **red** o **firewall**. Prueba en este orden.

---

## 1. Misma WiFi

- El **celular** y el **Mac** deben estar en la **misma red WiFi**.
- Si el celular usa datos móviles o otro WiFi, el QR normal (`exp://192.168.x.x:8081`) no funcionará.

**Solución si no están en la misma red:** usa túnel (paso 4).

---

## 2. Metro corriendo

- En **Cursor**, en la terminal del proyecto, ejecuta:
  ```bash
  npm run dev
  ```
- Debe aparecer el **código QR** y algo como "Metro waiting on exp://...".
- Si no aparece el QR, espera unos segundos o prueba con caché limpia:
  ```bash
  npm run dev:clear
  ```

---

## 3. Escanear el QR bien

- Abre **Expo Go** en el celular.
- Usa la **cámara del celular** (no la de Expo Go) para escanear el QR que sale en la terminal.
- O en Expo Go: **"Enter URL manually"** y pega la URL que aparece en la terminal (empieza por `exp://`).

---

## 4. Usar túnel (si nada de lo anterior funciona)

Si el celular no alcanza tu Mac por la red (otro WiFi, firewall, etc.), usa **túnel**:

```bash
npm run dev:tunnel
```

- La primera vez puede pedir instalar **@expo/ngrok** o similar; acepta.
- Saldrá un **nuevo QR** y una URL tipo `exp://xxx.ngrok.io` que funciona desde cualquier red.
- Escanea ese QR con Expo Go (o pega la URL en "Enter URL manually").

---

## 5. Caché y versión de Expo Go

- **Limpiar caché de Metro:**
  ```bash
  npm run dev:fresh
  ```
- En el **celular**: cierra Expo Go por completo (quit) y ábrela de nuevo.
- Actualiza **Expo Go** en la App Store / Play Store a la última versión.

---

## 6. Resumen rápido

| Síntoma | Qué hacer |
|--------|-----------|
| **"Could not connect to the server"** / exp://192.168.x.x:8081 | Misma WiFi que el Mac, o **`npm run dev:tunnel`** y escanear el nuevo QR. |
| No carga / "Unable to connect" | Misma WiFi que el Mac, o `npm run dev:tunnel` y escanear ese QR. |
| QR no aparece en la terminal | `npm run dev:clear` y esperar. |
| Sigue sin conectar | `npm run dev:tunnel`, actualizar Expo Go, cerrar y reabrir Expo Go. |

---

**Última actualización:** febrero 2026
