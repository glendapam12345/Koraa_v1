import {
  resolveDailyReminderSchedulePlan,
  type DailyReminderSchedulePlan,
} from '@/lib/dailyReminderSchedule';

describe('resolveDailyReminderSchedulePlan', () => {
  it('uses daily recurring when there is no check-in yet and reminder is ahead', () => {
    const now = new Date(2026, 7, 6, 8, 0, 0);
    const plan = resolveDailyReminderSchedulePlan({
      hasCheckInToday: false,
      now,
      reminderHour: 9,
      reminderMinute: 0,
    });
    expect(plan).toEqual<DailyReminderSchedulePlan>({
      mode: 'daily_recurring',
      triggerDate: null,
    });
  });

  it('schedules tomorrow once when already checked in and reminder hour is still ahead', () => {
    const now = new Date(2026, 7, 6, 8, 0, 0);
    const plan = resolveDailyReminderSchedulePlan({
      hasCheckInToday: true,
      now,
      reminderHour: 9,
      reminderMinute: 0,
    });
    expect(plan.mode).toBe('tomorrow_once');
    expect(plan.triggerDate).toEqual(new Date(2026, 7, 7, 9, 0, 0));
  });

  it('uses daily recurring when checked in and reminder hour already passed', () => {
    const now = new Date(2026, 7, 6, 10, 0, 0);
    const plan = resolveDailyReminderSchedulePlan({
      hasCheckInToday: true,
      now,
      reminderHour: 9,
      reminderMinute: 0,
    });
    expect(plan).toEqual<DailyReminderSchedulePlan>({
      mode: 'daily_recurring',
      triggerDate: null,
    });
  });
});
