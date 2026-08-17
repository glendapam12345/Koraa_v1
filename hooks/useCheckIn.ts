import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase, getErrorMessage, getCachedAuthUser } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getLocalDateString } from '@/lib/dateLocal';
import { TimeoutError, withTimeout } from '@/lib/withTimeout';
import { useI18n } from '@/contexts/I18nContext';
import { parseRecentCheckIns, type ReturnMemory } from '@/lib/returnMemory';

export function useCheckIn(showToast: (message: string, type: 'success' | 'error' | 'info') => void) {
  const { t } = useI18n();
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [time, setTime] = useState<string>('');
  const [focusLevel, setFocusLevel] = useState<string>('');
  const [returnMemory, setReturnMemory] = useState<ReturnMemory | null>(null);
  const [loading, setLoading] = useState(true);

  const clearToday = () => {
    setTodayMood(null);
    setEnergyLevel(0);
    setEnergy('');
    setTime('');
    setFocusLevel('');
  };

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const user = await getCachedAuthUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = getLocalDateString();
      const { data, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from('daily_check_ins')
            .select('date, emotion, energy_level, available_time, focus_level')
            .eq('user_id', user.id)
            .lte('date', today)
            .order('date', { ascending: false })
            .limit(2),
        ),
        12_000,
      );

      if (error) {
        logger.error('Error cargando check-in:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        clearToday();
        setReturnMemory(null);
        setLoading(false);
        return;
      }

      const parsed = parseRecentCheckIns(data ?? [], today);
      if (parsed.today) {
        setTodayMood(parsed.today.emotion);
        setEnergyLevel(parsed.today.energyLevel);
        setEnergy(parsed.today.energyLevel ? `${parsed.today.energyLevel}/5` : '');
        setTime(parsed.today.time);
        setFocusLevel(parsed.today.focusLevel);
      } else {
        setTodayMood(null);
        setEnergyLevel(0);
        setEnergy('');
        setTime('');
        setFocusLevel('');
      }
      setReturnMemory(parsed.memory);

      setLoading(false);
    } catch (error) {
      if (error instanceof TimeoutError) {
        logger.warn('Check-in load timeout');
        showToast(t('errors.refreshFailed'), 'error');
      } else {
        logger.error('Error inesperado cargando check-in:', error);
      }
      clearToday();
      setReturnMemory(null);
      setLoading(false);
    }
  }, [showToast, t]);

  const lastLoadedDayRef = useRef(getLocalDateString());

  useEffect(() => {
    const tick = () => {
      const today = getLocalDateString();
      if (today === lastLoadedDayRef.current) return;
      lastLoadedDayRef.current = today;
      void loadTodayCheckIn();
    };
    const interval = setInterval(tick, 60_000);
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      tick();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [loadTodayCheckIn]);

  return {
    todayMood,
    energy,
    energyLevel,
    time,
    focusLevel,
    returnMemory,
    loading,
    loadTodayCheckIn,
  };
}
