import {
  HOY_NOTHING_DONE_MIN_HOUR,
  isHoyAfternoonNudgeWindow,
} from '@/lib/hoyDayFlowNudge';
import {
  resolveProactiveReflectionVariant,
  shouldShowAfternoonNudge,
  shouldShowProactiveReflectionCard,
} from '@/lib/hoy/proactivePlanSignals';

describe('proactivePlanSignals', () => {
  const afternoon = new Date('2026-06-22T15:00:00');
  const morning = new Date('2026-06-22T10:00:00');

  const baseReflection = {
    hasCheckIn: true,
    reflectedToday: false,
    incompleteCount: 3,
    isOverloaded: false,
    energyLevel: 3,
    priorityStats: { done: 0, total: 3, ratio: 0 },
  };

  it('shows reflection in afternoon when no progress', () => {
    expect(
      shouldShowProactiveReflectionCard({ ...baseReflection, now: afternoon }),
    ).toBe(true);
  });

  it('hides reflection when overloaded (inline CTA handles it)', () => {
    expect(
      shouldShowProactiveReflectionCard({
        ...baseReflection,
        isOverloaded: true,
        now: afternoon,
      }),
    ).toBe(false);
  });

  it('shows afternoon nudge when steps remain', () => {
    expect(
      shouldShowAfternoonNudge({
        hasCheckIn: true,
        crisisMode: false,
        compactLayout: false,
        allFocusDone: false,
        priorityStats: { done: 1, total: 3, ratio: 1 / 3 },
        now: afternoon,
      }),
    ).toBe(true);
  });

  it('resolves low-energy variant in afternoon', () => {
    expect(
      resolveProactiveReflectionVariant(2, { done: 1, total: 3, ratio: 1 / 3 }, afternoon),
    ).toBe('lowEnergy');
  });

  it('afternoon window starts at configured hour', () => {
    expect(isHoyAfternoonNudgeWindow(morning)).toBe(false);
    expect(HOY_NOTHING_DONE_MIN_HOUR).toBe(14);
  });
});
