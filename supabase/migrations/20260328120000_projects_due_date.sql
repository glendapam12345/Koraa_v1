-- Fecha de entrega opcional por proyecto (redistribución de carga hasta ese día).
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS due_date date;

COMMENT ON COLUMN public.projects.due_date IS 'Fecha límite del proyecto (presentación, entrega). Koraa puede repartir tareas hasta este día.';
