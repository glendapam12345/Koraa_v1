import { applyPatternHoyToPlanTasks, patternApplyToastKey } from '@/lib/applyPatternHoyMode';

jest.mock('@/lib/taskPlanningMeta', () => ({
  getStoredTaskPlanningMeta: (id: string) => {
    if (id === 'long') return { estimatedMinutes: 45 };
    if (id === 'short') return { estimatedMinutes: 5 };
    return null;
  },
}));

describe('applyPatternHoyToPlanTasks', () => {
  const a = { id: 'a', content: 'Escribir un mail largo sobre el proyecto' };
  const b = { id: 'b', content: 'Ok' };
  const c = { id: 'c', content: 'Revisar docs' };

  it('one_step keeps a single priority and moves the rest to waiting', () => {
    const result = applyPatternHoyToPlanTasks([a, b, c], [], 'one_step');
    expect(result.priorityTasks).toEqual([a]);
    expect(result.waitingTasks.map((t) => t.id)).toEqual(['b', 'c']);
  });

  it('one_step promotes from waiting when priority is empty', () => {
    const result = applyPatternHoyToPlanTasks([], [a, b], 'one_step');
    expect(result.priorityTasks).toEqual([a]);
    expect(result.waitingTasks).toEqual([b]);
  });

  it('easy_first puts the lightest estimated task first', () => {
    const long = { id: 'long', content: 'x' };
    const short = { id: 'short', content: 'yyyyyyyy' };
    const result = applyPatternHoyToPlanTasks([long], [short], 'easy_first');
    expect(result.priorityTasks.map((t) => t.id)).toEqual(['short', 'long']);
    expect(result.waitingTasks).toEqual([]);
  });

  it('open_hoy leaves lists unchanged', () => {
    const result = applyPatternHoyToPlanTasks([a, b], [c], 'open_hoy');
    expect(result.priorityTasks).toEqual([a, b]);
    expect(result.waitingTasks).toEqual([c]);
  });

  it('maps toast keys by mode', () => {
    expect(patternApplyToastKey('one_step')).toBe('hoy.patternApplyToastOneStep');
    expect(patternApplyToastKey('easy_first')).toBe('hoy.patternApplyToastEasyFirst');
    expect(patternApplyToastKey('open_hoy')).toBe('hoy.patternApplyToast');
  });
});
