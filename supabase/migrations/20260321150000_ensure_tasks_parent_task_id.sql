-- Si la BD remota no aplicó migraciones antiguas, asegura subtareas en `tasks`.
-- Idempotente (igual que 20260210000228_add_subtasks_support.sql).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id);

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS check_no_self_reference;

ALTER TABLE public.tasks
  ADD CONSTRAINT check_no_self_reference
  CHECK (parent_task_id IS NULL OR parent_task_id != id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_parent_priority
  ON public.tasks(user_id, parent_task_id, is_priority, is_completed, created_at DESC);
