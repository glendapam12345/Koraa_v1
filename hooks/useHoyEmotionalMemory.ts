import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getLocalDateString } from '@/lib/dateLocal';
import { useI18n } from '@/contexts/I18nContext';
import {
  buildHoyEmotionalMemoryInsights,
  type EmotionalMemoryInsight,
} from '@/lib/hoyEmotionalMemory';

export function useHoyEmotionalMemory(userId: string | undefined) {
  const { t } = useI18n();
  const [emotionalMemoryInsights, setEmotionalMemoryInsights] = useState<EmotionalMemoryInsight[]>([]);

  const loadEmotionalMemory = useCallback(async () => {
    if (!userId) {
      setEmotionalMemoryInsights([]);
      return;
    }
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 42);

      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('date, energy_level, emotion')
        .eq('user_id', userId)
        .gte('date', getLocalDateString(fromDate))
        .order('date', { ascending: false });

      if (error || !data) {
        setEmotionalMemoryInsights([]);
        return;
      }

      setEmotionalMemoryInsights(buildHoyEmotionalMemoryInsights(data, t));
    } catch (error) {
      logger.debug('Error cargando memoria emocional:', error);
      setEmotionalMemoryInsights([]);
    }
  }, [userId, t]);

  return { emotionalMemoryInsights, loadEmotionalMemory };
}
