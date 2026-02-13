# Problema: No puedo entrar en Expo Go pero sí en Bolt

## Síntoma

- En **Expo Go**: Dice que la contraseña está mal
- En **Bolt**: Puedo entrar sin problemas
- Las credenciales son las mismas en ambos

## Causa Probable

Expo Go puede tener credenciales viejas almacenadas en AsyncStorage que están causando conflictos con la sesión actual.

## Soluciones

### Solución 1: Cerrar sesión y volver a entrar (Recomendado)

1. En Expo Go, ve a la pantalla de **"Yo"** (perfil)
2. Busca el botón de **"Cerrar sesión"** o **"Sign Out"**
3. Cierra sesión completamente
4. Vuelve a la pantalla de login
5. Ingresa tus credenciales de nuevo

### Solución 2: Limpiar cache de Expo Go

1. Cierra completamente la app Expo Go
2. En iOS: Mantén presionado el icono de Expo Go → Eliminar app → Reinstalar
3. En Android: Configuración → Apps → Expo Go → Almacenamiento → Limpiar datos
4. Abre Expo Go de nuevo y escanea el código QR
5. Intenta iniciar sesión de nuevo

### Solución 3: Verificar variables de entorno

Asegúrate de que las variables de entorno estén correctas:

1. Verifica que tu archivo `.env` tenga:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

2. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev -- --clear
   ```

3. En Expo Go, agita el dispositivo y presiona **"Reload"**

### Solución 4: Verificar logs en consola

El código ahora tiene mejor logging. Revisa la consola del servidor de desarrollo cuando intentes iniciar sesión:

- Deberías ver: `[INFO] Intentando iniciar sesión con email: tu@email.com`
- Si hay error: `[ERROR] Error en signIn: mensaje del error`

Esto te ayudará a identificar el problema exacto.

## Prevención

Para evitar este problema en el futuro:

1. Siempre cierra sesión antes de cambiar de entorno (Expo Go → Bolt)
2. Si cambias de contraseña, cierra sesión en todos los dispositivos
3. Usa el mismo entorno de desarrollo cuando sea posible

## Notas Técnicas

- Expo Go y Bolt pueden tener diferentes almacenamientos de sesión
- AsyncStorage puede persistir credenciales viejas entre sesiones
- El código ahora incluye mejor manejo de errores y logging para diagnóstico
