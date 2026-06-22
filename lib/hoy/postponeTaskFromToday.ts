import { getNextLocalDateString } from '@/lib/dateLocal';
import { supabase } from '@/lib/supabase';

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

  return { ok: true, scheduledDate };
}
