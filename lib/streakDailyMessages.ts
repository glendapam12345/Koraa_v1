/**
 * Mensajes de ánimo en la tarjeta de racha (Yo): rotan según el día local,
 * misma frase todo el día, otra al día siguiente.
 */

import type { AppLocale } from '@/lib/i18n';
import { STREAK_POOLS_EN, STREAK_POOLS_ES } from '@/lib/i18n/locales/streakPools';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i);
  }
  return Math.abs(h);
}

type TierKey = 'low' | 'tier7' | 'tier14' | 'tier30' | 'tier60' | 'tier90';

function tierForStreak(streak: number): TierKey {
  if (streak >= 90) return 'tier90';
  if (streak >= 60) return 'tier60';
  if (streak >= 30) return 'tier30';
  if (streak >= 14) return 'tier14';
  if (streak >= 7) return 'tier7';
  return 'low';
}

export function pickDailyStreakEncouragement(
  streak: number,
  dateKey: string,
  locale: AppLocale = 'es',
): string {
  const tierKey = tierForStreak(streak);
  const pools = locale === 'en' ? STREAK_POOLS_EN : STREAK_POOLS_ES;
  const pool = pools[tierKey];
  const idx = hashString(`${dateKey}|${tierKey}|${streak}`) % pool.length;
  return pool[idx] ?? pool[0];
}

/** Fecha local YYYY-MM-DD (no UTC). */
export function getLocalDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
