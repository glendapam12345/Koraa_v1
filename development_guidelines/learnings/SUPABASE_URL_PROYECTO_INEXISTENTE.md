# Cuando la URL de Supabase no existe (Network request failed)

**Síntoma:** En la app aparece "Sin conexión con el servidor" o en terminal `Supabase no alcanzable` / `Network request failed`.

**Causa frecuente:** El valor de `EXPO_PUBLIC_SUPABASE_URL` apunta a un proyecto que **ya no existe** (borrado) o la URL está **mal copiada**. Ese subdominio no resuelve en DNS → ningún dispositivo puede conectar.

## Cómo comprobarlo en tu Mac

```bash
npm run check:supabase
```

- Si dice que el dominio **no existe en DNS**, hay que actualizar `.env`.

## Cómo arreglarlo

1. [Supabase Dashboard](https://supabase.com/dashboard) → el proyecto que quieras usar (o **New project**).
2. **Settings** → **API**.
3. Copia **Project URL** y **anon public** key.
4. Pega en `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

5. La URL y la key deben ser del **mismo** proyecto (el `ref` dentro del JWT debe coincidir con el subdominio).
6. `npm run check:supabase` debería mostrar ✅.
7. `npx expo start -c` y volver a abrir Expo Go.

**Proyecto nuevo:** vuelve a ejecutar las migraciones SQL de `supabase/migrations/` en el SQL Editor del nuevo proyecto.

**Fecha:** marzo 2026
