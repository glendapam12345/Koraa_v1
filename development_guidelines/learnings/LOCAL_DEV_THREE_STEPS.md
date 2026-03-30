# Los 3 pasos para que Koraa funcione en local

**Propósito:** Checklist mínimo técnico (env, base de datos, caché de Metro).

## 1. Archivo `.env` con Supabase

- Si no tienes `.env`: `npm run env:bootstrap` (copia desde `.env.example`).
- Rellena **del mismo proyecto** en [Supabase Dashboard](https://supabase.com/dashboard) → **Settings → API**:
  - `EXPO_PUBLIC_SUPABASE_URL` = Project URL
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = clave **anon public** (no `service_role`).

Comprueba red y API:

```bash
npm run check:supabase
```

## 2. Migraciones en la base remota

La app asume tablas y columnas definidas en `supabase/migrations/`.

### En el dashboard (mismo proyecto que tu `.env`)

1. Abre [supabase.com/dashboard](https://supabase.com/dashboard) → tu proyecto.
2. Menú izquierdo **SQL Editor** → **New query**.
3. En tu Mac, abre el archivo `.sql` del repo (ruta `supabase/migrations/…`).
4. Copia **todo** el contenido, pégalo en el editor y pulsa **Run** (o Cmd+Enter).
5. Repite para el siguiente archivo del orden que te imprime el comando de abajo.

**Importante:** no ejecutes los archivos en orden alfabético: el que empieza por `202501…` debe ir **después** de crear `profiles` (el primer archivo real es `20260104210311_create_kora_schema.sql`).

Lista numerada y notas:

```bash
npm run check:supabase:migrations
```

Auth (Site URL, email de confirmación): [SUPABASE_SCHEMA_AND_MIGRATIONS.md](./SUPABASE_SCHEMA_AND_MIGRATIONS.md).

## 3. Reiniciar Metro tras cambiar `.env`

Expo/Metro **cachea** variables; si cambias `.env` sin reiniciar, la app puede seguir con URL o clave vieja.

```bash
npm run dev:clear
```

## Todo en una línea (después de tener `.env` rellenado)

```bash
npm run verify:local && npm run dev:clear
```

**Fecha:** marzo 2026
