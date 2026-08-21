import { calendarDateStringFromPicker, getLocalDateString } from '@/lib/dateLocal';

describe('calendarDateStringFromPicker', () => {
  it('keeps local calendar day for a local midnight Date', () => {
    const local = new Date(2026, 7, 20, 0, 0, 0, 0);
    expect(calendarDateStringFromPicker(local)).toBe('2026-08-20');
  });

  it('uses UTC calendar day when the picker returns UTC midnight', () => {
    const utcMidnight = new Date(Date.UTC(2026, 7, 20, 0, 0, 0, 0));
    expect(calendarDateStringFromPicker(utcMidnight)).toBe('2026-08-20');
  });

  it('matches getLocalDateString for afternoon local times', () => {
    const afternoon = new Date(2026, 7, 20, 15, 30, 0, 0);
    expect(calendarDateStringFromPicker(afternoon)).toBe(getLocalDateString(afternoon));
  });
});
