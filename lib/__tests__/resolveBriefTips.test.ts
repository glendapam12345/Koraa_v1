import { resolveTipsByIds } from '@/lib/ai/resolveBriefTips';

describe('resolveBriefTips', () => {
  it('resolves known tip ids in order', () => {
    const tips = resolveTipsByIds(['mind-3', 'rest-1', 'unknown-id'], 'es');
    expect(tips).toHaveLength(2);
    expect(tips[0]?.id).toBe('mind-3');
    expect(tips[1]?.id).toBe('rest-1');
    expect(tips.every((tip) => tip.forYou)).toBe(true);
  });

  it('returns empty array when no ids match', () => {
    expect(resolveTipsByIds(['nope'], 'en')).toEqual([]);
  });
});
