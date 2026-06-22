import { router } from 'expo-router';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';

export function energyToReplanReason(energyLevel: number): WhatChangedReason {
  if (energyLevel <= 2) return 'tired';
  if (energyLevel >= 4) return 'more_energy';
  return 'priorities_changed';
}

type OpenHoyReplanPreviewOptions = {
  energyLevel: number;
};

/** Tras recheck: vista previa en Semana (mover tareas) → aceptar → Hoy. */
export function openHoyReplanPreview({ energyLevel }: OpenHoyReplanPreviewOptions): void {
  const reason = energyToReplanReason(energyLevel);
  router.push({
    pathname: '/(tabs)/semana',
    params: { replan: '1', replanReason: reason },
  });
}
