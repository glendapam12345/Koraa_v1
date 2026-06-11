import {
  getLastNightSleepWindow,
  isShortSleep,
  msToSleepHours,
  summarizeLastNightSleep,
  sumSleepDurationMs,
} from '@/lib/appleHealthSleep';

describe('appleHealthSleep', () => {
  it('sums asleep stage samples', () => {
    const ms = sumSleepDurationMs([
      {
        value: 'CORE',
        startDate: '2026-06-08T01:00:00.000Z',
        endDate: '2026-06-08T02:00:00.000Z',
      },
      {
        value: 'REM',
        startDate: '2026-06-08T02:00:00.000Z',
        endDate: '2026-06-08T03:30:00.000Z',
      },
    ]);
    expect(msToSleepHours(ms)).toBe(2.5);
  });

  it('falls back to longest INBED sample', () => {
    const ms = sumSleepDurationMs([
      {
        value: 'INBED',
        startDate: '2026-06-08T00:00:00.000Z',
        endDate: '2026-06-08T07:00:00.000Z',
      },
      {
        value: 'INBED',
        startDate: '2026-06-08T00:30:00.000Z',
        endDate: '2026-06-08T06:00:00.000Z',
      },
    ]);
    expect(msToSleepHours(ms)).toBe(7);
  });

  it('marks short sleep below 6 hours', () => {
    expect(isShortSleep(5.5)).toBe(true);
    expect(isShortSleep(6)).toBe(false);
    expect(isShortSleep(7)).toBe(false);
  });

  it('summarizes last night window', () => {
    const now = new Date(2026, 5, 8, 9, 0, 0);
    const summary = summarizeLastNightSleep(
      [
        {
          value: 'ASLEEP',
          startDate: '2026-06-08T03:00:00.000Z',
          endDate: '2026-06-08T08:00:00.000Z',
        },
      ],
      now,
    );
    expect(summary).not.toBeNull();
    expect(summary!.hours).toBeGreaterThan(0);
  });

  it('last night window starts yesterday evening', () => {
    const now = new Date(2026, 5, 8, 10, 0, 0);
    const { start } = getLastNightSleepWindow(now);
    expect(start.getDate()).toBe(7);
    expect(start.getHours()).toBe(18);
  });
});
