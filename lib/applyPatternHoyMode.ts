import type { PatternHoyApplyMode } from '@/lib/behaviorInsights';
import { getStoredTaskPlanningMeta } from '@/lib/taskPlanningMeta';

export type PatternHoyPlanTask = {
  id: string;
  content: string;
};

function easeScore(task: PatternHoyPlanTask): number {
  const stored = getStoredTaskPlanningMeta(task.id);
  if (stored?.estimatedMinutes && stored.estimatedMinutes > 0) {
    return stored.estimatedMinutes;
  }
  // Proxy suave: menos texto ≈ paso más liviano cuando no hay estimación.
  return Math.max(1, task.content.trim().length);
}

/**
 * Ajusta el plan visible de Hoy según el modo de Para mí.
 * - one_step: un solo paso en prioridad; el resto pasa a “puede esperar”.
 * - easy_first: pone lo más liviano primero (minutos o longitud de copy).
 * - open_hoy: sin cambios de orden.
 */
export function applyPatternHoyToPlanTasks<T extends PatternHoyPlanTask>(
  priorityTasks: T[],
  waitingTasks: T[],
  mode: PatternHoyApplyMode,
): { priorityTasks: T[]; waitingTasks: T[] } {
  if (mode === 'open_hoy') {
    return { priorityTasks, waitingTasks };
  }

  if (mode === 'one_step') {
    const pool = priorityTasks.length > 0 ? priorityTasks : waitingTasks;
    if (pool.length === 0) {
      return { priorityTasks, waitingTasks };
    }
    const chosen = pool[0];
    const restPriority = priorityTasks.filter((task) => task.id !== chosen.id);
    const restWaiting = waitingTasks.filter((task) => task.id !== chosen.id);
    return {
      priorityTasks: [chosen],
      waitingTasks: [...restPriority, ...restWaiting],
    };
  }

  // easy_first
  const pool = [...priorityTasks, ...waitingTasks];
  if (pool.length === 0) {
    return { priorityTasks, waitingTasks };
  }

  let easiest = pool[0];
  let best = easeScore(easiest);
  for (let i = 1; i < pool.length; i += 1) {
    const candidate = pool[i];
    const score = easeScore(candidate);
    if (score < best) {
      easiest = candidate;
      best = score;
    }
  }

  const restPriority = priorityTasks.filter((task) => task.id !== easiest.id);
  const restWaiting = waitingTasks.filter((task) => task.id !== easiest.id);
  return {
    priorityTasks: [easiest, ...restPriority],
    waitingTasks: restWaiting,
  };
}

export function patternApplyToastKey(
  mode: PatternHoyApplyMode,
):
  | 'hoy.patternApplyToastOneStep'
  | 'hoy.patternApplyToastEasyFirst'
  | 'hoy.patternApplyToast' {
  switch (mode) {
    case 'one_step':
      return 'hoy.patternApplyToastOneStep';
    case 'easy_first':
      return 'hoy.patternApplyToastEasyFirst';
    default:
      return 'hoy.patternApplyToast';
  }
}
