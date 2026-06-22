-- Loose tasks can belong to a life area without a project.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS life_area_key text;

COMMENT ON COLUMN public.tasks.life_area_key IS
  'Optional life area for tasks without project_id (e.g. health, custom:uuid).';

CREATE INDEX IF NOT EXISTS idx_tasks_loose_life_area
  ON public.tasks(user_id, life_area_key)
  WHERE project_id IS NULL AND parent_task_id IS NULL;
