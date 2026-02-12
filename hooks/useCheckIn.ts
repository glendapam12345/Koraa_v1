import { useState, useCallback } from 'react';
import { supabase, getErrorMessage } from '@/lib/supabase';

interface CheckInData {
  emotion: string;
  energy_level: number;
  available_time: string;
  focus_level: string;
}

interface UseCheckInReturn {
  todayMood: string;
  energy: string;
  energyLevel: number;
  time: string;
  focusLevel: string;
  loading: boolean;
  loadTodayCheckIn: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useCheckIn(
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
): UseCheckInReturn {
  const [todayMood, setTodayMood] = useState<string>('');
  const [energy, setEnergy] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [time, setTime] = useState<string>('');
  const [focusLevel, setFocusLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time, focus_level')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando check-in:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        return;
      }

      if (checkIn) {
        setTodayMood(checkIn.emotion.toLowerCase());
        setEnergy(`${checkIn.energy_level}/5`);
        setEnergyLevel(checkIn.energy_level);
        setTime(checkIn.available_time);
        setFocusLevel(checkIn.focus_level || '');
      } else {
        setTodayMood('');
        setEnergy('');
        setEnergyLevel(0);
        setTime('');
        setFocusLevel('');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    todayMood,
    energy,
    energyLevel,
    time,
    focusLevel,
    loading,
    loadTodayCheckIn,
    showToast,
  };
}
