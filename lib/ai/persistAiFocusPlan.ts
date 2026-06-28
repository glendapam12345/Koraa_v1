import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';

/** Aplica el plan de foco de la IA: prioridades + fecha hoy en sueltas. */
export async function persistAiFocusPlanToDb(
  userId: string,
  focusTaskIds: string[],
): Promise<boolean> {
  if (focusTaskIds.length === 0) return false;

  const today = getLocalDateString();

  const { error: clearError } = await supabase
    .from('tasks')
    .update({ is_priority: false })
    .eq('user_id', userId)
    .eq('is_completed', false);

  if (clearError) {
    logger.error('Error limpiando prioridades:', clearError);
    return false;
  }

  const { error: prioritizeError } = await supabase
    .from('tasks')
    .update({ is_priority: true })
    .eq('user_id', userId)
    .in('id', focusTaskIds);

  if (prioritizeError) {
    logger.error('Error aplicando plan IA:', prioritizeError);
    return false;
  }

  const { data: unscheduled } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .in('id', focusTaskIds)
    .is('scheduled_date', null);

  const unscheduledIds = (unscheduled ?? []).map((row) => row.id as string);
  if (unscheduledIds.length > 0) {
    await supabase
      .from('tasks')
      .update({ scheduled_date: today })
      .eq('user_id', userId)
      .in('id', unscheduledIds);
  }

  return true;
}
