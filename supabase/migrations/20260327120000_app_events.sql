/*
  # Eventos de producto (Fase D — medición)

  Tabla append-only para analítica con RLS: cada usuario solo inserta y lee sus filas.
  Sin PII en propiedades: la app no debe enviar emails ni texto de tareas en `properties`.

  Tras aplicar en Supabase: los inserts desde el cliente (anon) funcionan con sesión.
*/

CREATE TABLE IF NOT EXISTS app_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_events_user_created_idx
  ON app_events (user_id, created_at DESC);

ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own app_events"
  ON app_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own app_events"
  ON app_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE app_events IS 'Eventos de analítica (Koraa); sin datos personales en properties.';
