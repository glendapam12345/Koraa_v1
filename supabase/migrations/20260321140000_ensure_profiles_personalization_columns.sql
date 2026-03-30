-- Asegura columnas de personalización en profiles (recomendaciones).
-- Si la BD remota no aplicó migraciones antiguas, este script es idempotente.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS favorite_activities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS other_preferences jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.age IS 'User age for personalized recommendations';
COMMENT ON COLUMN public.profiles.favorite_activities IS 'Favorite activities for recommendations';
COMMENT ON COLUMN public.profiles.interests IS 'Interests for recommendations';
COMMENT ON COLUMN public.profiles.other_preferences IS 'Additional preferences (JSON)';
