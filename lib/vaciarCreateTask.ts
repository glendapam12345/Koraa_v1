import { supabase, isNetworkError, getSchemaSetupMessage } from '@/lib/supabase';
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

async function reprioritizeAfterTaskSave(userId: string, locale: AppLocale): Promise<boolean> {
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
  options: { locale: AppLocale; hasCheckInToday: boolean },
): Promise<VaciarCreateTaskResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'not_authenticated' };

  const trimmed = draft.content.trim();
  const detectedCategory = detectCategory(trimmed);
  const categoryToSave =
    draft.assignToProject === false ? draft.selectedCategory : detectedCategory || 'otros';
  const projectIdToSave = draft.assignToProject === true ? draft.selectedProjectId : null;
  const validSubtasks = draft.hasSubtasks ? draft.subtasks.filter((st) => st.trim()) : [];
  const subtaskCount = validSubtasks.length;

  const { data: mainTask, error: mainTaskError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      content: trimmed,
      category: categoryToSave,
      is_priority: false,
      is_completed: false,
      parent_task_id: null,
      project_id: projectIdToSave,
      scheduled_date: draft.selectedDate,
    })
    .select()
    .single();

  if (mainTaskError) {
    if (isNetworkError(mainTaskError)) {
      const { saveTaskOffline } = await import('@/lib/offlineStorage');
      const mainTaskId = await saveTaskOffline({
        content: trimmed,
        category: categoryToSave,
        is_priority: false,
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
          is_priority: false,
          is_completed: false,
          parent_task_id: mainTaskId,
          project_id: projectIdToSave,
        });
      }

      trackTaskCreated({
        priority: false,
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
          is_priority: false,
          is_completed: false,
          parent_task_id: null,
        })
        .select()
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
          is_priority: false,
          is_completed: false,
          parent_task_id: fallbackTask.id,
        }));
        await supabase.from('tasks').insert(subtasksToInsert);
      }

      trackTaskCreated({
        priority: false,
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
      is_priority: false,
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
    priority: false,
    projectId: projectIdToSave,
    scheduledDate: draft.selectedDate,
    hasSubtasks: subtaskCount > 0,
  });

  let reprioritized = false;
  if (options.hasCheckInToday) {
    try {
      reprioritized = await reprioritizeAfterTaskSave(user.id, options.locale);
    } catch (reprioritizeError) {
      logger.error('Error repriorizando tras guardar tarea:', reprioritizeError);
    }
  }

  return {
    status: 'success',
    savedTitle: trimmed,
    savedScheduledDate: draft.selectedDate,
    subtaskCount,
    reprioritized,
    projectId: projectIdToSave,
    hasSubtasks: draft.hasSubtasks,
  };
}
