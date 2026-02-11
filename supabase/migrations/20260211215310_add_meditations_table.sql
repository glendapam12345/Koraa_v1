/*
  # Tabla de Meditaciones

  1. Nueva Tabla
    - `meditations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key a auth.users)
      - `date` (date) - Fecha de la meditación
      - `type` (text) - Tipo: 'morning' o 'evening'
      - `completed_at` (timestamptz) - Timestamp de completado
      - `created_at` (timestamptz) - Timestamp de creación

  2. Seguridad
    - Enable RLS en `meditations`
    - Políticas para usuarios autenticados puedan ver/crear sus propias meditaciones

  3. Índices
    - Índice en (user_id, date) para consultas rápidas
    - Índice en user_id para foreign key

  4. Notas
    - Los usuarios pueden completar una meditación matutina y una nocturna por día
    - Constraint único en (user_id, date, type) para evitar duplicados
*/

-- Crear tabla de meditaciones
CREATE TABLE IF NOT EXISTS meditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('morning', 'evening')),
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_meditation_per_day UNIQUE (user_id, date, type)
);

-- Habilitar RLS
ALTER TABLE meditations ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Users can view own meditations"
  ON meditations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para INSERT
CREATE POLICY "Users can create own meditations"
  ON meditations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE
CREATE POLICY "Users can update own meditations"
  ON meditations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE
CREATE POLICY "Users can delete own meditations"
  ON meditations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_meditations_user_date ON meditations(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meditations_user_id ON meditations(user_id);

-- Comentarios
COMMENT ON TABLE meditations IS 'Registro de meditaciones completadas por usuarios';
COMMENT ON COLUMN meditations.type IS 'Tipo de meditación: morning (inicio del día) o evening (fin del día)';
