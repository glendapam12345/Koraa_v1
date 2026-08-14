import { supabase } from '@/lib/supabase';
import { getFirstName, getDisplayName } from '@/lib/displayName';
import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import type { NotificationContext } from '@/lib/notificationCopyBank';

/**
 * Contexto ligero para elegir copy de notificaciones
 * (patrones recientes — sin LLM en el scheduling local).
 */
export async function loadNotificationContext(
  userId: string,
  salt?: number,
): Promise<NotificationContext> {
  const ctx: NotificationContext = { salt };

  try {
    const [{ data: profile }, auth] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
      supabase.auth.getUser(),
    ]);

    const user = auth.data?.user;
    const display = getDisplayName(
      {
        full_name: profile?.full_name,
        user_metadata: user?.user_metadata,
      },
      '',
    );
    const first = getFirstName(display);
    if (first) ctx.firstName = first;

    const { data: checkIns } = await supabase
      .from('daily_check_ins')
      .select('date, emotion, energy_level')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5);

    if (checkIns && checkIns.length > 0) {
      const last = checkIns[0]!;
      if (typeof last.emotion === 'string' && last.emotion.trim()) {
        ctx.lastEmotion = last.emotion.trim().toLowerCase();
      }

      const energies = checkIns
        .map((row) => Number(row.energy_level))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
      if (energies.length > 0) {
        ctx.avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
      }

      const lastDate = parseLocalDateString(String(last.date));
      const today = parseLocalDateString(getLocalDateString());
      if (lastDate && today) {
        const diffMs = today.getTime() - lastDate.getTime();
        ctx.daysSinceCheckIn = Math.max(0, Math.round(diffMs / 86_400_000));
      }
    } else {
      ctx.daysSinceCheckIn = 99;
    }
  } catch {
    /* contexto vacío = pool default */
  }

  return ctx;
}
