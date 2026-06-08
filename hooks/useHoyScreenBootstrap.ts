import { useState, useEffect, useCallback, useMemo, type RefObject } from 'react';
import { Platform, type ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';
import { getDisplayName } from '@/lib/displayName';
import { logger } from '@/lib/logger';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

type UseHoyScreenBootstrapOptions = {
  user: { id?: string; user_metadata?: Record<string, unknown>; email?: string } | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  showToast: ToastFn;
  openRecheck?: string;
  recheckSource?: string;
  loadTasks: () => void | Promise<void>;
  loadTodayCheckIn: () => void | Promise<void>;
  loadStreak: () => void | Promise<void>;
  loadEmotionalMemory: () => void | Promise<void>;
  clearToggleTimers: () => void;
  confettiTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
  backgroundLoadTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
  setShowConfetti: (value: boolean) => void;
  setShowQuickOnboarding: (value: boolean) => void;
};

export function useHoyScreenBootstrap({
  user,
  t,
  showToast,
  openRecheck,
  recheckSource,
  loadTasks,
  loadTodayCheckIn,
  loadStreak,
  loadEmotionalMemory,
  clearToggleTimers,
  confettiTimeoutRef,
  backgroundLoadTimeoutRef,
  setShowConfetti,
  setShowQuickOnboarding,
}: UseHoyScreenBootstrapOptions) {
  const [refreshing, setRefreshing] = useState(false);
  const [profileFullName, setProfileFullName] = useState<string | undefined>();

  const loadProfileName = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await fetchProfilePreferences(user.id);
    setProfileFullName(data?.full_name?.trim() || undefined);
  }, [user?.id]);

  const displayName = useMemo(
    () =>
      getDisplayName(
        { full_name: profileFullName, user_metadata: user?.user_metadata, email: user?.email },
        t('yo.welcomeName'),
      ),
    [profileFullName, user?.user_metadata, user?.email, t],
  );

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('hoy.greetingMorning');
    if (hour < 18) return t('hoy.greetingAfternoon');
    return t('hoy.greetingEvening');
  }, [t]);

  useEffect(() => {
    if (openRecheck !== '1') return;
    openRecheckCheckIn(typeof recheckSource === 'string' ? recheckSource : 'deeplink');
    router.setParams({ openRecheck: undefined, recheckSource: undefined });
  }, [openRecheck, recheckSource]);

  useEffect(() => {
    return subscribeCheckInRefresh(() => {
      void loadTodayCheckIn();
      void loadTasks();
    });
  }, [loadTodayCheckIn, loadTasks]);

  useEffect(() => {
    const unsub = subscribeCheckInCelebration((p) => {
      void loadStreak();
      void loadTodayCheckIn();
      void loadEmotionalMemory();
      if (p.milestone) {
        setShowConfetti(true);
        showToast(t('hoyPlanFallback.streakToast'), 'success');
        if (confettiTimeoutRef.current) {
          clearTimeout(confettiTimeoutRef.current);
        }
        confettiTimeoutRef.current = setTimeout(() => {
          setShowConfetti(false);
          confettiTimeoutRef.current = null;
        }, 3500);
        if (Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        if (Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    });
    return unsub;
  }, [loadStreak, loadTodayCheckIn, loadEmotionalMemory, showToast, t, setShowConfetti, confettiTimeoutRef]);

  useEffect(() => {
    void loadTasks();
    void loadTodayCheckIn();
    void loadStreak();
    void loadProfileName();
    void loadEmotionalMemory();

    void (async () => {
      try {
        const { syncAll } = await import('@/lib/offlineStorage');
        await syncAll();
      } catch (error) {
        logger.debug('Sincronización offline:', error);
      }
    })();

    void (async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenQuickOnboarding');
        if (!hasSeenOnboarding) {
          setTimeout(() => setShowQuickOnboarding(true), 800);
          await AsyncStorage.setItem('hasSeenQuickOnboarding', 'true');
        }
      } catch (error) {
        logger.debug('Error checking onboarding:', error);
      }
    })();

    return () => {
      clearToggleTimers();
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = null;
      }
      if (backgroundLoadTimeoutRef.current) {
        clearTimeout(backgroundLoadTimeoutRef.current);
        backgroundLoadTimeoutRef.current = null;
      }
    };
  }, [
    loadTasks,
    loadTodayCheckIn,
    loadStreak,
    loadProfileName,
    loadEmotionalMemory,
    clearToggleTimers,
    confettiTimeoutRef,
    backgroundLoadTimeoutRef,
    setShowQuickOnboarding,
  ]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadTasks(),
        loadTodayCheckIn(),
        loadStreak(),
        loadProfileName(),
        loadEmotionalMemory(),
      ]);
    } catch (error) {
      logger.error('Error al refrescar:', error);
      showToast(t('errors.refreshFailed'), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [
    loadTasks,
    loadTodayCheckIn,
    loadStreak,
    loadProfileName,
    loadEmotionalMemory,
    showToast,
    t,
  ]);

  return {
    refreshing,
    handleRefresh,
    displayName,
    getGreeting,
  };
}
