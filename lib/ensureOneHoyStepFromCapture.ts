import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { isTaskSuggestedForToday } from '@/lib/hoyFocusTasks';
import { logger } from '@/lib/logger';
import { pickLightestOpenTask } from '@/lib/pickLightestOpenTask';

/**
 * Garantiza un paso sugerido en Hoy tras la captura de onboarding.
 * Si ya hay uno, no toca el resto (anti-presión).
 */
export async function ensureOneHoyStepFromCapture(
  userId: string,
  today: string = getLocalDateString(),
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, content, is_completed, is_priority, scheduled_date, parent_task_id')
      .eq('user_id', userId)
      .eq('is_completed', false);

    if (error || !data) {
      if (error) logger.debug('ensureOneHoyStepFromCapture: load failed', error.message);
      return null;
    }

    const already = data.find(
      (task) =>
        !task.parent_task_id &&
        isTaskSuggestedForToday(
          { scheduled_date: task.scheduled_date, is_priority: Boolean(task.is_priority) },
          today,
        ),
    );
    if (already) return already.id;

    const picked = pickLightestOpenTask(data);
    if (!picked) return null;

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ is_priority: true, scheduled_date: today })
      .eq('id', picked.id)
      .eq('user_id', userId);

    if (updateError) {
      logger.debug('ensureOneHoyStepFromCapture: update failed', updateError.message);
      return null;
    }
    return picked.id;
  } catch (err) {
    logger.debug('ensureOneHoyStepFromCapture: unexpected', String(err));
    return null;
  }
}

/**
 * Desde Hoy “Añadir un paso”: ese ítem entra al plan de hoy, aunque ya hubiera otro.
 */
export async function promoteTaskIdsToHoy(
  userId: string,
  taskIds: string[],
  today: string = getLocalDateString(),
): Promise<string | null> {
  const id = taskIds.find((value) => value.trim().length > 0) ?? null;
  if (!id) return null;

  try {
    const { error } = await supabase
      .from('tasks')
      .update({ is_priority: true, scheduled_date: today })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.debug('promoteTaskIdsToHoy: update failed', error.message);
      return null;
    }
    return id;
  } catch (err) {
    logger.debug('promoteTaskIdsToHoy: unexpected', String(err));
    return null;
  }
}
