import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { useI18n } from '@/contexts/I18nContext';
import {
  hasReflectedToday,
  markReflectedToday,
} from '@/lib/vnext/dayReflectionStorage';
import {
  applyDayReplanAssignments,
  buildDayReplanPlan,
} from '@/lib/vnext/executeDayReflectionReplan';
import type { ReorganizeWeekProposal, WhatChangedReason } from '@/lib/lifeAreas/types';
import {
  resolveProactiveReflectionVariant,
  shouldShowProactiveReflectionCard,
  type ProactiveReflectionVariant,
} from '@/lib/hoy/proactivePlanSignals';

type UseHoyDayReflectionOptions = {
  userId?: string;
  hasCheckIn: boolean;
  priorityStats: FocusProgressStats;
  incompleteCount: number;
  isOverloaded?: boolean;
  energyLevel?: number;
  onTasksReload: () => void | Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

export function useHoyDayReflection({
  userId,
  hasCheckIn,
  incompleteCount,
  isOverloaded = false,
  energyLevel = 0,
  priorityStats,
  onTasksReload,
  showToast,
}: UseHoyDayReflectionOptions) {
  const { t, locale } = useI18n();
  const [reflectedToday, setReflectedToday] = useState(false);
  const [checkingReflection, setCheckingReflection] = useState(Boolean(userId));
  const [flowOpen, setFlowOpen] = useState(false);
  const [step, setStep] = useState<'reason' | 'preview'>('reason');
  const [selectedReason, setSelectedReason] = useState<WhatChangedReason | null>(null);
  const [buildingPreview, setBuildingPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<ReorganizeWeekProposal | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<
    { id: string; scheduled_date: string }[]
  >([]);

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
      !checkingReflection &&
      shouldShowProactiveReflectionCard({
        hasCheckIn,
        reflectedToday,
        incompleteCount,
        isOverloaded,
        energyLevel,
        priorityStats,
      }),
    [
      checkingReflection,
      energyLevel,
      hasCheckIn,
      incompleteCount,
      isOverloaded,
      priorityStats,
      reflectedToday,
      userId,
    ],
  );

  const reflectionVariant: ProactiveReflectionVariant = useMemo(
    () => resolveProactiveReflectionVariant(energyLevel, priorityStats),
    [energyLevel, priorityStats],
  );

  const resetFlow = useCallback(() => {
    setStep('reason');
    setSelectedReason(null);
    setPreviewProposal(null);
    setPendingAssignments([]);
    setBuildingPreview(false);
    setApplying(false);
  }, []);

  const openReflection = useCallback(() => {
    resetFlow();
    setFlowOpen(true);
  }, [resetFlow]);

  const closeReflection = useCallback(() => {
    if (buildingPreview || applying) return;
    setFlowOpen(false);
    resetFlow();
  }, [applying, buildingPreview, resetFlow]);

  const buildPreview = useCallback(
    async (reason: WhatChangedReason) => {
      if (!userId) return;
      setBuildingPreview(true);
      try {
        const result = await buildDayReplanPlan(
          userId,
          reason,
          locale,
          t('projectsUi.looseTitle'),
        );
        if (!result.ok) {
          showToast(t('vnext.replanError'), 'error');
          return;
        }
        setPreviewProposal(result.proposal);
        setPendingAssignments(result.assignments);
        setStep('preview');
      } finally {
        setBuildingPreview(false);
      }
    },
    [locale, showToast, t, userId],
  );

  const handleSelectReason = useCallback(
    (reason: WhatChangedReason) => {
      setSelectedReason(reason);
      void buildPreview(reason);
    },
    [buildPreview],
  );

  const handleBackToReason = useCallback(() => {
    if (applying) return;
    setStep('reason');
    setPreviewProposal(null);
    setPendingAssignments([]);
  }, [applying]);

  const handleConfirm = useCallback(async () => {
    if (!userId || !selectedReason) return;

    setApplying(true);
    try {
      const applied = await applyDayReplanAssignments(userId, pendingAssignments);
      if (!applied.ok) {
        showToast(t('vnext.replanError'), 'error');
        return;
      }

      await markReflectedToday(userId);
      setReflectedToday(true);
      setFlowOpen(false);
      resetFlow();
      await onTasksReload();

      if (applied.movedCount > 0) {
        showToast(t('vnext.replanSuccessToast', { count: applied.movedCount }), 'success');
      } else {
        showToast(t('vnext.replanCalmToast'), 'info');
      }
    } finally {
      setApplying(false);
    }
  }, [
    onTasksReload,
    pendingAssignments,
    resetFlow,
    selectedReason,
    showToast,
    t,
    userId,
  ]);

  return {
    shouldShowCard,
    reflectionVariant,
    flowOpen,
    step,
    selectedReason,
    buildingPreview,
    applying,
    previewProposal,
    openReflection,
    closeReflection,
    handleSelectReason,
    handleBackToReason,
    handleConfirm,
  };
}
