import {
  buildEmotionChartInsight,
  buildEnergyChartInsight,
  buildMoodChartInsight,
} from '@/lib/paramiChartInsights';
import type { DayData } from '@/lib/checkInDayData';

function day(
  partial: Partial<DayData> & Pick<DayData, 'date'>,
): DayData {
  return {
    dayLabel: 'L',
    hasCheckIn: true,
    emotion: 'tranquila',
    energyLevel: 3,
    ...partial,
  };
}

describe('paramiChartInsights', () => {
  const week: DayData[] = [
    day({ date: '2026-08-07', emotion: 'ansiosa', energyLevel: 2 }),
    day({ date: '2026-08-08', emotion: 'ansiosa', energyLevel: 2 }),
    day({ date: '2026-08-09', emotion: 'tranquila', energyLevel: 4 }),
    { date: '2026-08-10', dayLabel: 'J', hasCheckIn: false },
    day({ date: '2026-08-11', emotion: 'ansiosa', energyLevel: 1 }),
    day({ date: '2026-08-12', emotion: 'cansada', energyLevel: 3 }),
    day({ date: '2026-08-13', emotion: 'ansiosa', energyLevel: 2 }),
  ];

  it('buildMoodChartInsight highlights coverage and top emotion', () => {
    const insight = buildMoodChartInsight(week, 'es');
    expect(insight?.highlight).toBe('6/7');
    expect(insight?.text.toLowerCase()).toContain('ansiedad');
    expect(insight?.text).toContain('67%');
  });

  it('buildEnergyChartInsight averages and counts low days', () => {
    const insight = buildEnergyChartInsight(week, 'es');
    expect(insight?.highlight).toBe('2.3');
    expect(insight?.text).toContain('4');
    expect(insight?.text).toMatch(/descanso|≤2/i);
  });

  it('buildEmotionChartInsight uses share of check-ins', () => {
    const mix = [
      { id: 'ansiosa', count: 4, color: '#000' },
      { id: 'tranquila', count: 1, color: '#111' },
    ];
    const insight = buildEmotionChartInsight(mix, 6, 'en');
    expect(insight?.highlight).toBe('67%');
    expect(insight?.text.toLowerCase()).toContain('anxious');
  });

  it('returns null without check-ins', () => {
    expect(buildMoodChartInsight([], 'es')).toBeNull();
    expect(buildEnergyChartInsight([], 'es')).toBeNull();
    expect(buildEmotionChartInsight([], 0, 'es')).toBeNull();
  });
});
