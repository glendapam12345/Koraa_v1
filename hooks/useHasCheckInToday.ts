import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';

/** Check-in de hoy presente (solo booleano, para tabs a11y). */
export function useHasCheckInToday(userId: string | undefined) {
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setHasCheckInToday(null);
      return;
    }
    try {
      const today = getLocalDateString();
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        logger.debug('useHasCheckInToday:', error);
        setHasCheckInToday(false);
        return;
      }
      setHasCheckInToday(Boolean(data));
    } catch {
      setHasCheckInToday(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { hasCheckInToday, refresh };
}
