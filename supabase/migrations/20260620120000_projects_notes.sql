ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.projects.notes IS 'Notas libres del proyecto (contexto, links, recordatorios).';
