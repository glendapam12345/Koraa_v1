import { supabase } from '@/lib/supabase';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import type { Task } from '@/hooks/useTasks';

export type RedistributeCheckInSnapshot = {
  energyLevel: number;
  availableTime: string;
  emotion: string;
};

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    content: String(row.content ?? ''),
    is_completed: Boolean(row.is_completed),
    is_priority: Boolean(row.is_priority),
    category: String(row.category ?? ''),
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
    parent_task_id: (row.parent_task_id as string | null | undefined) ?? null,
    project_id: (row.project_id as string | null | undefined) ?? null,
    scheduled_date: normalizeScheduledDate(row.scheduled_date as string | null | undefined),
    life_area_key: (row.life_area_key as string | null | undefined) ?? null,
  };
}

export async function fetchRedistributeContext(userId: string): Promise<{
  tasks: Task[];
  checkIn: RedistributeCheckInSnapshot;
}> {
  const today = getLocalDateString();

  const [tasksResult, checkInResult] = await Promise.all([
    supabase
      .from('tasks')
      .select(
        'id, content, is_completed, is_priority, category, completed_at, created_at, parent_task_id, project_id, scheduled_date, life_area_key',
      )
      .eq('user_id', userId)
      .eq('is_completed', false)
      .is('parent_task_id', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_check_ins')
      .select('energy_level, available_time, emotion')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle(),
  ]);

  const tasks = (tasksResult.data ?? []).map((row) => rowToTask(row as Record<string, unknown>));
  const checkInRow = checkInResult.data;

  return {
    tasks,
    checkIn: {
      energyLevel: checkInRow?.energy_level ?? 0,
      availableTime: checkInRow?.available_time ?? '',
      emotion: checkInRow?.emotion ?? '',
    },
  };
}
