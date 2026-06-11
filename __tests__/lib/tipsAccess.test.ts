import {
  FREE_TIPS_LIMIT,
  getCatalogCountByCategory,
  getDisplayTipsCountByCategory,
  getLockedTipsInCategory,
} from '@/lib/tipsAccess';

describe('tipsAccess', () => {
  it('catalog has 8 mindset tips in ES', () => {
    expect(getCatalogCountByCategory('es').mindset).toBe(8);
  });

  it('free display caps each category at FREE_TIPS_LIMIT', () => {
    const display = getDisplayTipsCountByCategory('es', false);
    expect(display.mindset).toBe(FREE_TIPS_LIMIT);
    expect(display.productivity).toBe(FREE_TIPS_LIMIT);
  });

  it('premium display shows full catalog counts', () => {
    const catalog = getCatalogCountByCategory('es');
    const display = getDisplayTipsCountByCategory('es', true);
    expect(display).toEqual(catalog);
  });

  it('locked count reflects premium gap', () => {
    expect(getLockedTipsInCategory('mindset', 'es', false)).toBe(8 - FREE_TIPS_LIMIT);
    expect(getLockedTipsInCategory('mindset', 'es', true)).toBe(0);
  });
});
