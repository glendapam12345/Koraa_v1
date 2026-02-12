/*
  # Add Projects and Weekly Scheduling Support
  
  INSTRUCCIONES:
  1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
  2. Selecciona tu proyecto
  3. Ve a "SQL Editor" en el menú lateral
  4. Copia y pega todo este contenido
  5. Haz clic en "Run" o presiona Cmd/Ctrl + Enter
  
  Esta migración crea:
  - Tabla `projects` para organizar tareas por proyectos
  - Columnas `project_id` y `scheduled_date` en la tabla `tasks`
  - Políticas de seguridad (RLS) para la tabla `projects`
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#4A90E2', -- Default blue color
  icon text, -- Optional icon identifier
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1-10 scale, higher = more priority
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name) -- Each user can only have one project with the same name
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add project_id to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

-- Add scheduled_date to tasks (for weekly distribution)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS scheduled_date date;

-- Add project_priority to tasks (for within-project prioritization)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS project_priority integer DEFAULT 5 CHECK (project_priority >= 1 AND project_priority <= 10);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_date, is_completed) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project_priority ON tasks(project_id, project_priority DESC, is_completed);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at for projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
