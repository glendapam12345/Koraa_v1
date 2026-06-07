import {
  MEDITATION_EVENING_HOUR,
  getSituationalMeditationType,
} from '@/lib/meditationSituational';

describe('meditationSituational', () => {
  it('prefers morning during the day when not done', () => {
    expect(MEDITATION_EVENING_HOUR).toBe(17);
    expect(
      getSituationalMeditationType(false, false, new Date(2026, 4, 19, 10, 0)),
    ).toBe('morning');
  });

  it('prefers evening after evening hour when not done', () => {
    expect(
      getSituationalMeditationType(false, false, new Date(2026, 4, 19, 19, 0)),
    ).toBe('evening');
  });

  it('falls back to the other slot when primary is already done', () => {
    expect(
      getSituationalMeditationType(true, false, new Date(2026, 4, 19, 10, 0)),
    ).toBe('evening');
    expect(
      getSituationalMeditationType(false, true, new Date(2026, 4, 19, 19, 0)),
    ).toBe('morning');
  });
});
