import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Task } from '@/components/tasks/TaskCard';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { useI18n } from '@/contexts/I18nContext';
import {
  hasReflectedToday,
  markReflectedToday,
} from '@/lib/vnext/dayReflectionStorage';
import { executeDayReflectionReplan } from '@/lib/vnext/executeDayReflectionReplan';
import {
  reflectionToReorganizeReason,
  type DayReflectionOutcome,
} from '@/lib/vnext/dayReflection';
import type { ReorganizeWeekProposal } from '@/lib/lifeAreas/types';

type UseHoyDayReflectionOptions = {
  userId?: string;
  hasCheckIn: boolean;
  priorityStats: FocusProgressStats;
  incompleteCount: number;
  onTasksReload: () => void | Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

export function useHoyDayReflection({
  userId,
  hasCheckIn,
  priorityStats,
  incompleteCount,
  onTasksReload,
  showToast,
}: UseHoyDayReflectionOptions) {
  const { t, locale } = useI18n();
  const [reflectedToday, setReflectedToday] = useState(false);
  const [checkingReflection, setCheckingReflection] = useState(Boolean(userId));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<DayReflectionOutcome | null>(null);
  const [replanning, setReplanning] = useState(false);
  const [lastProposal, setLastProposal] = useState<ReorganizeWeekProposal | null>(null);

  useEffect(() => {
    if (!userId) {
      setCheckingReflection(false);
      setReflectedToday(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setCheckingReflection(true);
      const done = await hasReflectedToday(userId);
      if (!cancelled) {
        setReflectedToday(done);
        setCheckingReflection(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const shouldShowCard = useMemo(
    () =>
      Boolean(userId) &&
      hasCheckIn &&
      !checkingReflection &&
      !reflectedToday &&
      incompleteCount > 0,
    [checkingReflection, hasCheckIn, incompleteCount, reflectedToday, userId],
  );

  const openReflection = useCallback(() => {
    setSelectedOutcome(null);
    setSheetOpen(true);
  }, []);

  const closeReflection = useCallback(() => {
    if (replanning) return;
    setSheetOpen(false);
  }, [replanning]);

  const dismissSuccess = useCallback(() => {
    setSuccessOpen(false);
    setLastProposal(null);
  }, []);

  const handleReplan = useCallback(async () => {
    if (!userId || !selectedOutcome) return;

    setReplanning(true);
    try {
      const reason = reflectionToReorganizeReason(selectedOutcome);
      const result = await executeDayReflectionReplan(
        userId,
        reason,
        locale,
        t('projectsUi.looseTitle'),
      );

      if (!result.ok) {
        showToast(t('vnext.replanError'), 'error');
        return;
      }

      await markReflectedToday(userId);
      setReflectedToday(true);
      setSheetOpen(false);
      setLastProposal(result.proposal);
      setSuccessOpen(true);
      await onTasksReload();

      if (result.movedCount > 0) {
        showToast(t('vnext.replanSuccessToast', { count: result.movedCount }), 'success');
      } else {
        showToast(t('vnext.replanCalmToast'), 'info');
      }
    } finally {
      setReplanning(false);
    }
  }, [locale, onTasksReload, selectedOutcome, showToast, t, userId]);

  return {
    shouldShowCard,
    sheetOpen,
    successOpen,
    selectedOutcome,
    replanning,
    lastProposal,
    openReflection,
    closeReflection,
    dismissSuccess,
    setSelectedOutcome,
    handleReplan,
  };
}
