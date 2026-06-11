/** Hora local: fin de mañana (exclusive). */
export const CALM_MORNING_END_HOUR = 12;
/** Hora local: fin de tarde / inicio noche (exclusive para tarde). */
export const CALM_AFTERNOON_END_HOUR = 17;
/** @deprecated use CALM_AFTERNOON_END_HOUR */
export const SLEEP_EVENING_HOUR = CALM_AFTERNOON_END_HOUR;

export type HoyCalmMomentPeriod = 'morning' | 'afternoon' | 'evening';

/** @deprecated use HoyCalmMomentPeriod */
export type HoySleepCardVariant = HoyCalmMomentPeriod | 'low_energy' | null;

export function getHoyCalmMomentPeriod(now: Date = new Date()): HoyCalmMomentPeriod {
  const hour = now.getHours();
  if (hour >= CALM_MORNING_END_HOUR && hour < CALM_AFTERNOON_END_HOUR) return 'afternoon';
  if (hour >= CALM_AFTERNOON_END_HOUR || hour < 5) return 'evening';
  return 'morning';
}

export function shouldShowSleepHealthExtras(
  energyLevel: number,
  emotionKey: string,
  period: HoyCalmMomentPeriod,
): boolean {
  if (period === 'evening') return false;
  return energyLevel <= 2 || emotionKey === 'agotada';
}

/** @deprecated Prefer getHoyCalmMomentPeriod — siempre devuelve un periodo del día. */
export function getHoySleepCardVariant(
  energyLevel: number,
  emotionKey: string,
  now: Date = new Date(),
): HoySleepCardVariant {
  void energyLevel;
  void emotionKey;
  return getHoyCalmMomentPeriod(now);
}
