import {
  applyCapturePriority,
  capturePriorityToIsPriority,
  clearCapturePriority,
  isUrgentCapturePriority,
} from '@/lib/review/capturePriority';

describe('capturePriority', () => {
  it('maps high and urgent to is_priority', () => {
    expect(capturePriorityToIsPriority('high')).toBe(true);
    expect(capturePriorityToIsPriority('urgent')).toBe(true);
    expect(capturePriorityToIsPriority('medium')).toBe(false);
  });

  it('urgent always sets markImportant', () => {
    const next = applyCapturePriority({ id: '1', content: 'x' } as never, 'urgent');
    expect(next.capturePriority).toBe('urgent');
    expect(next.markImportant).toBe(true);
    expect(isUrgentCapturePriority(next.capturePriority)).toBe(true);
  });

  it('clears priority flags', () => {
    const cleared = clearCapturePriority({
      id: '1',
      content: 'x',
      capturePriority: 'high',
      markImportant: true,
    } as never);
    expect(cleared.capturePriority).toBeNull();
    expect(cleared.markImportant).toBe(false);
  });
});
