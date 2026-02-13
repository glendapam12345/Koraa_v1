# Configuración de Variables de Entorno en Expo Go

## Problema

Las variables de entorno definidas en el archivo `.env` no funcionan en Expo Go. Los usuarios no pueden iniciar sesión porque la app no puede conectarse a Supabase.

## Causa

Expo Go **NO** lee variables de entorno del archivo `.env` automáticamente. Solo lee la configuración del archivo `app.json` (o `app.config.js`).

## Solución

Las variables de entorno deben estar en `app.json` en la sección `extra`:

```json
{
  "expo": {
    ...
    "extra": {
      "supabaseUrl": "https://tu-proyecto.supabase.co",
      "supabaseAnonKey": "tu-anon-key-aqui"
    }
  }
}
```

## Cómo se Acceden en el Código

En `lib/supabase.ts`, el código ya está preparado para leer desde `app.json`:

```typescript
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

Primero intenta leer de `Constants.expoConfig.extra` (para Expo Go), y si no existe, usa `process.env` (para desarrollo web o builds nativos).

## Instrucciones para el Usuario

**Si estás usando Expo Go:**

1. Detén el servidor de desarrollo
2. Reinicia con `npm run dev`
3. Escanea el código QR nuevamente
4. Ahora deberías poder iniciar sesión

**Si el problema persiste:**

1. Cierra completamente la app de Expo Go en tu dispositivo
2. Vuelve a escanear el código QR
3. La app cargará la nueva configuración

## Por Qué Esto Sucede

- **Expo Go**: App standalone que ejecuta tu código JavaScript pero no tiene acceso al sistema de archivos del proyecto (como `.env`)
- **Development Build o Producción**: Tu propio build nativo tiene acceso completo al sistema de archivos y puede usar `.env`

## Mejores Prácticas

- **Desarrollo con Expo Go**: Usa `app.json` con la sección `extra`
- **Development Builds**: Puedes usar tanto `.env` como `app.json`
- **Producción**: Usa variables de entorno del sistema de build (EAS, etc.)

## Referencias

- [Expo Constants Documentation](https://docs.expo.dev/versions/latest/sdk/constants/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
