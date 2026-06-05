# Google Calendar API — configuración OAuth

**Fecha:** 2026-06-05  
**Propósito:** Conectar Koraa con Google Calendar para exportar tareas como eventos (sync unidireccional Koraa → Google).

---

## Qué hace la integración

- **OAuth 2.0 + PKCE** desde la app (`expo-auth-session`)
- Scope: `https://www.googleapis.com/auth/calendar.events` (crear eventos)
- Tokens guardados en **SecureStore** (por usuario)
- Botón **Google** en focos de Hoy y en tarjetas de tarea (si hay cuenta conectada)
- Sección **Ajustes → Google Calendar** para conectar / desconectar

**No incluye (fase futura):**

- Sync bidireccional (cambios en Google → Koraa)
- Recordatorios push por evento de Google
- Edge Function en Supabase (tokens solo en dispositivo por ahora)

---

## 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → crear o elegir proyecto
2. **APIs & Services → Library** → habilitar **Google Calendar API**
3. **APIs & Services → OAuth consent screen**
   - Tipo: External (o Internal si es workspace)
   - Scopes: añadir `.../auth/calendar.events`
   - Usuarios de prueba: tu Gmail mientras esté en modo Testing

---

## 2. Credenciales OAuth

### Web client (Expo Go + desarrollo)

**APIs & Services → Credentials → Create OAuth client ID → Web application**

- **Authorized redirect URIs:** obtén el URI con la app:
  ```bash
  npx expo start
  # En logs o en código: getGoogleOAuthRedirectUri() → típicamente:
  # exp://127.0.0.1:8081/--/oauth/google   (Expo Go)
  # myapp://oauth/google                   (dev build / standalone)
  ```
- Añade **todos** los redirect URIs que uses (Expo Go, dev build, producción)

Copia el Client ID → `.env`:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

### iOS client (TestFlight / App Store)

- Application type: **iOS**
- Bundle ID: `com.impermanencecasaartisitca.koraav1` (ver `app.config.js`)

```bash
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxx-ios.apps.googleusercontent.com
```

### Android client

- Application type: **Android**
- Package: `com.impermanencecasaartisitca.koraav1`
- SHA-1: fingerprint del keystore de debug o EAS:
  ```bash
  eas credentials -p android
  # o keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx-android.apps.googleusercontent.com
```

---

## 3. Variables en Koraa

En `.env` (local) y **EAS Secrets** (builds):

| Variable | Uso |
|----------|-----|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Expo Go, fallback |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS nativo |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android nativo |

Tras cambiar `.env`:

```bash
npm run dev:clear
```

---

## 4. Probar en la app

1. Ajustes → **Google Calendar** → **Conectar**
2. Inicia sesión con Google y acepta permiso de calendario
3. En **Hoy**, en un foco → toca **Google**
4. Verifica el evento en [Google Calendar](https://calendar.google.com)

Si ves “Google Calendar no configurado”, faltan las variables `EXPO_PUBLIC_GOOGLE_*`.

---

## 5. Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `lib/googleCalendar/` | OAuth, tokens, REST API |
| `hooks/useGoogleCalendarConnection.ts` | Estado conectado / email |
| `components/settings/GoogleCalendarConnectSection.tsx` | UI Ajustes |
| `components/tasks/AddToGoogleCalendarButton.tsx` | Exportar tarea |
| `components/tasks/TaskCalendarExportRow.tsx` | Google + calendario nativo |

---

## 6. App Review / producción

- Completar **OAuth consent screen** y pasar a producción cuando salgas de Testing
- Política de privacidad: mencionar acceso a Google Calendar para crear eventos
- No se almacenan tokens en Supabase en esta fase; solo en el dispositivo del usuario

---

## Related

- Calendario nativo (expo-calendar): `development_guidelines/learnings/2026-05-19_expo_calendar_native_module.md`
- Scheme de la app: `myapp` en `app.config.js`
