/** Detecta si Supabase no tiene `projects.life_area_key` (migración pendiente). */
export function isMissingProjectLifeAreaKeyColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const code = 'code' in error ? String(error.code || '') : '';
  const msg = ('message' in error ? String(error.message || '') : '').toLowerCase();

  if (code === 'PGRST204' && msg.includes('life_area_key')) return true;

  return (
    msg.includes('projects.life_area_key') ||
    (msg.includes('life_area_key') &&
      (msg.includes('schema cache') ||
        msg.includes('does not exist') ||
        msg.includes('no existe') ||
        msg.includes('could not find')))
  );
}

export type ProjectExtendedFields = {
  life_area_key: string | null;
  icon: string | null;
  priority: number;
};
