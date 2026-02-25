# Recuperar contraseña desde la app (y por qué no llega el correo)

## Flujo actual: todo desde la app

1. El usuario toca **"Olvidé mi contraseña"** en la pantalla de login.
2. Se envía un correo con un **enlace** (Supabase).
3. Si el usuario **abre ese enlace en el mismo dispositivo** donde tiene la app, se abre **Koraa** y entra en la pantalla **"Nueva contraseña"**.
4. El usuario escribe la nueva contraseña y confirma **dentro de la app**.
5. Al guardar, ya puede iniciar sesión con la nueva contraseña.

Para que el enlace abra la app, en Supabase debe estar configurada la URL de redirección.

---

## Configuración obligatoria en Supabase

### Authentication → URL Configuration
- **Site URL**: Debe estar definida (ej. `https://tu-dominio.com` o la URL de tu proyecto).
- **Redirect URLs**: Añade **exactamente**:
  - `myapp://reset-password`

Así, cuando el usuario toca el enlace del correo, Supabase redirige a `myapp://reset-password` y la app se abre en la pantalla de **Nueva contraseña**.

Sin **Site URL** y sin `myapp://reset-password` en **Redirect URLs**, el correo puede no enviarse o el enlace no abrir la app.

### Authentication → Email Templates
- Abre **"Reset Password"**.
- Comprueba que el template está activo y que el enlace `{{ .ConfirmationURL }}` está en el cuerpo del mensaje.
- El correo se envía desde el servicio de correo de Supabase (o tu SMTP si lo configuraste).

### Authentication → Providers → Email
- "Enable Email Signup" y el flujo de correo deben estar habilitados.
- No desactives el envío de correos de auth.

## 2. Límites de Supabase (plan gratuito)
- Hay un **límite de correos** por hora/proyecto.
- Si envías muchos correos de prueba, espera un rato y vuelve a intentar.

## 3. Spam / correo no deseado
- Los correos de Supabase suelen ir desde un dominio como `@mail.app.supabase.io` o el que tengas en SMTP.
- Pide al usuario que **revisar carpeta de spam/correo no deseado** y que marque como "No es spam" si lo encuentra ahí.

## 4. Configurar una URL de redirección (opcional)
Si quieres que, tras restablecer la contraseña, el usuario vuelva a tu app o a una web concreta:

1. En el proyecto, en `.env`, puedes definir:
   ```bash
   EXPO_PUBLIC_SITE_URL=https://tu-pagina.com/reset-done
   ```
2. En Supabase → **Authentication → URL Configuration → Redirect URLs**, añade esa misma URL.
3. El enlace del correo llevará a la página de Supabase para poner la nueva contraseña y luego redirigirá a `EXPO_PUBLIC_SITE_URL`.

## 5. Probar de nuevo
Después de revisar Site URL, Redirect URLs y plantilla "Reset Password", pide al usuario que vuelva a usar **"Olvidé mi contraseña"** y que revise de nuevo bandeja de entrada y spam.
