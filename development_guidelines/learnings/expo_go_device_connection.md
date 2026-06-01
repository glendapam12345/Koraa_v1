# Expo Go en celular físico (LAN y túnel)

**Fecha:** 2026-06-01  
**Problema:** `npm run dev:tunnel` falla con `Cannot read properties of undefined (reading 'body')`.

## Causa

El túnel integrado de Expo usa `@expo/ngrok` con un binario/API de ngrok v2. A menudo falla por límites de la cuenta compartida de Expo o cambios en la API de ngrok. No es un error de Koraa.

## Solución recomendada: LAN (misma Wi‑Fi)

1. Mac y iPhone/Android en la **misma red Wi‑Fi** (evita “Wi‑Fi invitados” o datos móviles solo en el teléfono).
2. En la Mac:

```bash
npm run dev:lan
```

3. Copia la URL `exp://…` que imprime el script (o la que muestra Metro, p. ej. `exp://172.20.7.76:8081`).
4. En el celular:
   - Abre **Expo Go** (no solo la cámara).
   - **Enter URL manually** / **Introducir URL**.
   - Pega la URL completa.
5. **iOS:** Ajustes → Expo Go → activar **Red local**.

## Error: "The request timed out" (exp://172.20.x.x:8081)

Metro en la Mac responde, pero el **celular no puede hablar con la Mac** en esa IP.

Causas habituales:

1. **Wi‑Fi con aislamiento** (universidad, oficina, cafetería): el móvil y la Mac ven internet pero no se ven entre sí.
2. **Redes distintas** (Mac en Wi‑Fi, iPhone en datos móviles).
3. **VPN** en Mac o celular.
4. **iOS:** Red local desactivada para Expo Go.

### Arreglo que más funciona: hotspot del iPhone

1. iPhone → **Ajustes** → **Compartir internet** → activar.
2. Mac → **Wi‑Fi** → conectar a la red del iPhone (contraseña en Ajustes del iPhone).
3. En la Mac: `npm run dev:lan` (la IP cambiará, p. ej. `192.168.x.x`).
4. En Expo Go → URL manual → pegar la **nueva** `exp://…`.
5. iOS: **Ajustes → Expo Go → Red local → ON**.

### Mientras tanto en la Mac

Con Metro corriendo, pulsa **`i`** en la terminal → simulador iOS (misma red no hace falta).

## Si LAN no conecta (otros)

- Desactiva VPN en Mac o celular.
- Firewall de macOS: **Ajustes del sistema → Red → Firewall** → permitir **Node** / **Terminal**.
- No uses Wi‑Fi “invitados” para desarrollo.

## Alternativa: tu propio ngrok (Wi‑Fi bloqueado / `dev:tunnel` roto)

1. Cuenta gratis en [ngrok.com](https://ngrok.com) → copia **authtoken**.
2. `brew install ngrok` → `ngrok config add-authtoken TU_TOKEN`
3. Opcional: pegar el mismo token en `~/.expo/ngrok.yml` y reintentar `npm run dev:tunnel`.
4. **Manual (dos terminales):**
   - Terminal A: `npm run dev` (dejar corriendo).
   - Terminal B: `ngrok http 8081` → copia la URL `https://xxxx.ngrok-free.app`.
   - Para Expo Go, en muchos casos: `exp://xxxx.ngrok-free.app` (sin `:8081`).
   - Si no carga: para Metro y arranca  
     `EXPO_PACKAGER_PROXY_URL=https://xxxx.ngrok-free.app npm run dev:lan`  
     (usa la URL https que muestra ngrok).

Referencia: [Expo issue #43335](https://github.com/expo/expo/issues/43335).

## Probar cambios sin Expo Go

Build de desarrollo / TestFlight no incluye el bundle de Metro; para el commit en `main` reciente hace falta Expo Go + LAN o un nuevo build EAS.

## Comandos del proyecto

| Comando | Uso |
|---------|-----|
| `npm run dev` | Metro en LAN (QR con IP local) |
| `npm run dev:lan` | Igual + imprime URL para pegar en Expo Go |
| **`npm run dev:phone`** | **Metro + túnel público** (usa si LAN da timeout) |
| `npm run dev:phone:tunnel` | Solo túnel (con `npm run dev` ya corriendo) |
| `npm run dev:tunnel` | Túnel Expo/ngrok (puede fallar con error `body`) |

### Error: bundle pide `http://….trycloudflare.com:8081`

El túnel Cloudflare **no usa el puerto 8081** en el celular (solo HTTPS en 443). Suele pasar si:

- Metro quedó en **8082** y cloudflared apunta a **8081**.
- Había **dos** `npm run dev` abiertos.

**Arreglo:** un solo comando que alinea todo:

```bash
npm run dev:cf
```

Escanea el QR (debe decir `trycloudflare.com` **sin** `:8081`). En Expo Go: **Reload JS** si viste el error rojo antes.

### `dev:phone` (alternativa)

1. Para el servidor anterior (Ctrl+C).
2. `npm run dev:phone`
3. Espera el mensaje **「ABRE EN EXPO GO」** con una URL tipo `exp://xxxxx.loca.lt`
4. Pégala en Expo Go → URL manual (no uses `172.20.x.x`).

El túnel usa `localtunnel` (internet, no Wi‑Fi local). La primera carga puede tardar unos segundos.
