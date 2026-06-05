import {
  generatePrioritizationExplanation,
} from '@/lib/smartPrioritization';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';

export type HoyPriorityExplanation = {
  title: string;
  message: string;
  suggestion: string;
  reasoning: string;
};

type BuildExplanationParams = {
  todayMood: string | null;
  energyLevel: number;
  time: string;
  focusLevel: string;
  incompleteTasks: Task[];
  tasks: Task[];
  locale: AppLocale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function buildHoyPriorityExplanation({
  todayMood,
  energyLevel,
  time,
  focusLevel,
  incompleteTasks,
  tasks,
  locale,
  t,
}: BuildExplanationParams): HoyPriorityExplanation {
  if (!todayMood || energyLevel === 0) {
    return {
      title: t('hoy.planTitle'),
      message: t('hoy.planSteps'),
      suggestion: t('hoyPlanFallback.planSteps'),
      reasoning: t('hoy.planReasoning'),
    };
  }

  if (time && energyLevel > 0 && focusLevel) {
    try {
      const explanation = generatePrioritizationExplanation(
        incompleteTasks,
        {
          energyLevel,
          emotion: todayMood,
          availableTime: time,
          focusLevel: focusLevel || t('hoy.focusLevelNormal'),
        },
        tasks,
        locale,
      );

      return {
        title: t('hoy.planTitle'),
        message: explanation.message,
        suggestion: explanation.suggestion,
        reasoning: explanation.reasoning,
      };
    } catch {
      /* fallback below */
    }
  }

  const priorityCount = incompleteTasks.filter((task) => task.is_priority).length;
  const emotionLabel = todayMood;
  const isNegativeEmotion = ['agotada', 'ansiosa', 'abrumada'].includes(todayMood.toLowerCase());

  let message = '';
  let reasoning = '';
  let suggestion = '';

  if (energyLevel <= 2 || isNegativeEmotion) {
    message =
      priorityCount === 1
        ? t('hoyPlanFallback.essentialOne', { count: priorityCount })
        : t('hoyPlanFallback.essentialMany', { count: priorityCount });
    reasoning = t('hoyPlanFallback.reasoningLow', { energy: energyLevel, emotion: emotionLabel });
    suggestion = t('hoy.planSuggestLow');
  } else if (energyLevel === 3) {
    message =
      priorityCount === 1
        ? t('hoyPlanFallback.priorityOne', { count: priorityCount })
        : t('hoyPlanFallback.priorityMany', { count: priorityCount });
    reasoning = t('hoyPlanFallback.reasoningMid', { emotion: emotionLabel });
    suggestion = t('hoy.planSuggestMid');
  } else if (energyLevel >= 4) {
    message =
      priorityCount === 1
        ? t('hoyPlanFallback.tasksOne', { count: priorityCount })
        : t('hoyPlanFallback.tasksMany', { count: priorityCount });
    reasoning = t('hoyPlanFallback.reasoningHigh', { emotion: emotionLabel });
    suggestion = t('hoy.planSuggestHigh');
  }

  return {
    title: t('hoy.planTitle'),
    message,
    suggestion,
    reasoning,
  };
}
