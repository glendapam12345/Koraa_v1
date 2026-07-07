import { supabase } from '@/lib/supabase';

/** ¿El usuario ya capturó al menos un paso hoy? */
export async function hasCapturedTasksToday(userId: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString());

  if (error) return false;
  return (count ?? 0) > 0;
}

export function getNextTaskCaptureTriggerDate(hour: number, minute: number): Date {
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= new Date()) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger;
}
