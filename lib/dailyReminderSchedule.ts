/**
 * Decide cómo programar el recordatorio diario de check-in.
 * Si ya hubo check-in hoy y la hora del aviso aún no pasó, no pinguear de nuevo hoy:
 * programar un one-shot para mañana. En el resto de casos, recurrente diario.
 */

export type DailyReminderScheduleMode = 'daily_recurring' | 'tomorrow_once';

export type DailyReminderSchedulePlan = {
  mode: DailyReminderScheduleMode;
  /** Solo cuando mode === 'tomorrow_once' */
  triggerDate: Date | null;
};

export function resolveDailyReminderSchedulePlan(params: {
  hasCheckInToday: boolean;
  now: Date;
  reminderHour: number;
  reminderMinute: number;
}): DailyReminderSchedulePlan {
  const { hasCheckInToday, now, reminderHour, reminderMinute } = params;

  const todayAtReminder = new Date(now);
  todayAtReminder.setHours(reminderHour, reminderMinute, 0, 0);
  todayAtReminder.setSeconds(0, 0);

  if (hasCheckInToday && now < todayAtReminder) {
    const tomorrow = new Date(todayAtReminder);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { mode: 'tomorrow_once', triggerDate: tomorrow };
  }

  return { mode: 'daily_recurring', triggerDate: null };
}
