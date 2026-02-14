# Bolt y Expo Go conectados: ver lo mismo en ambos

Para que lo que ves en **Bolt** (navegador) y en **Expo Go** (celular) sea exactamente lo mismo, ambos tienen que usar **el mismo servidor de desarrollo** (Metro). Ese servidor lo arranca Bolt cuando haces "Start application".

---

## Pasos para que Bolt y Expo muestren lo mismo

### 1. Código al día en Bolt

- Si acabas de hacer cambios en **Cursor** y push a GitHub: en Bolt haz **"Update codebase with external changes"** (o "Write changes") para que Bolt tenga el código actual.
- Así Bolt y tu repo comparten la misma versión.

### 2. Arrancar la app desde Bolt

- En Bolt, pulsa **"Start application"** (no abras otra terminal con `npm run dev` en Cursor mientras quieras usar Bolt).
- Bolt arranca Metro en el **puerto 8081** y crea un túnel. Si pregunta "Use port 8082 instead?", responde **No** (n) para que siga usando 8081.
- Cuando esté listo, Bolt te mostrará una **URL** (tipo `exp://...boltexpo.dev`) y/o un **código QR**.

### 3. Abrir esa misma URL en Expo Go

- En tu **celular**, abre la app **Expo Go**.
- **Escanea el QR** que muestra Bolt, **o** en Expo Go → "Enter URL manually" e introduce la URL que Bolt te dio.
- La app que se abre en el celular es la misma que Bolt está sirviendo: **Bolt y Expo Go están conectados** al mismo Metro.

---

## Resumen

| Dónde        | Qué hacer |
|-------------|-----------|
| **Bolt**    | "Update codebase" → "Start application" → anotar la URL o QR. |
| **Expo Go** | Escanear el QR de Bolt o pegar la URL de Bolt. |

Si el túnel de Bolt da timeout en el celular (red/firewall), puedes usar en su lugar **Cursor + tu Mac**: en la terminal `npm run dev:bolt` y en Expo Go escanear el QR de esa terminal (misma WiFi). En ese caso no estarías usando el Metro de Bolt, pero la app sería la misma porque el código es el mismo.

---

**Última actualización:** febrero 2026
