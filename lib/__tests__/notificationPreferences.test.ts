import {
  deriveTaskCaptureReminderTime,
  formatReminderTime,
} from '@/lib/notificationPreferences';

describe('deriveTaskCaptureReminderTime', () => {
  it('offsets morning check-in to evening capture', () => {
    expect(deriveTaskCaptureReminderTime({ hour: 9, minute: 0 })).toEqual({
      hour: 18,
      minute: 0,
    });
  });

  it('clamps late capture reminders to 20:00', () => {
    expect(deriveTaskCaptureReminderTime({ hour: 12, minute: 0 })).toEqual({
      hour: 20,
      minute: 0,
    });
  });

  it('uses offset when check-in is early but after 6:00', () => {
    expect(deriveTaskCaptureReminderTime({ hour: 7, minute: 0 })).toEqual({
      hour: 16,
      minute: 0,
    });
  });
});

describe('formatReminderTime', () => {
  it('pads hours and minutes', () => {
    expect(formatReminderTime({ hour: 8, minute: 30 })).toBe('08:30');
  });
});
