/** Detecta si Supabase no tiene `projects.life_area_key` (migración pendiente). */
export function isMissingProjectLifeAreaKeyColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const code = 'code' in error ? String(error.code || '') : '';
  const msg = ('message' in error ? String(error.message || '') : '').toLowerCase();

  if (code === 'PGRST204' && msg.includes('life_area_key') && msg.includes('projects')) {
    return true;
  }

  return (
    msg.includes('projects.life_area_key') ||
    (msg.includes('life_area_key') &&
      msg.includes('projects') &&
      (msg.includes('schema cache') ||
        msg.includes('does not exist') ||
        msg.includes('no existe') ||
        msg.includes('could not find')))
  );
}

/** Detecta si Supabase no tiene `tasks.life_area_key` (migración pendiente). */
export function isMissingTaskLifeAreaKeyColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const code = 'code' in error ? String(error.code || '') : '';
  const msg = ('message' in error ? String(error.message || '') : '').toLowerCase();

  if (code === 'PGRST204' && msg.includes('life_area_key') && msg.includes('tasks')) {
    return true;
  }

  return (
    msg.includes('tasks.life_area_key') ||
    (msg.includes('life_area_key') &&
      msg.includes('tasks') &&
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
