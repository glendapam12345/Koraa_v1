import { resolveAiFocusTaskIds, resolveMaxFocusTaskCount } from '@/lib/ai/applyAiFocusPlan';
import type { TaskCandidate } from '@/lib/ai/types';

describe('applyAiFocusPlan', () => {
  const checkIn = {
    emotion: 'tranquila',
    energyLevel: 3,
    availableTime: 'Medio (2-4hrs)',
    focusLevel: 'Normal',
  };

  const candidates: TaskCandidate[] = [
    { id: 'a', content: 'Task A', category: 'otros' },
    { id: 'b', content: 'Task B', category: 'otros' },
    { id: 'c', content: 'Task C', category: 'otros' },
    { id: 'd', content: 'Task D', category: 'otros' },
  ];

  it('resolveMaxFocusTaskCount respects energy', () => {
    expect(resolveMaxFocusTaskCount({ ...checkIn, energyLevel: 2 })).toBe(2);
    expect(resolveMaxFocusTaskCount({ ...checkIn, energyLevel: 5 })).toBe(5);
  });

  it('resolveAiFocusTaskIds filters invalid ids and caps count', () => {
    const ids = resolveAiFocusTaskIds(['c', 'x', 'a', 'b', 'd'], candidates, checkIn);
    expect(ids).toEqual(['c', 'a', 'b']);
  });
});
