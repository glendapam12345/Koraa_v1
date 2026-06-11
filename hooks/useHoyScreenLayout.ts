import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { resolveHoyLiteLayout, optOutHoyLiteLayout } from '@/lib/hoyLiteDay';
import {
  dismissDayChangedCard,
  shouldShowDayChangedCard,
} from '@/lib/hoyDayFlowDismiss';
import { consumePrioritiesReadyToast } from '@/lib/prioritiesReadyToast';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

type UseHoyScreenLayoutArgs = {
  userId: string | undefined;
  loading: boolean;
  todayMood: string | null;
  showToast: ToastFn;
  loadTodayCheckIn: () => Promise<void>;
  loadTasks: () => Promise<void>;
  scrollRef: RefObject<ScrollView | null>;
};

export function useHoyScreenLayout({
  userId,
  loading,
  todayMood,
  showToast,
  loadTodayCheckIn,
  loadTasks,
  scrollRef,
}: UseHoyScreenLayoutArgs) {
  const { t } = useI18n();
  const [hoyLiteLayout, setHoyLiteLayout] = useState<boolean | null>(null);
  const [showSecondaryModules, setShowSecondaryModules] = useState(false);
  const [showDayChangedCard, setShowDayChangedCard] = useState(false);
  const handleOptOutHoyLite = useCallback(async () => {
    if (!userId) return;
    await optOutHoyLiteLayout(userId);
    setHoyLiteLayout(false);
    setShowSecondaryModules(true);
    showToast(t('hoy.showAllSectionsToast'), 'info');
  }, [userId, showToast, t]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setHoyLiteLayout(null);
        return;
      }
      let cancelled = false;
      void (async () => {
        const lite = await resolveHoyLiteLayout(userId);
        if (cancelled) return;
        setHoyLiteLayout(lite);

        try {
          const secondaryRaw = await AsyncStorage.getItem(`hoy_secondary_modules_${userId}_v1`);
          if (cancelled) return;
          if (secondaryRaw === '1') {
            setShowSecondaryModules(true);
          } else if (secondaryRaw === '0') {
            setShowSecondaryModules(false);
          } else {
            // Día 2+: meditación, consejos y resto del día visibles por defecto
            setShowSecondaryModules(!lite);
          }
        } catch {
          if (!cancelled) setShowSecondaryModules(!lite);
        }
      })();
      void (async () => {
        try {
          const { syncAll } = await import('@/lib/offlineStorage');
          await syncAll();
        } catch {
          // no crítico
        }
        if (cancelled) return;
        await Promise.all([loadTodayCheckIn(), loadTasks()]);
        if (cancelled) return;
        const showPrioritiesReady = await consumePrioritiesReadyToast();
        if (showPrioritiesReady && !cancelled) {
          showToast(t('sentir.checkInSavedToast'), 'success');
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [userId, loadTodayCheckIn, loadTasks, showToast, t]),
  );

  useEffect(() => {
    if (!userId || !todayMood) {
      setShowDayChangedCard(false);
      return;
    }
    let cancelled = false;
    void shouldShowDayChangedCard(userId).then((show) => {
      if (!cancelled) setShowDayChangedCard(show);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, todayMood]);

  const handleDismissDayChangedCard = useCallback(() => {
    if (userId) void dismissDayChangedCard(userId);
    setShowDayChangedCard(false);
  }, [userId]);

  const hoyPreFlowActive = !loading && !todayMood;
  const hoyRestOfDayExpanded = Boolean(todayMood) && showSecondaryModules;

  const handleShowMoreForHoy = useCallback(() => {
    setShowSecondaryModules(true);
    showToast(t('hoy.liteExpandedToast'), 'info');
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 280, animated: true });
    }, 150);
  }, [scrollRef, showToast, t]);

  useEffect(() => {
    if (!userId || hoyPreFlowActive) return;
    void AsyncStorage.setItem(
      `hoy_secondary_modules_${userId}_v1`,
      showSecondaryModules ? '1' : '0',
    );
  }, [userId, showSecondaryModules, hoyPreFlowActive]);

  return {
    hoyLiteLayout,
    hoyPreFlowActive,
    hoyRestOfDayExpanded,
    showSecondaryModules,
    showDayChangedCard,
    setShowSecondaryModules,
    handleOptOutHoyLite,
    handleDismissDayChangedCard,
    handleShowMoreForHoy,
  };
}
