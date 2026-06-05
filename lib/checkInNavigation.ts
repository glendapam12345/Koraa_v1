/** Tab Hoy — check-in embebido (flujo principal del día). */
export const CHECK_IN_ROUTE = '/(tabs)' as const;

/** @deprecated Usar `openRecheckCheckIn()` — modal global unificado. */
export const RECHECK_IN_ROUTE = '/sentir' as const;

export { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
