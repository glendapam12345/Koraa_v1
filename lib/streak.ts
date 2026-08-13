import type { SupabaseClient } from '@supabase/supabase-js';
import { getLocalDateString } from '@/lib/dateLocal';

/** Un día libre en la cadena no rompe el ritmo (anti Duolingo-guilt). */
export const DEFAULT_STREAK_GRACE_DAYS = 1;

export type StreakPresence = {
  /** Días con check-in en la cadena actual (los días de gracia no suman). */
  streak: number;
  /** true si se usó al menos un día de gracia en esta cadena. */
  usedGrace: boolean;
};

/**
 * Racha hacia atrás desde `today`.
 * - Hoy sin check-in no rompe (aún puedes volver).
 * - Hasta `graceDays` huecos de 1 día se saltan sin romper ni sumar.
 * - Un segundo hueco (o más que grace) corta la cadena.
 */
export function computeCurrentStreak(
  checkInDates: Set<string> | Iterable<string>,
  today: Date = new Date(),
  options?: { graceDays?: number },
): StreakPresence {
  const dates = checkInDates instanceof Set ? checkInDates : new Set(checkInDates);
  let graceLeft = Math.max(0, options?.graceDays ?? DEFAULT_STREAK_GRACE_DAYS);
  let streak = 0;
  let graceConsumed = false;

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateString = getLocalDateString(checkDate);

    if (dates.has(dateString)) {
      streak++;
      continue;
    }

    if (i === 0) {
      // Hoy todavía no: no rompe.
      continue;
    }

    if (graceLeft > 0) {
      graceLeft -= 1;
      graceConsumed = true;
      continue;
    }

    break;
  }

  return { streak, usedGrace: graceConsumed && streak > 0 };
}

/**
 * Racha = días consecutivos con fila en daily_check_ins (misma lógica que Hoy / Yo),
 * con 1 día de gracia suave.
 */
export async function fetchStreakPresence(
  supabase: SupabaseClient,
  userId: string,
): Promise<StreakPresence> {
  const today = new Date();
  const checkInDates = new Set<string>();
  const oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 365);

  const start = getLocalDateString(oneYearAgo);
  const end = getLocalDateString(today);

  const { data: checkIns } = await supabase
    .from('daily_check_ins')
    .select('date')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end);

  if (checkIns) {
    checkIns.forEach((row: { date: string }) => checkInDates.add(row.date));
  }

  return computeCurrentStreak(checkInDates, today);
}

export async function fetchCurrentStreak(supabase: SupabaseClient, userId: string): Promise<number> {
  const { streak } = await fetchStreakPresence(supabase, userId);
  return streak;
}

export const STREAK_MILESTONE_DAYS = [7, 14, 30, 60, 90] as const;

export function isStreakMilestone(streak: number): boolean {
  return (STREAK_MILESTONE_DAYS as readonly number[]).includes(streak);
}
