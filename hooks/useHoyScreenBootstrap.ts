import { useState, useEffect, useCallback, useMemo, type RefObject } from 'react';
import { Platform, type ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { subscribeCheckInCelebration, consumeQueuedCheckInCelebration, publishCheckInCelebration } from '@/lib/checkInCelebration';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';
import { getDisplayName } from '@/lib/displayName';
import { getTimeOfDayGreetingKey, getTimeOfDayPeriod } from '@/lib/timeOfDayContext';
import { logger } from '@/lib/logger';
import {
  hasSeenQuickOnboardingGuide,
  markQuickOnboardingGuideSeen,
} from '@/lib/quickOnboardingGuide';

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
    const { syncProfileDisplayNameFromAuth } = await import('@/lib/syncProfileDisplayName');
    const synced = await syncProfileDisplayNameFromAuth(user.id, user.user_metadata);
    if (synced) {
      setProfileFullName(synced);
      return;
    }
    const { data } = await fetchProfilePreferences(user.id);
    setProfileFullName(data?.full_name?.trim() || undefined);
  }, [user?.id, user?.user_metadata]);

  const displayName = useMemo(
    () =>
      getDisplayName(
        { full_name: profileFullName, user_metadata: user?.user_metadata, email: user?.email },
        t('yo.welcomeName'),
      ),
    [profileFullName, user?.user_metadata, user?.email, t],
  );

  const getGreeting = useMemo(() => {
    return t(getTimeOfDayGreetingKey(getTimeOfDayPeriod()));
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
  }, [loadStreak, loadTodayCheckIn, showToast, t, setShowConfetti, confettiTimeoutRef]);

  useEffect(() => {
    void loadTasks();
    void loadTodayCheckIn();
    void loadStreak();
    void loadProfileName();
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
        const queued = await consumeQueuedCheckInCelebration();
        if (queued) {
          setTimeout(() => publishCheckInCelebration(queued), 450);
        }
      } catch (error) {
        logger.debug('Error consuming queued celebration:', error);
      }
    })();

    void (async () => {
      try {
        const seen = await hasSeenQuickOnboardingGuide();
        if (!seen) {
          setTimeout(() => setShowQuickOnboarding(true), 800);
          await markQuickOnboardingGuideSeen();
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
