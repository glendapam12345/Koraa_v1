import type { SupabaseClient } from '@supabase/supabase-js';
import { getLocalDateString } from '@/lib/dateLocal';

/**
 * Racha = días consecutivos con fila en daily_check_ins (misma lógica que Hoy / Yo).
 */
export async function fetchCurrentStreak(supabase: SupabaseClient, userId: string): Promise<number> {
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

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateString = getLocalDateString(checkDate);

    if (checkInDates.has(dateString)) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export const STREAK_MILESTONE_DAYS = [7, 14, 30, 60, 90] as const;

export function isStreakMilestone(streak: number): boolean {
  return (STREAK_MILESTONE_DAYS as readonly number[]).includes(streak);
}
