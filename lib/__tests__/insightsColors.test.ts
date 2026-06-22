import {
  getEnergyLevelColor,
  getInsightsEmotionAccent,
  INSIGHTS_ENERGY_COLORS,
} from '@/lib/insightsColors';

describe('insightsColors', () => {
  it('maps energy levels to distinct warm-to-cool colors', () => {
    expect(getEnergyLevelColor(1)).toBe(INSIGHTS_ENERGY_COLORS[1]);
    expect(getEnergyLevelColor(3)).toBe(INSIGHTS_ENERGY_COLORS[3]);
    expect(getEnergyLevelColor(5)).toBe(INSIGHTS_ENERGY_COLORS[5]);
    expect(getEnergyLevelColor(0)).not.toBe(INSIGHTS_ENERGY_COLORS[1]);
  });

  it('clamps out-of-range energy values', () => {
    expect(getEnergyLevelColor(6)).toBe(INSIGHTS_ENERGY_COLORS[5]);
    expect(getEnergyLevelColor(-1)).not.toBe(INSIGHTS_ENERGY_COLORS[5]);
  });

  it('returns emotion accent colors for known moods', () => {
    expect(getInsightsEmotionAccent('tranquila')).toBe('#76D672');
    expect(getInsightsEmotionAccent('ansiosa')).toBe('#FFB045');
  });
});
