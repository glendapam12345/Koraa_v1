# Error: "TypeError: Network request failed"

**Cuándo aparece:** Al abrir la app o al hacer una acción que llama a Supabase (login, cargar tareas, etc.). La consola muestra `TypeError: Network request failed` y en el call stack aparece `fetch.js` o `_handleRequest`.

**Causas habituales**

0. **`expo.extra` (en `app.config.js`) con Supabase distinto al `.env` (muy frecuente)**  
   En `lib/supabase.ts` la URL y la clave de **`expo.extra.supabaseUrl` / `expo.extra.supabaseAnonKey`** tienen prioridad sobre `EXPO_PUBLIC_*` del `.env`.  
   Si en `app.config.js` quedó un **proyecto Supabase viejo, pausado o borrado**, el dominio puede no resolver y verás **Network request failed** aunque el `.env` esté bien.  
   **Solución:** quita `supabaseUrl` y `supabaseAnonKey` de `extra` y usa solo `.env`, **o** mantén ambos alineados con el mismo proyecto. Tras cambiar, reinicia con `npx expo start -c`.  
   **EAS Build:** define `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en los secretos del proyecto EAS.

1. **Sin internet o red inestable**  
   El dispositivo o simulador no tiene conexión o la conexión es muy mala.  
   - Comprueba WiFi o datos.  
   - Prueba en el navegador del mismo dispositivo a abrir tu URL de Supabase (`https://TU_REF.supabase.co`, la misma que en `.env`; debe cargar algo, aunque sea un JSON).

2. **Expo Go en celular real**  
   La URL de Supabase debe ser **pública** (https://...supabase.co), no `localhost`.  
   - Si en `.env` o `app.config.js` → `extra` tienes la URL correcta de Supabase (https://...), la app debería poder conectar.  
   - Si en algún momento usaste `http://localhost:54321` para Supabase local, cámbialo por la URL de tu proyecto en supabase.com.

3. **Firewall o red que bloquea**  
   Redes corporativas o escolares a veces bloquean ciertos dominios o puertos.  
   - Prueba con datos móviles en lugar de WiFi (o al revés).  
   - Prueba desde otro lugar/red.

4. **Timeout en la primera petición**  
   A veces la primera petición (por ejemplo `getSession()`) tarda o falla y React Native muestra "Network request failed".  
   - Arranca de nuevo la app y tira hacia abajo para refrescar.  
   - Si usas VPN, desactívala un momento para descartar que corte la conexión.

**Qué revisar en el proyecto**

- **Prioridad:** si existen en `app.config.js` → `extra`, **ganan** sobre `.env`. Evita duplicar con valores distintos.
- **.env:** `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Reinicia con `npx expo start -c` tras cambios.

**Resumen**

| Situación              | Qué hacer                                                                 |
|------------------------|---------------------------------------------------------------------------|
| Celular sin WiFi/datos | Activar internet y volver a intentar                                      |
| URL era localhost      | Poner la URL de Supabase en la nube en `app.config.js` (extra) y/o `.env` |
| Red rara / VPN         | Probar con datos o otra red; quitar VPN                                  |
| Sigue fallando         | Probar en simulador (mismo Mac) para ver si es solo en el dispositivo     |

**Última actualización:** marzo 2026
