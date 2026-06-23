import {
  dateToPreferredTime,
  formatPreferredTimeLabel,
  isValidPreferredTime,
  preferredTimeToDate,
} from '@/lib/taskPreferredTime';

describe('taskPreferredTime', () => {
  it('validates HH:mm', () => {
    expect(isValidPreferredTime('09:00')).toBe(true);
    expect(isValidPreferredTime('23:59')).toBe(true);
    expect(isValidPreferredTime('9:00')).toBe(true);
    expect(isValidPreferredTime('25:00')).toBe(false);
    expect(isValidPreferredTime('')).toBe(false);
  });

  it('round-trips through Date', () => {
    const date = preferredTimeToDate('14:30');
    expect(dateToPreferredTime(date)).toBe('14:30');
  });

  it('formats labels for locale', () => {
    expect(formatPreferredTimeLabel('09:00', 'es')).toMatch(/9/);
    expect(formatPreferredTimeLabel(null, 'en')).toBeNull();
  });
});
