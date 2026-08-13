import { getNextLocalDateString } from '@/lib/dateLocal';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

export async function postponeTaskFromToday(
  taskId: string,
): Promise<{ ok: true; scheduledDate: string } | { ok: false; error: string }> {
  const scheduledDate = getNextLocalDateString();
  const { error } = await supabase
    .from('tasks')
    .update({
      is_priority: false,
      scheduled_date: scheduledDate,
    })
    .eq('id', taskId);

  if (error) {
    return { ok: false, error: error.message };
  }

  void track('task_postponed', { to_tomorrow: true });
  return { ok: true, scheduledDate };
}
