import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { fetchStreakPresence } from '@/lib/streak';

export function useStreak(userId: string | undefined) {
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [usedGrace, setUsedGrace] = useState(false);

  const loadStreak = useCallback(async () => {
    if (!userId) return;
    try {
      const presence = await fetchStreakPresence(supabase, userId);
      setCurrentStreak(presence.streak);
      setUsedGrace(presence.usedGrace);
    } catch (error) {
      logger.debug('Error cargando racha:', error);
    }
  }, [userId]);

  return {
    currentStreak,
    usedGrace,
    loadStreak,
  };
}
