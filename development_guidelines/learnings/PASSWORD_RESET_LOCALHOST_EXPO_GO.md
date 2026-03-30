# Recuperar contraseña: localhost rechaza conexión / enlace no abre

**Síntoma:** Tras pedir el enlace por email, el navegador muestra `localhost` y **ERR_CONNECTION_REFUSED**, o el enlace no abre Koraa en Expo Go.

## Confirmar cuenta (email) y `localhost:3000` vs `8081`

**Síntoma:** El correo de confirmación abre `http://localhost:3000/#access_token=...` y Chrome dice **La página localhost ha rechazado la conexión** (`ERR_CONNECTION_REFUSED`). Luego la app dice **contraseña incorrecta** al iniciar sesión.

**Por qué:** En Supabase, **Site URL** por defecto suele ser `http://localhost:3000`. Este proyecto arranca con **`npm run dev` en el puerto 8081**, no 3000. No hay nada escuchando en 3000 → conexión rechazada. Además, **hasta que confirmes el correo**, Supabase puede rechazar el login (a veces como “credenciales inválidas”).

**Qué hacer en Supabase (Dashboard → Authentication → URL Configuration):**

1. **Site URL:** pon `http://localhost:8081` (si pruebas la app web en esa URL con Expo).
2. **Redirect URLs:** añade al menos:
   - `http://localhost:8081/**`
   - `http://localhost:8081`
3. Si usas **Expo Go en el móvil**, añade también `exp://**` o la URL exacta que muestra la consola al registrarte (log `emailRedirectTo` en desarrollo).
4. **Vuelve a registrarte** o pide **reenviar** el correo de confirmación para que el enlace use la URL nueva.

En código, `signUp` envía `emailRedirectTo` (puerto/origen correctos en web; `createURL('/')` en nativo). Opcional en `.env`: `EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN=http://localhost:8081`.

**Al abrir el enlace:** deja `npx expo start` en marcha; en web pulsa `w` y **entonces** abre el enlace del correo, o pega la URL en la misma pestaña donde corre la app.

## Por qué pasa

1. **`localhost` en el ordenador** solo funciona si **`npx expo start` está corriendo** y abres el enlace en el navegador **mientras** la app web está activa en ese puerto (p. ej. 8081). Si Expo está parado → “rechazó la conexión”.

2. **`localhost` en el móvil** apunta al **propio teléfono**, no a tu Mac. Los enlaces con `http://localhost:8081/...` **no sirven** en el iPhone.

3. **Expo Go** usa URLs tipo `exp://...`, no `myapp://...` ni solo `localhost`. El `redirectTo` del correo debe coincidir con lo que permite Supabase y con lo que genera `expo-linking` (`createURL`).

## Qué hacer

### A) En Supabase (una vez)

1. [Dashboard](https://supabase.com/dashboard) → tu proyecto → **Authentication** → **URL Configuration**.
2. En **Redirect URLs**, **no basta** con solo `http://localhost:8081/**` si usas **Expo Go en el iófono**: hace falta también una URL **`exp://...`**.

   - **Opción rápida:** añade **`exp://**`** (comodín; Supabase lo acepta en muchos proyectos).
   - **Opción exacta:** al pedir “Olvidé mi contraseña” en la app, Koraa muestra un **aviso** con la URL exacta a pegar; o mira la consola Metro con el log `redirectTo` (algo como `exp://192.168.x.x:8081/--/reset-password`).
   - **Web en la Mac:** `http://localhost:8081/**` está bien.

3. Guarda.

4. **Vuelve a pedir** “Olvidé mi contraseña” para que el **nuevo** email use el `redirectTo` correcto.

### B) Abrir el enlace

- **En el iPhone:** abre el correo en el iPhone y toca el enlace; debería abrir **Expo Go** si el `redirectTo` está permitido.
- **En la Mac con web:** deja `npx expo start` en marcha, abre la app en el navegador (`w` en la terminal) y **entonces** usa el enlace del correo (o pega la URL que indique Supabase).

### C) Si sigue fallando

- Usa **Regístrate** con el mismo email si no hay usuario, o **inicia sesión** tras cambiar la contraseña en Supabase (**Authentication → Users** → usuario → reset password manual del panel, según versión).

**Fecha:** marzo 2026
