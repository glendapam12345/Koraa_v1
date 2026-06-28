import type { AppLocale } from '@/lib/i18n';
import {
  computePrioritizationPlan,
  type CheckInData,
  type Task as SmartTask,
} from '@/lib/smartPrioritization';
import type { TaskCandidate } from '@/lib/ai/types';

const DEFAULT_SHORTLIST_SIZE = 20;

/** Top tareas (scoring local) para que la IA elija el plan de hoy. */
export function shortlistTasksForAi(
  tasks: SmartTask[],
  checkIn: CheckInData,
  locale: AppLocale,
  limit = DEFAULT_SHORTLIST_SIZE,
): TaskCandidate[] {
  const plan = computePrioritizationPlan(tasks, checkIn, locale);
  if (!plan) return [];

  return plan.orderedScores.slice(0, limit).map((entry) => ({
    id: entry.task.id,
    content: entry.task.content.trim().slice(0, 120),
    category: entry.task.category || 'otros',
    score: entry.score,
  }));
}
