# Ver la app actualizada rápido (sin depender de Bolt)

**Situación:** El código en Cursor y en GitHub está bien. Lo que ves en Bolt o en el celular a veces es una versión vieja por caché o porque Bolt no ha actualizado.

**Solución más simple:** Correr la app en **tu Mac** con Cursor. Así ves siempre la última versión.

---

## En 3 pasos (en Cursor)

### 1. Abre la terminal en Cursor
- Menú **Terminal** → **New Terminal**, o atajo `` Ctrl+` ``

### 2. Ejecuta:
```bash
cd /Users/glendapamelaramirezgarcia/Desktop/Github/Koraa_v1-1
npm run dev
```

### 3. Cuando arranque Metro:
- Pulsa **`i`** para abrir el simulador de iOS, **o**
- Pulsa **`a`** para Android, **o**
- Escanea el **código QR** con Expo Go en tu celular (mismo WiFi que el Mac)

Ahí verás la app con todos los cambios: Semana nueva, recomendaciones en scroll horizontal, etc.

---

## Si prefieres seguir usando Bolt

1. En Bolt, cuando salga el aviso → **"Update codebase with external changes"**.
2. **"Start application"**.
3. En el celular: **cierra Expo Go por completo** y ábrela de nuevo; escanea el QR de Bolt.

Si aun así ves la versión vieja, usa los 3 pasos de arriba (correr en Cursor) para trabajar sin depender del caché de Bolt.

---

**Última actualización:** febrero 2026
