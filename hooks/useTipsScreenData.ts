import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { getLocalDateString } from '@/lib/dateLocal';

export type TipsUserProfile = {
  age?: number;
  favorite_activities?: string[];
  interests?: string[];
  other_preferences?: Record<string, unknown>;
};

type TipsCheckInState = {
  todayMood: string;
  energyLevel: number;
  availableTime: string;
  focusLevel: string;
};

const EMPTY_CHECK_IN: TipsCheckInState = {
  todayMood: '',
  energyLevel: 0,
  availableTime: '',
  focusLevel: '',
};

export function useTipsScreenData(userId: string | undefined) {
  const [checkIn, setCheckIn] = useState<TipsCheckInState>(EMPTY_CHECK_IN);
  const [userProfile, setUserProfile] = useState<TipsUserProfile | null>(null);
  const [checkInReady, setCheckInReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const applyCheckInRow = useCallback((row: {
    emotion: string;
    energy_level: number;
    available_time: string;
    focus_level: string | null;
  } | null) => {
    if (row) {
      setCheckIn({
        todayMood: row.emotion.toLowerCase(),
        energyLevel: row.energy_level,
        availableTime: row.available_time,
        focusLevel: row.focus_level || '',
      });
    } else {
      setCheckIn(EMPTY_CHECK_IN);
    }
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const profileRes = await fetchProfilePreferences(uid);
      if (profileRes.error) {
        console.error('Error cargando perfil:', profileRes.error);
        setUserProfile(null);
        return;
      }
      if (profileRes.data) {
        setUserProfile({
          age: profileRes.data.age ?? undefined,
          favorite_activities: profileRes.data.favorite_activities,
          interests: profileRes.data.interests,
          other_preferences: profileRes.data.other_preferences,
        });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error inesperado cargando perfil Tips:', error);
    }
  }, []);

  const loadCheckIn = useCallback(async () => {
    if (!userId) {
      setCheckIn(EMPTY_CHECK_IN);
      setCheckInReady(true);
      return;
    }

    const today = getLocalDateString();
    try {
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time, focus_level')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando check-in:', error);
      } else {
        applyCheckInRow(data);
      }
    } catch (error) {
      console.error('Error inesperado en Tips check-in:', error);
    } finally {
      setCheckInReady(true);
    }
  }, [userId, applyCheckInRow]);

  const load = useCallback(
    async (options?: { includeProfile?: boolean }) => {
      if (!userId) {
        setCheckIn(EMPTY_CHECK_IN);
        setUserProfile(null);
        setCheckInReady(true);
        return;
      }

      await loadCheckIn();

      if (options?.includeProfile !== false) {
        void loadProfile(userId);
      }
    },
    [userId, loadCheckIn, loadProfile],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load({ includeProfile: true });
    setRefreshing(false);
  }, [load]);

  return {
    ...checkIn,
    userProfile,
    checkInReady,
    refreshing,
    load,
    loadCheckIn,
    loadProfile,
    refresh,
  };
};
