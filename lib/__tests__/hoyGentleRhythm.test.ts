import { getGentleRhythmState } from '@/lib/hoyGentleRhythm';

describe('hoyGentleRhythm', () => {
  const base = {
    crisisMode: false,
    energyLevel: 4,
    prioritiesDone: 0,
    prioritiesTotal: 2,
    morningMeditationDone: false,
    eveningMeditationDone: false,
    allFocusDone: false,
    hour: 10,
  };

  it('highlights meditate in the morning', () => {
    const state = getGentleRhythmState(base);
    expect(state.highlightedChip).toBe('meditate');
    expect(state.hintKey).toBe('morning');
    expect(state.visibleChips).toEqual(['breathe', 'meditate', 'pause']);
  });

  it('highlights breathe after one priority is done', () => {
    const state = getGentleRhythmState({ ...base, prioritiesDone: 1 });
    expect(state.highlightedChip).toBe('breathe');
    expect(state.hintKey).toBe('afterStep');
  });

  it('shows all chips in care mode with breathe highlighted', () => {
    const state = getGentleRhythmState({ ...base, crisisMode: true });
    expect(state.visibleChips).toEqual(['breathe', 'meditate', 'pause']);
    expect(state.highlightedChip).toBe('breathe');
    expect(state.hintKey).toBe('care');
  });

  it('marks meditate done and clears highlight when all focus done', () => {
    const state = getGentleRhythmState({
      ...base,
      morningMeditationDone: true,
      allFocusDone: true,
      prioritiesDone: 2,
    });
    expect(state.doneChips).toContain('meditate');
    expect(state.hintKey).toBe('allDone');
    expect(state.highlightedChip).toBeNull();
  });
});
