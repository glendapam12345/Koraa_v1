import { resolveFirstDayCloseCue } from '@/lib/firstDayClose';

describe('resolveFirstDayCloseCue', () => {
  const base = {
    isLiteDay: true,
    hasCheckIn: true,
    reminderOptedIn: true,
    reminderTimeLabel: '09:00',
  };

  it('returns a timed cue on day 1 after check-in when they opted in', () => {
    expect(resolveFirstDayCloseCue(base)).toEqual({
      withTime: true,
      timeLabel: '09:00',
    });
  });

  it('keeps the time label when they skipped, so Hoy can offer the appointment', () => {
    expect(
      resolveFirstDayCloseCue({ ...base, reminderOptedIn: false }),
    ).toEqual({ withTime: false, timeLabel: '09:00' });
  });

  it('hides before check-in or after day 1', () => {
    expect(resolveFirstDayCloseCue({ ...base, hasCheckIn: false })).toBeNull();
    expect(resolveFirstDayCloseCue({ ...base, isLiteDay: false })).toBeNull();
  });

  it('hides in care mode', () => {
    expect(resolveFirstDayCloseCue({ ...base, crisisMode: true })).toBeNull();
  });
});
