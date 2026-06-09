import { getPersonalizedTips } from '@/lib/tipsPersonalization';
import type { TipCategoryId } from '@/lib/tipsTypes';

function topCategoryScores(
  emotion: string,
  energyLevel: number,
): Record<TipCategoryId, number> {
  const tips = getPersonalizedTips({ emotion, energyLevel }, 'es');
  const sums: Record<TipCategoryId, number> = {
    mindset: 0,
    rest: 0,
    action: 0,
    productivity: 0,
  };
  for (const tip of tips.slice(0, 8)) {
    sums[tip.category] += tip.score;
  }
  return sums;
}

describe('getPersonalizedTips scoring', () => {
  it('prefers action over productivity when motivada with high energy', () => {
    const scores = topCategoryScores('motivada', 5);
    expect(scores.action).toBeGreaterThanOrEqual(scores.productivity);
  });

  it('ranks rest and mindset above productivity when abrumada', () => {
    const scores = topCategoryScores('abrumada', 2);
    expect(scores.rest + scores.mindset).toBeGreaterThan(scores.productivity);
  });

  it('boosts action (not productivity) for clear-headed high energy', () => {
    const scores = topCategoryScores('enfocada', 5);
    expect(scores.action).toBeGreaterThan(scores.productivity);
  });
});
