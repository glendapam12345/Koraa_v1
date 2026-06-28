import { buildKoraaDayContext } from '@/lib/ai/buildDayContext';
import { fetchKoraaDailyBrief } from '@/lib/ai/fetchKoraaDailyBrief';
import { resolveAiFocusTaskIds } from '@/lib/ai/applyAiFocusPlan';
import { persistAiFocusPlanToDb } from '@/lib/ai/persistAiFocusPlan';
import { shortlistTasksForAi } from '@/lib/ai/shortlistTasksForAi';
import type { AppLocale } from '@/lib/i18n';
import type { Task } from '@/components/tasks/TaskCard';
import type { CheckInData } from '@/lib/smartPrioritization';

function isAiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return flag === 'true' || flag === '1';
}

export type KoraaBrainFocusPlanInput = {
  locale: AppLocale;
  displayName: string;
  emotion: string;
  emotionLabel: string;
  energyLevel: number;
  availableTime: string;
  focusLevel: string;
};

/**
 * Tras check-in: pide plan de foco al cerebro y lo persiste en Supabase.
 * Si la IA no responde, el caller debe usar reglas locales.
 */
export async function fetchAndApplyKoraaBrainFocusPlan(
  userId: string,
  input: KoraaBrainFocusPlanInput,
  tasks: Task[],
): Promise<{ applied: boolean; focusTaskIds: string[]; focusFromAi: boolean }> {
  if (!isAiEnabled()) {
    return { applied: false, focusTaskIds: [], focusFromAi: false };
  }

  const mainTasks = tasks.filter((task) => !task.is_completed && !task.parent_task_id);
  if (mainTasks.length === 0) {
    return { applied: false, focusTaskIds: [], focusFromAi: false };
  }

  const checkIn: CheckInData = {
    emotion: input.emotion,
    energyLevel: input.energyLevel,
    availableTime: input.availableTime,
    focusLevel: input.focusLevel,
  };

  const taskCandidates = shortlistTasksForAi(mainTasks, checkIn, input.locale);
  if (taskCandidates.length === 0) {
    return { applied: false, focusTaskIds: [], focusFromAi: false };
  }

  const context = buildKoraaDayContext({
    locale: input.locale,
    displayName: input.displayName,
    todayMood: input.emotion,
    todayEmotionLabel: input.emotionLabel,
    energyLevel: input.energyLevel,
    availableTime: input.availableTime,
    focusLevel: input.focusLevel,
    suggestion: '',
    focusCount: 0,
    focusTasks: [],
    pendingCount: mainTasks.length,
  });

  if (!context) {
    return { applied: false, focusTaskIds: [], focusFromAi: false };
  }

  const brief = await fetchKoraaDailyBrief(userId, context, {
    taskCandidates,
    skipCache: true,
  });

  const focusTaskIds =
    brief.focusTaskIds.length > 0
      ? brief.focusTaskIds
      : resolveAiFocusTaskIds(
          taskCandidates.map((task) => task.id),
          taskCandidates,
          checkIn,
        );

  if (focusTaskIds.length === 0) {
    return { applied: false, focusTaskIds: [], focusFromAi: false };
  }

  const applied = await persistAiFocusPlanToDb(userId, focusTaskIds);
  return {
    applied,
    focusTaskIds,
    focusFromAi: brief.focusFromAi,
  };
}
