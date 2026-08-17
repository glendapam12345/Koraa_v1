import { resolveEllieNotifMood } from '@/lib/notificationEllieMood';

describe('resolveEllieNotifMood', () => {
  it('maps care to sleepy and capture to curious (default art)', () => {
    expect(resolveEllieNotifMood('care')).toBe('sleepy');
    expect(resolveEllieNotifMood('capture')).toBe('default');
    expect(resolveEllieNotifMood('recheck')).toBe('happy');
  });

  it('uses breathing when overwhelmed, even on a daily reminder', () => {
    expect(resolveEllieNotifMood('daily', ['named', 'overwhelmed', 'default'])).toBe(
      'breathing',
    );
  });

  it('uses sleepy when energy is low', () => {
    expect(resolveEllieNotifMood('daily', ['low_energy', 'default'])).toBe('sleepy');
  });

  it('cycles pretty daily portraits so they do not repeat', () => {
    const moods = [0, 1, 2, 3].map((salt) => resolveEllieNotifMood('daily', ['default'], salt));
    expect(moods).toEqual(['default', 'happy', 'grateful', 'default']);
  });
});
