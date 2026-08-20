import { supabase, isNetworkError, getSchemaSetupMessage, getCachedAuthUser } from '@/lib/supabase';
import { requestHoyRefresh } from '@/lib/hoyRefreshBridge';
import { logger } from '@/lib/logger';
import { detectCategory } from '@/lib/categoryDetection';
import { prioritizeTasksForCheckIn } from '@/lib/checkInService';
import { getLocalDateString } from '@/lib/dateLocal';
import { track } from '@/lib/analytics';
import type { AppLocale } from '@/lib/i18n';
import {
  validateVaciarTaskDraft,
  type VaciarTaskDraft,
  type VaciarValidationCode,
} from '@/lib/vaciarTaskValidation';
import { isMissingTaskLifeAreaKeyColumnError } from '@/lib/projectLifeAreaSchema';
import { TimeoutError, withTimeout } from '@/lib/withTimeout';

const TASK_INSERT_TIMEOUT_MS = 12_000;

async function insertMainTaskRow(
  payload: Record<string, unknown>,
): Promise<{ data: { id: string } | null; error: unknown }> {
  const request = supabase.from('tasks').insert(payload).select('id').single();
  try {
    return await withTimeout(
      request as unknown as Promise<{ data: { id: string } | null; error: unknown }>,
      TASK_INSERT_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return { data: null, error: { message: 'timeout', code: 'TIMEOUT' } };
    }
    throw error;
  }
}

function isLifeAreaKeyInsertError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = ('message' in error ? String(error.message || '') : '').toLowerCase();
  return msg.includes('life_area_key') || msg.includes('life area');
}

export { validateVaciarTaskDraft, type VaciarTaskDraft, type VaciarValidationCode };

export type VaciarCreateTaskResult =
  | {
      status: 'success' | 'offline' | 'partial';
      savedTitle: string;
      savedScheduledDate: string | null;
      subtaskCount: number;
      reprioritized: boolean;
      projectId: string | null;
      hasSubtasks: boolean;
      taskId?: string;
    }
  | { status: 'not_authenticated' }
  | { status: 'error' };

function trackTaskCreated(args: {
  priority: boolean;
  projectId: string | null;
  scheduledDate: string | null;
  hasSubtasks: boolean;
  offline?: boolean;
}) {
  void track('task_created', {
    priority: args.priority,
    has_project: Boolean(args.projectId),
    has_date: Boolean(args.scheduledDate),
    has_subtasks: args.hasSubtasks,
    ...(args.offline !== undefined ? { offline: args.offline } : {}),
  });
}

export async function reprioritizeAfterTaskSave(userId: string, locale: AppLocale): Promise<boolean> {
  const today = getLocalDateString();
  const { data: checkIn, error } = await supabase
    .from('daily_check_ins')
    .select('emotion, energy_level, available_time, focus_level')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (error || !checkIn) return false;

  await prioritizeTasksForCheckIn(userId, {
    energyLevel: checkIn.energy_level,
    emotion: checkIn.emotion,
    availableTime: checkIn.available_time,
    focusLevel: checkIn.focus_level,
    locale,
  });
  return true;
}

export async function createVaciarTask(
  draft: VaciarTaskDraft,
  options: { locale: AppLocale; hasCheckInToday: boolean; skipReprioritize?: boolean },
): Promise<VaciarCreateTaskResult> {
  const user = await getCachedAuthUser();
  if (!user) return { status: 'not_authenticated' };

  const trimmed = draft.content.trim().slice(0, 300);
  const categoryToSave =
    draft.selectedCategory?.trim()
      ? draft.selectedCategory.trim()
      : detectCategory(trimmed) || 'otros';
  const projectIdToSave = draft.assignToProject === true ? draft.selectedProjectId : null;
  const lifeAreaKeyToSave =
    projectIdToSave == null && draft.lifeAreaKey ? draft.lifeAreaKey : null;
  const validSubtasks = draft.hasSubtasks ? draft.subtasks.filter((st) => st.trim()) : [];
  const subtaskCount = validSubtasks.length;

  const baseInsert = {
    user_id: user.id,
    content: trimmed,
    category: categoryToSave,
    is_priority: draft.isPriority ?? false,
    is_completed: false,
    parent_task_id: null,
    project_id: projectIdToSave,
    scheduled_date: draft.selectedDate,
  };

  const insertPayload =
    lifeAreaKeyToSave != null
      ? { ...baseInsert, life_area_key: lifeAreaKeyToSave }
      : baseInsert;

  let { data: mainTask, error: mainTaskError } = await insertMainTaskRow(insertPayload);

  if (mainTaskError && lifeAreaKeyToSave && isLifeAreaKeyInsertError(mainTaskError)) {
    logger.warn('[vaciar] Reintentando guardado sin life_area_key:', mainTaskError);
    ({ data: mainTask, error: mainTaskError } = await insertMainTaskRow(baseInsert));
  }

  if (
    mainTaskError &&
    lifeAreaKeyToSave &&
    isMissingTaskLifeAreaKeyColumnError(mainTaskError)
  ) {
    logger.warn(
      '[vaciar] tasks.life_area_key no existe en Supabase — guardando sin área. Aplica la migración 20260621120000_tasks_life_area_key.sql',
    );
    ({ data: mainTask, error: mainTaskError } = await insertMainTaskRow(baseInsert));
  }

  if (mainTaskError) {
    if (isNetworkError(mainTaskError)) {
      const { saveTaskOffline } = await import('@/lib/offlineStorage');
      const mainTaskId = await saveTaskOffline({
        content: trimmed,
        category: categoryToSave,
        is_priority: draft.isPriority ?? false,
        is_completed: false,
        parent_task_id: null,
        project_id: projectIdToSave,
        scheduled_date: draft.selectedDate,
      });

      for (const subtask of validSubtasks) {
        const stCat = detectCategory(subtask.trim()) || categoryToSave;
        await saveTaskOffline({
          content: subtask.trim(),
          category: stCat,
          is_priority: draft.isPriority ?? false,
          is_completed: false,
          parent_task_id: mainTaskId,
          project_id: projectIdToSave,
        });
      }

      trackTaskCreated({
        priority: Boolean(draft.isPriority),
        projectId: projectIdToSave,
        scheduledDate: draft.selectedDate,
        hasSubtasks: subtaskCount > 0,
        offline: true,
      });

      return {
        status: 'offline',
        savedTitle: trimmed,
        savedScheduledDate: draft.selectedDate,
        subtaskCount,
        reprioritized: false,
        projectId: projectIdToSave,
        hasSubtasks: draft.hasSubtasks,
        taskId: mainTaskId,
      };
    }

    const schemaType = getSchemaSetupMessage(mainTaskError);
    const isProjectOrScheduledSchema = schemaType === 'project_id' || schemaType === 'scheduled_date';
    if (isProjectOrScheduledSchema) {
      const { data: fallbackTask, error: fallbackError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          content: trimmed,
          category: categoryToSave,
          is_priority: draft.isPriority ?? false,
          is_completed: false,
          parent_task_id: null,
        })
        .select('id')
        .single();

      if (fallbackError) {
        logger.error('Error guardando tarea (fallback):', fallbackError);
        return { status: 'error' };
      }

      if (draft.hasSubtasks && fallbackTask) {
        const subtasksToInsert = validSubtasks.map((subtask) => ({
          user_id: user.id,
          content: subtask.trim(),
          category: detectCategory(subtask.trim()),
          is_priority: draft.isPriority ?? false,
          is_completed: false,
          parent_task_id: fallbackTask.id,
        }));
        await supabase.from('tasks').insert(subtasksToInsert);
      }

      trackTaskCreated({
        priority: Boolean(draft.isPriority),
        projectId: projectIdToSave,
        scheduledDate: draft.selectedDate,
        hasSubtasks: subtaskCount > 0,
      });

      return {
        status: 'partial',
        savedTitle: trimmed,
        savedScheduledDate: draft.selectedDate,
        subtaskCount,
        reprioritized: false,
        projectId: projectIdToSave,
        hasSubtasks: draft.hasSubtasks,
        taskId: fallbackTask?.id,
      };
    }

    logger.error('Error guardando tarea principal:', mainTaskError);
    return { status: 'error' };
  }

  if (draft.hasSubtasks && mainTask && validSubtasks.length > 0) {
    const subtasksToInsert = validSubtasks.map((subtask) => ({
      user_id: user.id,
      content: subtask.trim(),
      category: detectCategory(subtask.trim()) || categoryToSave,
      is_priority: draft.isPriority ?? false,
      is_completed: false,
      parent_task_id: mainTask.id,
      project_id: projectIdToSave,
      scheduled_date: draft.selectedDate,
    }));

    const { error: subtasksError } = await supabase.from('tasks').insert(subtasksToInsert);

    if (subtasksError) {
      logger.error('Error guardando subtareas:', subtasksError);
      await supabase.from('tasks').delete().eq('id', mainTask.id);
      return { status: 'error' };
    }
  }

  trackTaskCreated({
    priority: Boolean(draft.isPriority),
    projectId: projectIdToSave,
    scheduledDate: draft.selectedDate,
    hasSubtasks: subtaskCount > 0,
  });

  if (options.hasCheckInToday && !draft.isPriority && !options.skipReprioritize) {
    void reprioritizeAfterTaskSave(user.id, options.locale)
      .then((did) => {
        if (did) requestHoyRefresh();
      })
      .catch((reprioritizeError) => {
        logger.error('Error repriorizando tras guardar tarea:', reprioritizeError);
      });
  }

  return {
    status: 'success',
    savedTitle: trimmed,
    savedScheduledDate: draft.selectedDate,
    subtaskCount,
    reprioritized: false,
    projectId: projectIdToSave,
    hasSubtasks: draft.hasSubtasks,
    taskId: mainTask?.id,
  };
}
