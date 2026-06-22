import { useState, useCallback } from 'react';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getLocalDateString } from '@/lib/dateLocal';
import { TimeoutError, withTimeout } from '@/lib/withTimeout';
import { useI18n } from '@/contexts/I18nContext';

export function useCheckIn(showToast: (message: string, type: 'success' | 'error' | 'info') => void) {
  const { t } = useI18n();
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [time, setTime] = useState<string>('');
  const [focusLevel, setFocusLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = getLocalDateString();
      const { data, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from('daily_check_ins')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle(),
        ),
        12_000,
      );

      if (error) {
        logger.error('Error cargando check-in:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        setTodayMood(null);
        setEnergyLevel(0);
        setEnergy('');
        setTime('');
        setFocusLevel('');
        setLoading(false);
        return;
      }

      if (data) {
        setTodayMood(data.emotion);
        setEnergyLevel(data.energy_level || 0);
        setEnergy(data.energy_level ? `${data.energy_level}/5` : '');
        setTime(data.available_time || '');
        setFocusLevel(data.focus_level || '');
      } else {
        setTodayMood(null);
        setEnergyLevel(0);
        setEnergy('');
        setTime('');
        setFocusLevel('');
      }

      setLoading(false);
    } catch (error) {
      if (error instanceof TimeoutError) {
        logger.warn('Check-in load timeout');
        showToast(t('errors.refreshFailed'), 'error');
      } else {
        logger.error('Error inesperado cargando check-in:', error);
      }
      setTodayMood(null);
      setEnergyLevel(0);
      setEnergy('');
      setTime('');
      setFocusLevel('');
      setLoading(false);
    }
  }, [showToast, t]);

  return {
    todayMood,
    energy,
    energyLevel,
    time,
    focusLevel,
    loading,
    loadTodayCheckIn,
  };
}
