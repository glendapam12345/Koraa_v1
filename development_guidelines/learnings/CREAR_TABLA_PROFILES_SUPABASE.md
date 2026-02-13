# Crear Tabla Profiles en Supabase

## Problema

Error al crear un nuevo perfil: `"Could not find the table 'public.profiles' in the schema cache"`

Esto significa que la tabla `profiles` no existe en tu base de datos de Supabase.

## Solución: Ejecutar Migraciones en Supabase

### Paso 1: Abre Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto Kora

### Paso 2: Abre SQL Editor

1. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"** (Nueva consulta)

### Paso 3: Ejecuta el Script SQL

Copia y pega el siguiente SQL completo en el editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create daily_check_ins table
CREATE TABLE IF NOT EXISTS daily_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  emotion text NOT NULL,
  energy_level int NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
  available_time text NOT NULL,
  focus_level text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins"
  ON daily_check_ins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON daily_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON daily_check_ins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins"
  ON daily_check_ins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  category text DEFAULT '',
  is_completed boolean DEFAULT false,
  is_priority boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date ON daily_check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, is_completed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, is_priority, created_at DESC);
```

### Paso 4: Ejecuta el Script

1. Haz clic en el botón **"Run"** (Ejecutar) o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)
2. Deberías ver un mensaje de éxito: `Success. No rows returned`

### Paso 5: Verifica que las Tablas se Crearon

1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver las tablas:
   - `profiles`
   - `daily_check_ins`
   - `tasks`

## Verificación

Después de ejecutar el script:

1. Intenta crear un nuevo perfil en la app
2. El error debería desaparecer
3. Deberías poder registrarte correctamente

## Notas

- El script usa `CREATE TABLE IF NOT EXISTS`, así que es seguro ejecutarlo múltiples veces
- Las políticas de Row Level Security (RLS) están habilitadas para proteger los datos de los usuarios
- Todas las tablas están vinculadas a `auth.users` para autenticación

## Si Aún Tienes Problemas

1. Verifica que estás conectado al proyecto correcto de Supabase
2. Revisa que las credenciales en tu `.env` sean correctas:
   ```
   EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```
3. Reinicia el servidor de desarrollo después de crear las tablas
