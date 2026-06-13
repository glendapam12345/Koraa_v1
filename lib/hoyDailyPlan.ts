export function buildHoyDailyPlan(): { kind: 'priorities' }[] {
  return [{ kind: 'priorities' }];
}

/** @deprecated Ritmo suave reemplazó filas de descanso; se mantiene por compatibilidad. */
export function getHoyPlanStartAction(): 'priorities' {
  return 'priorities';
}
