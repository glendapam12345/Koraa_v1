export type RhythmChipId = 'breathe' | 'meditate' | 'pause';

export type RhythmHintKey =
  | 'default'
  | 'afterStep'
  | 'morning'
  | 'care'
  | 'allDone';

export type GentleRhythmState = {
  visibleChips: RhythmChipId[];
  highlightedChip: RhythmChipId | null;
  hintKey: RhythmHintKey;
  doneChips: RhythmChipId[];
};

type GetGentleRhythmInput = {
  crisisMode: boolean;
  energyLevel: number;
  prioritiesDone: number;
  prioritiesTotal: number;
  morningMeditationDone: boolean;
  eveningMeditationDone: boolean;
  allFocusDone: boolean;
  /** Hora local 0–23; inyectable en tests. */
  hour?: number;
};

const ALL_CHIPS: RhythmChipId[] = ['breathe', 'meditate', 'pause'];

export function getGentleRhythmState({
  crisisMode,
  energyLevel,
  prioritiesDone,
  prioritiesTotal,
  morningMeditationDone,
  eveningMeditationDone,
  allFocusDone,
  hour = new Date().getHours(),
}: GetGentleRhythmInput): GentleRhythmState {
  const doneChips: RhythmChipId[] = [];
  if (morningMeditationDone || eveningMeditationDone) {
    doneChips.push('meditate');
  }

  if (allFocusDone && prioritiesTotal > 0) {
    return {
      visibleChips: ALL_CHIPS,
      highlightedChip: null,
      hintKey: 'allDone',
      doneChips,
    };
  }

  if (crisisMode || energyLevel <= 2) {
    return {
      visibleChips: ALL_CHIPS,
      highlightedChip: 'breathe',
      hintKey: 'care',
      doneChips,
    };
  }

  const madeProgress = prioritiesDone > 0 && prioritiesDone < prioritiesTotal;
  if (madeProgress) {
    return {
      visibleChips: ALL_CHIPS,
      highlightedChip: 'breathe',
      hintKey: 'afterStep',
      doneChips,
    };
  }

  const isMorning = hour < 12;
  if (isMorning && !morningMeditationDone) {
    return {
      visibleChips: ALL_CHIPS,
      highlightedChip: 'meditate',
      hintKey: 'morning',
      doneChips,
    };
  }

  return {
    visibleChips: ALL_CHIPS,
    highlightedChip: null,
    hintKey: 'default',
    doneChips,
  };
}
