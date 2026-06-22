import type { WhatChangedReason } from '@/lib/lifeAreas/types';

export type CheckInAdaptiveInput = {
  energyLevel: number;
  emotion: string;
  availableTime: string;
  focusLevel: string;
};

const HEAVY_EMOTIONS = new Set(['agotada', 'ansiosa', 'abrumada']);
const LIGHT_TIME = 'Poco (1-2hrs)';
const SCATTERED_FOCUS = new Set(['Muy distraída', 'Algo distraída']);
const GOOD_EMOTIONS = new Set(['motivada', 'tranquila', 'enfocada']);

/** Traduce el check-in a una estrategia de reorganización del plan. */
export function inferReorganizeReasonFromCheckIn(
  input: CheckInAdaptiveInput,
  todayPlanCount: number,
): WhatChangedReason {
  const emotion = input.emotion.trim().toLowerCase();

  if (HEAVY_EMOTIONS.has(emotion) || input.energyLevel <= 2) {
    return 'tired';
  }

  if (input.availableTime === LIGHT_TIME) {
    return 'less_time';
  }

  if (SCATTERED_FOCUS.has(input.focusLevel) && input.energyLevel <= 3) {
    return 'less_time';
  }

  const lightPlan = todayPlanCount <= 2;
  const highEnergy = input.energyLevel >= 4;
  const goodMood = GOOD_EMOTIONS.has(emotion);

  if (lightPlan && (highEnergy || goodMood)) {
    return 'more_energy';
  }

  return 'priorities_changed';
}
