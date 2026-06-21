-- Área de vida (frente) para cada proyecto: koraa, impermanence, marathon, personal, other
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS life_area_key text;

COMMENT ON COLUMN projects.life_area_key IS
  'Clave del frente/área de vida (koraa, impermanence, marathon, personal, other).';
