import { STREAK_MILESTONE_DAYS } from '@/lib/streak';

export type StreakLevelKey =
  | 'yo.streakLevelStarting'
  | 'yo.streakLevelOnTrack'
  | 'yo.streakLevelConsistent'
  | 'yo.streakLevelAdvanced'
  | 'yo.streakLevelExpert'
  | 'yo.streakLevelMaster';

export function getStreakLevelKey(streak: number): StreakLevelKey {
  if (streak >= 90) return 'yo.streakLevelMaster';
  if (streak >= 60) return 'yo.streakLevelExpert';
  if (streak >= 30) return 'yo.streakLevelAdvanced';
  if (streak >= 14) return 'yo.streakLevelConsistent';
  if (streak >= 7) return 'yo.streakLevelOnTrack';
  return 'yo.streakLevelStarting';
}

/** 0–1 progreso hacia una meta de racha elegida por la usuaria. */
export function getStreakGoalProgress(streak: number, goalDays: number): number {
  if (goalDays <= 0 || streak <= 0) return 0;
  return Math.min(1, streak / goalDays);
}

/** 0–1 progreso hacia el siguiente hito de racha. */
export function getStreakRingProgress(streak: number): number {
  if (streak <= 0) return 0;
  const milestones = STREAK_MILESTONE_DAYS as readonly number[];
  const next = milestones.find((m) => m > streak) ?? milestones[milestones.length - 1]!;
  const prev = milestones.filter((m) => m <= streak).pop() ?? 0;
  if (next <= prev) return 1;
  return Math.min(1, (streak - prev) / (next - prev));
}

export function getStreakAuraIntensity(streak: number): number {
  if (streak <= 0) return 0;
  if (streak >= 90) return 1;
  if (streak >= 30) return 0.75;
  if (streak >= 14) return 0.55;
  if (streak >= 7) return 0.35;
  return 0.2;
}

export function getNextStreakMilestone(streak: number): number {
  const milestones = STREAK_MILESTONE_DAYS as readonly number[];
  return milestones.find((m) => m > streak) ?? milestones[milestones.length - 1]!;
}
