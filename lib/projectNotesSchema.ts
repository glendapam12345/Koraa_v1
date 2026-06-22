/** Detecta si Supabase/PostgREST no tiene la columna `projects.notes`. */
export function isMissingProjectNotesColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code || '') : '';
  const msg = ('message' in error ? String(error.message || '') : '').toLowerCase();
  if (code === 'PGRST204' && msg.includes('notes')) return true;
  return (
    msg.includes('projects.notes') ||
    (msg.includes('notes') &&
      (msg.includes('schema cache') ||
        msg.includes('does not exist') ||
        msg.includes('no existe') ||
        msg.includes('could not find')))
  );
}
