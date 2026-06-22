import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';

export async function setTaskPriorityFlag(
  taskId: string,
  isPriority: boolean,
): Promise<{ ok: true; scheduledDate: string } | { ok: false; error: string }> {
  const today = getLocalDateString();
  const { error } = await supabase
    .from('tasks')
    .update({
      is_priority: isPriority,
      scheduled_date: today,
    })
    .eq('id', taskId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, scheduledDate: today };
}
