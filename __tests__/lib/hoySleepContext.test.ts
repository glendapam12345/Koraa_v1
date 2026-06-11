import {
  CALM_AFTERNOON_END_HOUR,
  CALM_MORNING_END_HOUR,
  getHoyCalmMomentPeriod,
  getHoySleepCardVariant,
  shouldShowSleepHealthExtras,
} from '@/lib/hoySleepContext';

describe('hoySleepContext', () => {
  it('returns morning before noon', () => {
    const morning = new Date(2026, 5, 8, 9, 0);
    expect(getHoyCalmMomentPeriod(morning)).toBe('morning');
  });

  it('returns afternoon between noon and evening', () => {
    const afternoon = new Date(2026, 5, 8, 14, 0);
    expect(getHoyCalmMomentPeriod(afternoon)).toBe('afternoon');
  });

  it('returns evening after CALM_AFTERNOON_END_HOUR', () => {
    const evening = new Date(2026, 5, 8, CALM_AFTERNOON_END_HOUR, 30);
    expect(getHoyCalmMomentPeriod(evening)).toBe('evening');
  });

  it('returns evening late at night', () => {
    const late = new Date(2026, 5, 8, 2, 0);
    expect(getHoyCalmMomentPeriod(late)).toBe('evening');
  });

  it('getHoySleepCardVariant always maps to a calm period', () => {
    const morning = new Date(2026, 5, 8, CALM_MORNING_END_HOUR - 1, 0);
    expect(getHoySleepCardVariant(4, 'motivada', morning)).toBe('morning');
  });

  it('shows sleep health extras for low energy in the morning', () => {
    const morning = new Date(2026, 5, 8, 9, 0);
    expect(shouldShowSleepHealthExtras(2, 'tranquila', getHoyCalmMomentPeriod(morning))).toBe(true);
  });

  it('hides sleep health extras in the evening', () => {
    const evening = new Date(2026, 5, 8, 20, 0);
    expect(shouldShowSleepHealthExtras(2, 'agotada', getHoyCalmMomentPeriod(evening))).toBe(false);
  });
});
