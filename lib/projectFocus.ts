import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { prioritizeTasksIntelligently } from '@/lib/smartPrioritization';
import { setFocusedProjectId } from '@/lib/focusedProjectStorage';
import type { AppLocale } from '@/lib/i18n';
import type { Task } from '@/components/tasks/TaskCard';

const DEFAULT_CHECK_IN = {
  energyLevel: 3,
  emotion: 'tranquila',
  availableTime: 'Medio (2-4hrs)',
  focusLevel: 'Normal',
};

export type FocusProjectResult =
  | { ok: true; prioritizedCount: number; projectName: string }
  | { ok: false; reason: 'no_tasks' | 'no_user' | 'db_error' };

/**
 * Prioriza pasos del proyecto con el algoritmo de check-in y los lleva a Tareas/Hoy.
 */
export async function focusProjectForToday({
  userId,
  projectId,
  projectName,
  locale,
}: {
  userId: string;
  projectId: string;
  projectName: string;
  locale: AppLocale;
}): Promise<FocusProjectResult> {
  if (!userId) return { ok: false, reason: 'no_user' };

  const today = getLocalDateString();
  const { data: checkIn } = await supabase
    .from('daily_check_ins')
    .select('emotion, energy_level, available_time, focus_level')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const checkInData = {
    energyLevel: checkIn?.energy_level ?? DEFAULT_CHECK_IN.energyLevel,
    emotion: (checkIn?.emotion as string) ?? DEFAULT_CHECK_IN.emotion,
    availableTime: (checkIn?.available_time as string) ?? DEFAULT_CHECK_IN.availableTime,
    focusLevel: (checkIn?.focus_level as string) ?? DEFAULT_CHECK_IN.focusLevel,
  };

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('is_completed', false)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false });

  if (tasksError) return { ok: false, reason: 'db_error' };
  if (!tasks?.length) return { ok: false, reason: 'no_tasks' };

  const tasksMap = new Map<string, Task & { subtasks: Task[] }>();
  const mainTasks: Array<Task & { subtasks: Task[] }> = [];

  tasks.forEach((task: Task) => {
    const row = { ...task, subtasks: [] as Task[] };
    tasksMap.set(task.id, row);
    mainTasks.push(row);
  });

  const { data: subtasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .not('parent_task_id', 'is', null);

  (subtasks ?? []).forEach((task: Task) => {
    if (task.parent_task_id) {
      const parent = tasksMap.get(task.parent_task_id);
      const child = tasksMap.get(task.id);
      if (parent && child) parent.subtasks.push(child);
    }
  });

  const prioritized = prioritizeTasksIntelligently(mainTasks, checkInData, locale);

  const { error: clearError } = await supabase
    .from('tasks')
    .update({ is_priority: false })
    .eq('user_id', userId)
    .eq('is_completed', false);

  if (clearError) return { ok: false, reason: 'db_error' };

  if (prioritized.length > 0) {
    const ids = prioritized.map((t) => t.id);
    const { error: setError } = await supabase
      .from('tasks')
      .update({ is_priority: true })
      .in('id', ids);

    if (setError) return { ok: false, reason: 'db_error' };
  }

  await setFocusedProjectId(userId, projectId);

  return {
    ok: true,
    prioritizedCount: prioritized.length,
    projectName,
  };
}
