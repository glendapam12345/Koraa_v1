import type { DayData } from '@/lib/checkInDayData';
import { getTipsActionHero } from '@/lib/tipsActionHero';

function week(overrides: Partial<DayData>[]): DayData[] {
  return overrides.map((day, i) => ({
    date: `2026-06-0${i + 1}`,
    hasCheckIn: true,
    dayLabel: 'Lun',
    energyLevel: 3,
    ...day,
  }));
}

describe('getTipsActionHero week patterns', () => {
  it('shows abrumada message whenever emotion is abrumada', () => {
    const hero = getTipsActionHero({ emotion: 'abrumada', energyLevel: 4 }, []);
    expect(hero.messageKey).toBe('tips.actionHeroAbrumada');
    expect(hero.action.type).toBe('pause');
  });

  it('detects sustained heavy week for agotada', () => {
    const data = week([
      { emotion: 'agotada', energyLevel: 2 },
      { emotion: 'tranquila', energyLevel: 2 },
      { emotion: 'ansiosa', energyLevel: 1 },
      { emotion: 'motivada', energyLevel: 3 },
    ]);
    const hero = getTipsActionHero({ emotion: 'agotada', energyLevel: 3 }, data);
    expect(hero.messageKey).toBe('tips.actionHeroAbrumada');
  });

  it('does not infer heavy week without enough low-energy days', () => {
    const data = week([
      { emotion: 'motivada', energyLevel: 4 },
      { emotion: 'tranquila', energyLevel: 3 },
      { emotion: 'agotada', energyLevel: 2 },
    ]);
    const hero = getTipsActionHero({ emotion: 'agotada', energyLevel: 3 }, data);
    expect(hero.messageKey).not.toBe('tips.actionHeroAbrumada');
  });
});
