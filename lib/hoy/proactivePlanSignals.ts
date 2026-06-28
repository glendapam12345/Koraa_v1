import { isHoyAfternoonNudgeWindow } from '@/lib/hoyDayFlowNudge';
import type { FocusProgressStats } from '@/lib/focusProgressStats';

type ProactiveReflectionInput = {
  hasCheckIn: boolean;
  reflectedToday: boolean;
  incompleteCount: number;
  isOverloaded: boolean;
  energyLevel: number;
  priorityStats: FocusProgressStats;
  now?: Date;
};

/** Tarjeta de replan del día: tarde sin avance, baja energía, o sobrecarga (si no hay CTA inline). */
export function shouldShowProactiveReflectionCard({
  hasCheckIn,
  reflectedToday,
  incompleteCount,
  isOverloaded,
  energyLevel,
  priorityStats,
  now = new Date(),
}: ProactiveReflectionInput): boolean {
  if (!hasCheckIn || reflectedToday || incompleteCount <= 0) return false;
  if (isOverloaded) return false;

  const afternoon = isHoyAfternoonNudgeWindow(now);
  const noProgressYet =
    priorityStats.total > 0 && priorityStats.done < priorityStats.total;

  if (afternoon && noProgressYet) return true;
  if (afternoon && energyLevel > 0 && energyLevel <= 2) return true;

  return false;
}

export type ProactiveReflectionVariant = 'default' | 'afternoon' | 'lowEnergy';

export function resolveProactiveReflectionVariant(
  energyLevel: number,
  priorityStats: FocusProgressStats,
  now: Date = new Date(),
): ProactiveReflectionVariant {
  if (
    isHoyAfternoonNudgeWindow(now) &&
    energyLevel > 0 &&
    energyLevel <= 2
  ) {
    return 'lowEnergy';
  }
  if (
    isHoyAfternoonNudgeWindow(now) &&
    priorityStats.total > 0 &&
    priorityStats.done === 0
  ) {
    return 'afternoon';
  }
  return 'default';
}

type AfternoonNudgeInput = {
  hasCheckIn: boolean;
  crisisMode: boolean;
  compactLayout: boolean;
  allFocusDone: boolean;
  priorityStats: FocusProgressStats;
  now?: Date;
};

/** Línea suave bajo el plan cuando aún hay pasos por hacer en la tarde. */
export function shouldShowAfternoonNudge({
  hasCheckIn,
  crisisMode,
  compactLayout,
  allFocusDone,
  priorityStats,
  now = new Date(),
}: AfternoonNudgeInput): boolean {
  if (!hasCheckIn || crisisMode || compactLayout || allFocusDone) return false;
  if (!isHoyAfternoonNudgeWindow(now)) return false;
  return priorityStats.total > 0 && priorityStats.done < priorityStats.total;
}
