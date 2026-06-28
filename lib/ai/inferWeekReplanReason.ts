import type { KoraaWeekContext } from '@/lib/ai/types';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';

/** Infiere estrategia de replan desde el brief semanal. */
export function inferWeekReplanReason(context: KoraaWeekContext): WhatChangedReason {
  const energy = context.today?.energyLevel ?? 0;
  const emotion = context.today?.emotionKey ?? '';

  if (energy <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(emotion)) {
    return 'tired';
  }

  if (context.totals.busiestDayCount >= 4) {
    return 'week_balance';
  }

  if (energy >= 4 && context.totals.openTasks <= 3) {
    return 'more_energy';
  }

  return 'week_balance';
}

export function canSuggestWeekReplan(context: KoraaWeekContext): boolean {
  if (context.totals.openTasks < 2) return false;
  if (context.totals.busiestDayCount >= 3) return true;
  if (context.today && context.today.energyLevel <= 2) return true;
  return context.totals.openTasks >= 3;
}

/** Payload compacto para adaptive-reorganize / IA. */
export function serializeWeekContextForAi(
  context: KoraaWeekContext,
  extras?: { plannedMinutesByDay?: Record<string, number> },
) {
  return {
    displayName: context.displayName,
    weekStart: context.weekStart,
    weekEnd: context.weekEnd,
    totals: context.totals,
    today: context.today,
    plannedMinutesByDay: extras?.plannedMinutesByDay,
    days: context.days.map((day) => ({
      date: day.date,
      dayName: day.dayName,
      openCount: day.openCount,
      isToday: day.isToday,
      plannedMinutes: extras?.plannedMinutesByDay?.[day.date],
      checkIn: day.checkIn
        ? {
            emotionKey: day.checkIn.emotionKey,
            energyLevel: day.checkIn.energyLevel,
          }
        : undefined,
    })),
  };
}
