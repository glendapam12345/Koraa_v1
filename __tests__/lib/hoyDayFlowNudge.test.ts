import {
  HOY_NOTHING_DONE_MIN_HOUR,
  isHoyAfternoonNudgeWindow,
} from '@/lib/hoyDayFlowNudge';

describe('hoyDayFlowNudge', () => {
  it('opens afternoon nudge window at configured hour', () => {
    expect(HOY_NOTHING_DONE_MIN_HOUR).toBe(14);
    expect(isHoyAfternoonNudgeWindow(new Date(2026, 4, 19, 13, 59))).toBe(false);
    expect(isHoyAfternoonNudgeWindow(new Date(2026, 4, 19, 14, 0))).toBe(true);
  });
});
