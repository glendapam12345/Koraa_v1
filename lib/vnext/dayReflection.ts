import type { WhatChangedReason } from '@/lib/lifeAreas/types';

export type DayReflectionOutcome =
  | 'finished_all'
  | 'less_energy'
  | 'difficult_day'
  | 'unexpected'
  | 'finished_early';

export function reflectionToReorganizeReason(
  outcome: DayReflectionOutcome,
): WhatChangedReason {
  if (outcome === 'unexpected') return 'new_event';
  if (outcome === 'less_energy') return 'less_time';
  if (outcome === 'difficult_day') return 'tired';
  if (outcome === 'finished_early') return 'more_energy';
  if (outcome === 'finished_all') return 'priorities_changed';
  return 'priorities_changed';
}
