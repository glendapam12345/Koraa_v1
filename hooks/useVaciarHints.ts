import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCachedAuthUser } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const VACIAR_DICTATE_HINT_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_dictate_hint_dismissed_v1_${userId}`;

export function useVaciarHints(userId: string | undefined) {
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [dictateHintDismissed, setDictateHintDismissed] = useState(false);

  const loadHintState = useCallback(async () => {
    try {
      const user = await getCachedAuthUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        logger.error('Error verificando tareas:', error);
        return;
      }

      setHasTasks((data?.length || 0) > 0);

      try {
        const dismissed =
          (await AsyncStorage.getItem(VACIAR_DICTATE_HINT_DISMISSED_KEY(user.id))) === '1';
        setDictateHintDismissed(dismissed);
      } catch {
        setDictateHintDismissed(false);
      }
    } catch (error) {
      logger.error('Error inesperado:', error);
    }
  }, []);

  const dismissDictateHint = useCallback(async () => {
    if (userId) {
      try {
        await AsyncStorage.setItem(VACIAR_DICTATE_HINT_DISMISSED_KEY(userId), '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setDictateHintDismissed(true);
  }, [userId]);

  return {
    hasTasks,
    setHasTasks,
    dictateHintDismissed,
    loadHintState,
    dismissDictateHint,
  };
}
