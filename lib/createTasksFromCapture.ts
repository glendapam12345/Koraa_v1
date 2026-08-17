import { supabase, getCachedAuthUser } from '@/lib/supabase';
import { requestHoyRefresh } from '@/lib/hoyRefreshBridge';
import { detectCategory } from '@/lib/categoryDetection';
import { prioritizeTasksForCheckIn } from '@/lib/checkInService';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';
import { track } from '@/lib/analytics';
import type { AppLocale } from '@/lib/i18n';
import { setTaskEffort } from '@/lib/taskPerceivedEffort';
import type { TaskCaptureResult } from '@/lib/taskCaptureTypes';

export type CreateTasksFromCaptureResult =
  | {
      status: 'success';
      tasksCreated: number;
      savedTitle: string;
      reprioritized: boolean;
    }
  | { status: 'not_authenticated' }
  | { status: 'error' };

export async function createTasksFromCapture(
  capture: TaskCaptureResult,
  options: {
    locale: AppLocale;
    hasCheckInToday: boolean;
    projectId?: string | null;
    defaultCategory?: string;
    defaultEffort?: 'light' | 'medium' | 'heavy' | null;
  },
): Promise<CreateTasksFromCaptureResult> {
  const user = await getCachedAuthUser();
  if (!user) return { status: 'not_authenticated' };

  const rows = [capture.main_task, ...capture.prep_steps].filter((t) => t.content.trim());
  if (rows.length === 0) return { status: 'error' };

  const inserts = rows.map((row) => {
    const content = row.content.trim();
    const category =
      options.projectId != null
        ? detectCategory(content) || 'otros'
        : (options.defaultCategory ?? detectCategory(content)) || 'otros';
    return {
      payload: {
        user_id: user.id,
        content,
        category,
        is_priority: false,
        is_completed: false,
        parent_task_id: null,
        project_id: options.projectId ?? null,
        scheduled_date: row.scheduled_date,
      },
      effort: row.effort ?? options.defaultEffort ?? null,
    };
  });

  const { data, error } = await supabase
    .from('tasks')
    .insert(inserts.map((entry) => entry.payload))
    .select('id');

  if (error || !data?.length) {
    logger.error('Error guardando tarea desde captura IA:', error);
    return { status: 'error' };
  }

  const insertedIds = data.map((row) => row.id);
  void Promise.all(
    insertedIds.map((id, index) => {
      const effort = inserts[index]?.effort;
      return effort ? setTaskEffort(id, effort) : Promise.resolve();
    }),
  );

  void track('task_created', {
    priority: false,
    has_project: false,
    has_date: Boolean(capture.main_task.scheduled_date),
    has_subtasks: capture.prep_steps.length > 0,
    ai_capture: capture.fromAi,
    batch_count: rows.length,
  });

  if (options.hasCheckInToday) {
    void (async () => {
      try {
        const today = getLocalDateString();
        const { data: checkIn, error } = await supabase
          .from('daily_check_ins')
          .select('emotion, energy_level, available_time, focus_level')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (!error && checkIn) {
          await prioritizeTasksForCheckIn(user.id, {
            energyLevel: checkIn.energy_level,
            emotion: checkIn.emotion,
            availableTime: checkIn.available_time,
            focusLevel: checkIn.focus_level,
            locale: options.locale,
          });
          requestHoyRefresh();
        }
      } catch (reprioritizeError) {
        logger.error('Error repriorizando tras captura IA:', reprioritizeError);
      }
    })();
  }

  return {
    status: 'success',
    tasksCreated: insertedIds.length,
    savedTitle: capture.main_task.content,
    reprioritized: false,
  };
}
