import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { isLooseCompletedWithinRetention } from '@/lib/looseCompletedRetentionPolicy';

/**
 * Elimina tareas sueltas completadas cuyo plazo de retención ya venció.
 * Incluye subtareas de esas tareas raíz.
 */
export async function purgeExpiredLooseCompletedTasks(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, completed_at, created_at')
    .eq('user_id', userId)
    .is('project_id', null)
    .is('parent_task_id', null)
    .eq('is_completed', true);

  if (error) {
    logger.error('purgeExpiredLooseCompletedTasks:', error);
    return 0;
  }

  const expiredIds = (data ?? [])
    .filter((row) =>
      !isLooseCompletedWithinRetention({
        completed_at: row.completed_at as string | null,
        created_at: String(row.created_at),
      }),
    )
    .map((row) => String(row.id));

  if (expiredIds.length === 0) return 0;

  const { error: subtasksError } = await supabase
    .from('tasks')
    .delete()
    .in('parent_task_id', expiredIds);

  if (subtasksError) {
    logger.error('purgeExpiredLooseCompletedTasks subtasks:', subtasksError);
    return 0;
  }

  const { error: deleteError } = await supabase.from('tasks').delete().in('id', expiredIds);

  if (deleteError) {
    logger.error('purgeExpiredLooseCompletedTasks delete:', deleteError);
    return 0;
  }

  return expiredIds.length;
}
