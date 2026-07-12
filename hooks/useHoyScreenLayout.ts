import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import {
  resolveHoyLiteLayout,
  isHoyLiteCompactOptedOut,
  optOutHoyLiteLayout,
  consumeHoyDayTwoUnlockToast,
} from '@/lib/hoyLiteDay';
import { consumeDeferredOnboardingPaywall } from '@/lib/deferredOnboardingPaywall';
import { openPostHoyPaywall } from '@/lib/onboardingNavigation';
import { consumePrioritiesReadyToast } from '@/lib/prioritiesReadyToast';
import { consumeCheckInReplanSummary } from '@/lib/checkInReplanSummary';

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
  const [hoyLiteCompactOptedOut, setHoyLiteCompactOptedOut] = useState(false);
  const [showSecondaryModules, setShowSecondaryModules] = useState(false);
  const [checkInReplanCoachLine, setCheckInReplanCoachLine] = useState<string | null>(null);

  const handleOptOutHoyLite = useCallback(async () => {
    if (!userId) return;
    await optOutHoyLiteLayout(userId);
    setHoyLiteCompactOptedOut(true);
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
        const [lite, compactOptedOut] = await Promise.all([
          resolveHoyLiteLayout(userId),
          isHoyLiteCompactOptedOut(userId),
        ]);
        if (cancelled) return;
        setHoyLiteLayout(lite);
        setHoyLiteCompactOptedOut(compactOptedOut);

        if (!lite) {
          const showDayTwoUnlock = await consumeHoyDayTwoUnlockToast(userId);
          if (!cancelled && showDayTwoUnlock) {
            showToast(t('hoy.dayTwoUnlockToast'), 'info');
          }
        }

        const showPostHoyPaywall = await consumeDeferredOnboardingPaywall(userId);
        if (!cancelled && showPostHoyPaywall) {
          setTimeout(() => {
            openPostHoyPaywall();
          }, 6500);
        }

        try {
          const secondaryRaw = await AsyncStorage.getItem(`hoy_secondary_modules_${userId}_v1`);
          if (cancelled) return;
          if (secondaryRaw === '1') {
            setShowSecondaryModules(true);
          } else if (secondaryRaw === '0') {
            setShowSecondaryModules(false);
          } else {
            // Día 2+ o vista completa: extras visibles por defecto
            setShowSecondaryModules(!lite || compactOptedOut);
          }
        } catch {
          if (!cancelled) setShowSecondaryModules(!lite || compactOptedOut);
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
        const replanSummary = userId ? await consumeCheckInReplanSummary(userId) : null;
        if (cancelled) return;

        if (replanSummary) {
          setCheckInReplanCoachLine(replanSummary.subline || replanSummary.headline);
          const toastParts = [replanSummary.headline];
          if (replanSummary.movedCount > 0) {
            toastParts.push(
              t('hoy.checkInReplanMoved', { count: replanSummary.movedCount }),
            );
          }
          if (replanSummary.boostedCount > 0) {
            toastParts.push(
              t('hoy.checkInReplanBoosted', { count: replanSummary.boostedCount }),
            );
          }
          showToast(toastParts.join(' · '), 'info');
        } else if (showPrioritiesReady) {
          showToast(t('sentir.checkInSavedToast'), 'success');
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [userId, loadTodayCheckIn, loadTasks, showToast, t]),
  );

  const hoyPreFlowActive = !loading && !todayMood;
  const hoyRestOfDayExpanded = Boolean(todayMood) && showSecondaryModules;
  const hoyLiteCompactLayout = hoyLiteLayout === true && !hoyLiteCompactOptedOut;

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
    hoyLiteCompactLayout,
    hoyRestOfDayExpanded,
    showSecondaryModules,
    setShowSecondaryModules,
    handleShowMoreForHoy,
    handleOptOutHoyLite,
    checkInReplanCoachLine,
  };
}
