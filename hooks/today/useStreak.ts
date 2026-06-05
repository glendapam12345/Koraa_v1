import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { fetchCurrentStreak } from '@/lib/streak';

export function useStreak(userId: string | undefined) {
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  const loadStreak = useCallback(async () => {
    if (!userId) return;
    try {
      const streak = await fetchCurrentStreak(supabase, userId);
      setCurrentStreak(streak);
    } catch (error) {
      logger.debug('Error cargando racha:', error);
    }
  }, [userId]);

  return {
    currentStreak,
    loadStreak,
  };
}
