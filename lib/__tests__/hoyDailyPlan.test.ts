import { buildHoyDailyPlan, getHoyPlanStartAction } from '@/lib/hoyDailyPlan';

describe('hoyDailyPlan', () => {
  it('includes only priorities row', () => {
    const rows = buildHoyDailyPlan();
    expect(rows.map((r) => r.kind)).toEqual(['priorities']);
  });

  it('start action opens priorities', () => {
    expect(getHoyPlanStartAction()).toBe('priorities');
  });
});
