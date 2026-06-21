import type { WhatChangedReason } from '@/lib/lifeAreas/types';

export type VnextEnergyLevel = 'low' | 'normal' | 'high';

export type VnextAvailableHours = 2 | 4 | 6 | 8;

export type RealityCheckInput = {
  focusFrontKey: string;
  focusFrontName: string;
  availableHours: VnextAvailableHours;
  energy: VnextEnergyLevel;
};

export type PlanRealismResult = {
  requiredHours: number;
  availableHours: number;
  isRealistic: boolean;
  todayTaskCount: number;
  postponedCount: number;
  focusTaskCount: number;
};

export function energyToReorganizeReason(
  energy: VnextEnergyLevel,
  availableHours: VnextAvailableHours,
): WhatChangedReason {
  if (energy === 'low') return 'tired';
  if (availableHours <= 2) return 'less_time';
  if (energy === 'high') return 'more_energy';
  return 'priorities_changed';
}
