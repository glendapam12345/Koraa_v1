import { View, Text, StyleSheet, RefreshControl, InteractionManager } from 'react-native';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWeekTasks, type DayTasks, type WeekDayCheckIn, getWeekBoundsForStart } from '@/hooks/useWeekTasks';
import { useMonthCalendar } from '@/hooks/useMonthCalendar';
import { buildOptimisticTask } from '@/hooks/useTasks';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { useCheckIn } from '@/hooks/useCheckIn';
import { DEFAULT_CHECK_IN_TIME } from '@/lib/checkInDefaults';
import { getSupabaseEnvStatus } from '@/lib/envCheck';
import {
  Download,
} from 'lucide-react-native';
import { shareTasksCsv } from '@/lib/exportTasksCsv';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { replaceToHoyTab } from '@/lib/tabNavigation';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { SemanaCalendarGrid } from '@/components/semana/SemanaCalendarGrid';
import { TabScreenErrorBoundary } from '@/components/TabScreenErrorBoundary';
import { SemanaWeekNav } from '@/components/semana/SemanaWeekNav';
import { SemanaProjectFilter } from '@/components/semana/SemanaProjectFilter';
import { SemanaDaySection } from '@/components/semana/SemanaDaySection';
import { SemanaTodayCheckInBanner } from '@/components/semana/SemanaTodayCheckInBanner';
import { SemanaFreeLimitCard } from '@/components/semana/SemanaFreeLimitCard';
import { SemanaDraggableWeekBoard } from '@/components/semana/SemanaDraggableWeekBoard';
import { SemanaReplanPreviewBar } from '@/components/semana/SemanaReplanPreviewBar';
import { SemanaWeeklyBriefCard } from '@/components/semana/SemanaWeeklyBriefCard';
import { SemanaWeekCapacityBar } from '@/components/semana/SemanaWeekCapacityBar';
import { ReorganizeDayProposalSections } from '@/components/hoy/ReorganizeDayProposalSections';
import { useKoraaWeeklyBrief } from '@/hooks/useKoraaWeeklyBrief';
import { buildWeekCapacitySnapshot } from '@/lib/hoy/weekCapacity';
import { loadTaskPlanningMetaMap, type TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import { getDisplayName } from '@/lib/displayName';
import { SemanaRangePicker } from '@/components/semana/SemanaRangePicker';
import { useSemanaTaskDrag } from '@/hooks/useSemanaTaskDrag';
import { Toast } from '@/components/Toast';
import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import { requestHoyRefresh } from '@/lib/hoyRefreshBridge';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CalmSegmentedControl } from '@/components/ui/calm/CalmSegmentedControl';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';
import { openPaywall } from '@/lib/paywallNavigation';
import {
  FREE_CALENDAR_VISIBLE_DAYS,
  getFreeVisibleWeekTasks,
  isDateInFreeVisibleRange,
} from '@/lib/semanaFreePlan';
import {
  getBoardLayout,
  getNextWeekMonday,
  getRangeBounds,
  getWeekMonday,
  shiftAnchorDate,
  type SemanaRangeMode,
} from '@/lib/semana/rangeMode';
import { monthCalendarToDayTasks } from '@/lib/semana/monthToDayTasks';
import { parseMonthAnchor, shiftMonth } from '@/lib/calendarGrid';
import {
  applyAssignmentsToWeekTasks,
  extractAssignmentsFromWeekDraft,
  moveTaskInWeekDraft,
} from '@/lib/replanWeekDraft';
import {
  applyDayReplanAssignments,
  buildDayReplanPlan,
} from '@/lib/vnext/executeDayReflectionReplan';
import { buildWeeklyBriefReplanPlan } from '@/lib/ai/buildWeeklyBriefReplanPlan';
import { canSuggestWeekReplan } from '@/lib/ai/inferWeekReplanReason';
import type { ReorganizeWeekProposal, WhatChangedReason } from '@/lib/lifeAreas/types';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTH_NAMES_FULL_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MONTH_NAMES_FULL_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

type ViewMode = 'calendar' | 'list';

function formatDayLabel(dateStr: string, months: readonly string[]): string {
  const dayNum = parseInt(dateStr.slice(8, 10), 10);
  const month = months[parseInt(dateStr.slice(5, 7), 10) - 1];
  return `${dayNum} ${month}`;
}

function formatCheckInChip(
  checkIn: WeekDayCheckIn | undefined,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string | null {
  if (!checkIn?.emotion) return null;
  const emotionId = checkIn.emotion.toLowerCase();
  return `${t(`sentir.emotions.${emotionId}` as TranslationKey)} · ${checkIn.energy_level}/5`;
}

function SemanaScreen() {
  const { t, locale } = useI18n();
  const { planAhead: planAheadParam, replan: replanParam, replanReason: replanReasonParam } =
    useLocalSearchParams<{ planAhead?: string; replan?: string; replanReason?: string }>();
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const monthNamesFull = locale === 'en' ? MONTH_NAMES_FULL_EN : MONTH_NAMES_FULL_ES;
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const todayStr = getLocalDateString();
  const [rangeMode, setRangeMode] = useState<SemanaRangeMode>('week');
  const [rangeAnchorDate, setRangeAnchorDate] = useState<string>(todayStr);
  const todayDate = useMemo(() => new Date(), []);
  const [calendarYear, setCalendarYear] = useState(todayDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [planAheadMode, setPlanAheadMode] = useState(false);
  const planAheadAppliedRef = useRef(false);
  const focusReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [plannerDragging, setPlannerDragging] = useState(false);
  const [replanMode, setReplanMode] = useState(false);
  const [replanDraft, setReplanDraft] = useState<DayTasks[] | null>(null);
  const [replanProposal, setReplanProposal] = useState<ReorganizeWeekProposal | null>(null);
  const [replanLoading, setReplanLoading] = useState(false);
  const [replanApplying, setReplanApplying] = useState(false);
  const [replanUsedAi, setReplanUsedAi] = useState(false);
  const [planningMeta, setPlanningMeta] = useState<Record<string, TaskPlanningMeta>>({});
  const replanBootstrappedRef = useRef(false);
  const planAheadFloor = useMemo(() => getNextWeekMonday(todayStr), [todayStr]);
  const showToast = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage(msg);
      setToastType(type);
    },
    [],
  );

  const { weekTasks, checkInsByDate, projects, loading, loadWeekTasks, loadDateRange, appendTaskToDay, getWeekBounds, lastLoadError, schemaSetupType } = useWeekTasks(showToast, locale);
  const { hasCheckInToday, refresh: refreshCheckInToday } = useHasCheckInToday(user?.id);
  const { time: todayCheckInTime, loadTodayCheckIn } = useCheckIn(showToast);
  const { days: calendarDays, tasksByDate, loading: monthLoading, loadMonth, appendTaskToDate } = useMonthCalendar(
    calendarYear,
    calendarMonth,
    showToast,
    locale,
  );
  const envStatus = getSupabaseEnvStatus();
  const supabaseEnvOk = envStatus.url && envStatus.key;

  const currentWeekBounds = useMemo(() => getWeekBounds(), [getWeekBounds]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const map = await loadTaskPlanningMetaMap();
      if (!cancelled) setPlanningMeta(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (rangeMode !== 'month') return;
    const { year, monthIndex } = parseMonthAnchor(rangeAnchorDate);
    setCalendarYear(year);
    setCalendarMonth(monthIndex);
  }, [rangeAnchorDate, rangeMode]);

  useEffect(() => {
    if (viewMode !== 'list') return;
    if (rangeMode === 'month') {
      void loadMonth();
      return;
    }
    const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
    void loadDateRange(start, end);
  }, [viewMode, rangeMode, rangeAnchorDate, loadDateRange, loadMonth]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      void loadMonth({ silent: true });
    }
  }, [loadMonth, viewMode, calendarYear, calendarMonth]);

  useEffect(() => {
    if (viewMode === 'list' && projects.length === 0) {
      if (rangeMode === 'month') {
        void loadMonth();
      } else {
        const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
        void loadDateRange(start, end);
      }
    }
  }, [viewMode, projects.length, loadDateRange, loadMonth, rangeMode, rangeAnchorDate]);

  useEffect(() => {
    if (viewMode !== 'calendar') return;
    void loadWeekTasks(undefined);
  }, [viewMode, loadWeekTasks]);

  const canGoPrevMonth = isSubscribed;
  const canGoNextMonth = isSubscribed;
  const monthNavLabel = `${monthNamesFull[calendarMonth]} ${calendarYear}`;

  const syncCalendarMonthToDate = useCallback((dateStr: string) => {
    const d = parseLocalDateString(dateStr);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  }, []);

  const pickDateInMonth = useCallback(
    (year: number, monthIndex: number) => {
      const today = parseLocalDateString(todayStr);
      if (today.getFullYear() === year && today.getMonth() === monthIndex) {
        return todayStr;
      }
      const selectedDay = parseLocalDateString(selectedDate).getDate();
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      return getLocalDateString(new Date(year, monthIndex, Math.min(selectedDay, lastDay)));
    },
    [selectedDate, todayStr],
  );

  const handleSelectCalendarDate = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      syncCalendarMonthToDate(dateStr);
    },
    [syncCalendarMonthToDate],
  );

  const handlePrevMonth = useCallback(() => {
    if (!canGoPrevMonth) return;
    const next = shiftMonth(calendarYear, calendarMonth, -1);
    setCalendarYear(next.year);
    setCalendarMonth(next.monthIndex);
    setSelectedDate(pickDateInMonth(next.year, next.monthIndex));
  }, [canGoPrevMonth, calendarYear, calendarMonth, pickDateInMonth]);

  const handleNextMonth = useCallback(() => {
    if (!canGoNextMonth) return;
    const next = shiftMonth(calendarYear, calendarMonth, 1);
    setCalendarYear(next.year);
    setCalendarMonth(next.monthIndex);
    setSelectedDate(pickDateInMonth(next.year, next.monthIndex));
  }, [canGoNextMonth, calendarYear, calendarMonth, pickDateInMonth]);

  useEffect(() => {
    return subscribeCheckInRefresh(() => {
      void refreshCheckInToday();
      if (viewMode === 'calendar') {
        void loadMonth();
      } else if (rangeMode === 'month') {
        void loadMonth();
      } else {
        const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
        void loadDateRange(start, end);
      }
    });
  }, [refreshCheckInToday, viewMode, rangeMode, rangeAnchorDate, loadMonth, loadDateRange, loadWeekTasks]);

  useFocusEffect(
    useCallback(() => {
      void refreshCheckInToday();
      void loadTodayCheckIn();

      // Debounce: evita ráfagas al cambiar de tab / re-montar el callback.
      if (focusReloadTimerRef.current) {
        clearTimeout(focusReloadTimerRef.current);
      }
      focusReloadTimerRef.current = setTimeout(() => {
        focusReloadTimerRef.current = null;
        if (viewMode === 'calendar' || rangeMode === 'month') {
          void loadMonth({ silent: true });
        } else {
          const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
          void loadDateRange(start, end, { silent: true });
        }
      }, 350);

      return () => {
        if (focusReloadTimerRef.current) {
          clearTimeout(focusReloadTimerRef.current);
          focusReloadTimerRef.current = null;
        }
      };
    }, [
      loadTodayCheckIn,
      refreshCheckInToday,
      viewMode,
      rangeMode,
      rangeAnchorDate,
      loadMonth,
      loadDateRange,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      if (planAheadParam !== '1') return;
      if (planAheadAppliedRef.current) return;
      planAheadAppliedRef.current = true;
      setPlanAheadMode(true);
      setViewMode('list');
      setRangeMode('week');
      setRangeAnchorDate(getNextWeekMonday(getLocalDateString()));
      router.setParams({ planAhead: undefined });
    }, [planAheadParam]),
  );

  const handleRefresh = useCallback(() => {
    if (viewMode === 'calendar') {
      void loadMonth();
      return;
    }
    if (rangeMode === 'month') {
      void loadMonth();
      return;
    }
    const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
    void loadDateRange(start, end);
  }, [viewMode, rangeMode, rangeAnchorDate, loadMonth, loadDateRange]);

  const handleTasksChanged = useCallback(
    (created?: {
      taskId?: string;
      title: string;
      scheduledDate?: string | null;
      projectId?: string | null;
    }) => {
      if (created?.taskId && created.scheduledDate) {
        const optimistic = buildOptimisticTask({
          id: created.taskId,
          content: created.title,
          scheduledDate: created.scheduledDate,
          projectId: created.projectId ?? null,
        });
        if (viewMode === 'calendar') {
          appendTaskToDate(created.scheduledDate, optimistic);
        } else {
          appendTaskToDay(created.scheduledDate, optimistic);
        }
      }

      InteractionManager.runAfterInteractions(() => {
        if (viewMode === 'calendar') {
          void loadMonth({ silent: true });
          return;
        }
        if (rangeMode === 'month') {
          void loadMonth({ silent: true });
          return;
        }
        const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
        void loadDateRange(start, end, { silent: true });
      });
    },
    [
      viewMode,
      rangeMode,
      rangeAnchorDate,
      loadMonth,
      loadDateRange,
      appendTaskToDate,
      appendTaskToDay,
    ],
  );

  const { moveTaskToDay, moving: movingTask } = useSemanaTaskDrag({
    showToast,
    onTasksChanged: handleTasksChanged,
  });

  const handleBoardMoveTask = useCallback(
    async (taskId: string, targetDayId: string) => {
      if (replanMode && replanDraft) {
        setReplanDraft((current) =>
          current ? moveTaskInWeekDraft(current, taskId, targetDayId) : current,
        );
        return { ok: true };
      }
      return moveTaskToDay(taskId, targetDayId);
    },
    [moveTaskToDay, replanDraft, replanMode],
  );

  const handleReplanCancel = useCallback(() => {
    setReplanMode(false);
    setReplanDraft(null);
    setReplanProposal(null);
    setReplanUsedAi(false);
    replanBootstrappedRef.current = false;
  }, []);

  const handleReplanAccept = useCallback(async () => {
    if (!user?.id || !replanDraft) {
      handleReplanCancel();
      return;
    }

    setReplanApplying(true);
    try {
      const assignments = extractAssignmentsFromWeekDraft(replanDraft);
      const applied = await applyDayReplanAssignments(user.id, assignments);
      if (!applied.ok) {
        showToast(t('vnext.replanError'), 'error');
        return;
      }

      setReplanMode(false);
      setReplanDraft(null);
      setReplanProposal(null);
      replanBootstrappedRef.current = false;

      if (applied.movedCount > 0) {
        showToast(t('vnext.replanSuccessToast', { count: applied.movedCount }), 'success');
      } else {
        showToast(t('vnext.replanCalmToast'), 'info');
      }
      requestHoyRefresh();
      void loadWeekTasks(getWeekMonday(selectedDate));
      replaceToHoyTab();
    } finally {
      setReplanApplying(false);
    }
  }, [handleReplanCancel, loadWeekTasks, replanDraft, selectedDate, showToast, t, user?.id]);

  const isRefreshing =
    viewMode === 'calendar'
      ? monthLoading
      : rangeMode === 'month'
        ? monthLoading
        : loading;

  const projectsMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const filteredWeekTasks = useMemo(() => {
    if (!selectedProjectId) return weekTasks;
    return weekTasks.map(({ day, tasks }) => ({
      day,
      tasks: tasks.filter((t) => t.project_id === selectedProjectId),
    }));
  }, [weekTasks, selectedProjectId]);

  const showWeeklyBrief = false;

  const briefWeekStart = useMemo(() => {
    const anchor = viewMode === 'calendar' ? selectedDate : rangeAnchorDate;
    return getWeekMonday(anchor);
  }, [viewMode, selectedDate, rangeAnchorDate]);

  const briefWeekEnd = useMemo(
    () => getWeekBoundsForStart(briefWeekStart).end,
    [briefWeekStart],
  );

  const briefWeekTasks = useMemo(() => {
    return filteredWeekTasks.filter(
      ({ day }) => getWeekMonday(day.dateStr) === briefWeekStart,
    );
  }, [filteredWeekTasks, briefWeekStart]);

  const briefCheckInsByDate = useMemo(() => {
    if (viewMode === 'list') return checkInsByDate;
    const map: Record<string, WeekDayCheckIn> = {};
    for (const day of calendarDays) {
      if (getWeekMonday(day.dateStr) !== briefWeekStart) continue;
      if (day.emotion) {
        map[day.dateStr] = {
          emotion: day.emotion,
          energy_level: day.energyLevel ?? 0,
        };
      }
    }
    return map;
  }, [viewMode, checkInsByDate, calendarDays, briefWeekStart]);

  const displayName = useMemo(
    () => getDisplayName(user ?? null, t('yo.welcomeName')),
    [user, t],
  );

  const {
    headline: weeklyBriefHeadline,
    summary: weeklyBriefSummary,
    gentleAdvice: weeklyBriefAdvice,
    fromAi: weeklyBriefFromAi,
    loading: weeklyBriefLoading,
    weekContext: weeklyBriefContext,
  } = useKoraaWeeklyBrief({
    userId: user?.id,
    displayName,
    locale,
    weekStart: briefWeekStart,
    weekEnd: briefWeekEnd,
    weekTasks: briefWeekTasks,
    checkInsByDate: briefCheckInsByDate,
    enabled: showWeeklyBrief && !loading && !monthLoading,
  });

  const todayAvailableTime = todayCheckInTime.trim() || DEFAULT_CHECK_IN_TIME;

  const weekCapacity = useMemo(
    () =>
      buildWeekCapacitySnapshot({
        weekTasks: briefWeekTasks,
        planningMeta,
        todayAvailableTime,
        maxStepsPerDay:
          weeklyBriefContext?.today?.energyLevel && weeklyBriefContext.today.energyLevel <= 2
            ? 2
            : 3,
      }),
    [briefWeekTasks, planningMeta, todayAvailableTime, weeklyBriefContext],
  );

  const showWeeklyReplanCta = useMemo(
    () =>
      Boolean(weeklyBriefContext && canSuggestWeekReplan(weeklyBriefContext)) ||
      Boolean(weekCapacity?.isWeekImbalanced),
    [weeklyBriefContext, weekCapacity],
  );

  const listSourceTasks = useMemo(() => {
    const base =
      rangeMode === 'month'
        ? monthCalendarToDayTasks(calendarDays, tasksByDate, locale)
        : filteredWeekTasks;

    if (!selectedProjectId) return base;
    return base.map(({ day, tasks }) => ({
      day,
      tasks: tasks.filter((task) => task.project_id === selectedProjectId),
    }));
  }, [rangeMode, calendarDays, tasksByDate, locale, filteredWeekTasks, selectedProjectId]);

  const listBoardTasks = useMemo(() => {
    if (rangeMode === 'day') {
      return listSourceTasks.filter(({ day }) => day.dateStr === rangeAnchorDate);
    }
    return listSourceTasks;
  }, [listSourceTasks, rangeMode, rangeAnchorDate]);

  const visibleWeekSlice = useMemo(() => {
    if (isSubscribed) {
      return { visible: listBoardTasks, hiddenCount: 0, visibleDateKeys: null as Set<string> | null };
    }
    const { visible, hiddenCount } = getFreeVisibleWeekTasks(
      listBoardTasks,
      FREE_CALENDAR_VISIBLE_DAYS,
    );
    return {
      visible,
      hiddenCount,
      visibleDateKeys: new Set(visible.map(({ day }) => day.dateStr)),
    };
  }, [isSubscribed, listBoardTasks]);

  const visibleWeekTasks = visibleWeekSlice.visible;
  const hiddenWeekDayCount = visibleWeekSlice.hiddenCount;
  const freeVisibleDateKeys = visibleWeekSlice.visibleDateKeys;
  const boardWeekTasks = replanDraft ?? visibleWeekTasks;
  const visibleWeekTasksRef = useRef(visibleWeekTasks);
  visibleWeekTasksRef.current = visibleWeekTasks;

  const applyReplanResult = useCallback(
    (
      result: Awaited<ReturnType<typeof buildDayReplanPlan>>,
      anchorDate: string,
      sourceWeekTasks: DayTasks[],
    ) => {
      if (!result.ok) {
        showToast(t('vnext.replanError'), 'error');
        setReplanMode(false);
        setReplanDraft(null);
        setReplanProposal(null);
        setReplanUsedAi(false);
        replanBootstrappedRef.current = false;
        return false;
      }
      setReplanProposal(result.proposal);
      setReplanUsedAi(result.usedAi);
      setRangeAnchorDate(anchorDate);
      setReplanDraft(applyAssignmentsToWeekTasks(sourceWeekTasks, result.assignments));
      replanBootstrappedRef.current = true;
      return true;
    },
    [showToast, t],
  );

  const handleWeeklyBriefAdjust = useCallback(async () => {
    if (!user?.id || !weeklyBriefContext || replanLoading) return;

    setReplanMode(true);
    setViewMode('list');
    setRangeMode('week');
    setReplanLoading(true);

    try {
      const result = await buildWeeklyBriefReplanPlan(
        user.id,
        locale,
        t('projectsUi.looseTitle'),
        weeklyBriefContext,
      );
      applyReplanResult(result, weeklyBriefContext.weekStart, briefWeekTasks);
    } finally {
      setReplanLoading(false);
    }
  }, [
    user?.id,
    weeklyBriefContext,
    replanLoading,
    locale,
    t,
    applyReplanResult,
    briefWeekTasks,
  ]);

  useEffect(() => {
    if (replanParam !== '1' || !user?.id) {
      if (replanParam !== '1' && !replanMode) {
        replanBootstrappedRef.current = false;
      }
      return;
    }
    if (loading || replanBootstrappedRef.current) return;

    setReplanMode(true);
    setViewMode('list');
    setRangeMode('week');
    setRangeAnchorDate(todayStr);
    router.setParams({ replan: undefined, replanReason: undefined });

    const reason = (replanReasonParam as WhatChangedReason) || 'priorities_changed';
    let cancelled = false;

    void (async () => {
      setReplanLoading(true);
      try {
        const result = await buildDayReplanPlan(
          user.id,
          reason,
          locale,
          t('projectsUi.looseTitle'),
        );
        if (cancelled) return;
        if (!result.ok) {
          showToast(t('vnext.replanError'), 'error');
          setReplanMode(false);
          setReplanDraft(null);
          setReplanUsedAi(false);
          replanBootstrappedRef.current = false;
          return;
        }
        setReplanProposal(result.proposal);
        setReplanUsedAi(result.usedAi);
        setReplanDraft(
          applyAssignmentsToWeekTasks(visibleWeekTasksRef.current, result.assignments),
        );
        replanBootstrappedRef.current = true;
      } finally {
        if (!cancelled) setReplanLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    locale,
    replanMode,
    replanParam,
    replanReasonParam,
    showToast,
    t,
    todayStr,
    user?.id,
  ]);

  useEffect(() => {
    if (!freeVisibleDateKeys || freeVisibleDateKeys.has(selectedDate)) return;
    const fallback = freeVisibleDateKeys.has(todayStr)
      ? todayStr
      : [...freeVisibleDateKeys][0];
    if (fallback) {
      setSelectedDate(fallback);
      syncCalendarMonthToDate(fallback);
    }
  }, [freeVisibleDateKeys, selectedDate, todayStr, syncCalendarMonthToDate]);

  const handleLockedNavPress = useCallback(() => {
    openPaywall(router, '/(tabs)/semana');
  }, []);

  const displayRangeLabel = useMemo(() => {
    if (rangeMode === 'day') {
      return formatDayLabel(rangeAnchorDate, monthNames);
    }
    if (rangeMode === 'month') {
      return `${monthNamesFull[calendarMonth]} ${calendarYear}`;
    }
    const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
    return `${formatDayLabel(start, monthNames)} – ${formatDayLabel(end, monthNames)}`;
  }, [rangeMode, rangeAnchorDate, monthNames, monthNamesFull, calendarMonth, calendarYear]);

  const canGoRangePrev = useMemo(() => {
    if (planAheadMode && (rangeMode === 'week' || rangeMode === 'twoWeeks')) {
      return getWeekMonday(rangeAnchorDate) > planAheadFloor;
    }
    if (rangeMode === 'day') {
      if (isSubscribed) return true;
      return rangeAnchorDate > currentWeekBounds.start;
    }
    return isSubscribed;
  }, [planAheadMode, planAheadFloor, rangeMode, rangeAnchorDate, isSubscribed, currentWeekBounds.start]);

  const canGoRangeNext = useMemo(() => {
    if (rangeMode === 'day') {
      if (isSubscribed) return true;
      return rangeAnchorDate < currentWeekBounds.end;
    }
    return isSubscribed;
  }, [rangeMode, rangeAnchorDate, isSubscribed, currentWeekBounds.end]);

  const handleRangePrev = useCallback(() => {
    if (!canGoRangePrev) {
      if (!isSubscribed) handleLockedNavPress();
      return;
    }
    setRangeAnchorDate(shiftAnchorDate(rangeMode, rangeAnchorDate, -1));
  }, [canGoRangePrev, isSubscribed, handleLockedNavPress, rangeMode, rangeAnchorDate]);

  const handleRangeNext = useCallback(() => {
    if (!canGoRangeNext) {
      if (!isSubscribed) handleLockedNavPress();
      return;
    }
    setRangeAnchorDate(shiftAnchorDate(rangeMode, rangeAnchorDate, 1));
  }, [canGoRangeNext, isSubscribed, handleLockedNavPress, rangeMode, rangeAnchorDate]);

  const handleRangeModeChange = useCallback(
    (mode: SemanaRangeMode) => {
      setRangeMode(mode);
      setRangeAnchorDate(todayStr);
    },
    [todayStr],
  );

  const handlePremiumRangePress = useCallback(() => {
    handleLockedNavPress();
  }, [handleLockedNavPress]);

  const boardLayout = getBoardLayout(rangeMode);

  const selectedDayData = useMemo(
    () => calendarDays.find((d) => d.dateStr === selectedDate),
    [calendarDays, selectedDate],
  );
  const selectedDayUnlocked = isDateInFreeVisibleRange(selectedDate, freeVisibleDateKeys);
  const selectedDayTasks = useMemo(() => {
    if (!selectedDayUnlocked) return [];
    return (tasksByDate[selectedDate] ?? []).filter((task) => !task.is_completed);
  }, [selectedDayUnlocked, tasksByDate, selectedDate]);
  const selectedDayLabel = formatDayLabel(selectedDate, monthNames);
  const selectedDayCheckInLabel = useMemo(() => {
    const checkIn = selectedDayData?.emotion
      ? { emotion: selectedDayData.emotion, energy_level: selectedDayData.energyLevel ?? 0 }
      : undefined;
    return formatCheckInChip(checkIn, t);
  }, [selectedDayData, t]);

  const selectedDayEmotionId = selectedDayData?.emotion?.toLowerCase() ?? null;

  const exportableTasks = useMemo(() => {
    if (isSubscribed) {
      if (viewMode === 'calendar') {
        return Object.values(tasksByDate).flat();
      }
      return filteredWeekTasks.flatMap(({ tasks }) => tasks);
    }
    if (viewMode === 'calendar') {
      if (!freeVisibleDateKeys) return [];
      return Object.entries(tasksByDate)
        .filter(([dateStr]) => freeVisibleDateKeys.has(dateStr))
        .flatMap(([, tasks]) => tasks);
    }
    return visibleWeekTasks.flatMap(({ tasks }) => tasks);
  }, [viewMode, tasksByDate, filteredWeekTasks, isSubscribed, freeVisibleDateKeys, visibleWeekTasks]);

  useFocusEffect(
    useCallback(() => {
      return () => setPlannerDragging(false);
    }, []),
  );

  useEffect(() => {
    setPlannerDragging(false);
  }, [viewMode, rangeMode]);

  const handleExportTasks = useCallback(async () => {
    if (exportableTasks.length === 0) {
      showToast(t('semana.exportEmpty'), 'info');
      return;
    }
    await shareTasksCsv(exportableTasks, t('semana.exportTitle'));
  }, [exportableTasks, showToast, t]);

  return (
    <View style={styles.container}>
      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onHide={() => setToastMessage(null)} />
      ) : null}
      <CalmScreen
        topInset="lg"
        gap={THEME.layout.tabSectionGap}
        keyboardShouldPersistTaps="always"
        scrollEnabled={!plannerDragging}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.calm.lavenderDeep}
          />
        }
      >
        <View style={styles.topBlock}>
          <ScreenHeader
            compact
            title={t('semana.title')}
            subtitle={
              replanMode
                ? t('semana.replanIntro')
                : planAheadMode
                  ? t('semana.planAheadIntro')
                  : t('semana.introGlance')
            }
            trailing={
              <HeaderIconButton
                onPress={() => void handleExportTasks()}
                accessibilityLabel={t('semana.exportA11y')}
              >
                <Download size={22} color={THEME.colors.calm.lavenderDeep} />
              </HeaderIconButton>
            }
          />

          {hasCheckInToday === false ? <SemanaTodayCheckInBanner /> : null}
        </View>

        {showWeeklyBrief && !replanMode ? (
          <SemanaWeeklyBriefCard
            headline={weeklyBriefHeadline}
            summary={weeklyBriefSummary}
            gentleAdvice={weeklyBriefAdvice}
            fromAi={weeklyBriefFromAi}
            loading={weeklyBriefLoading}
            showAdjustCta={showWeeklyReplanCta}
            adjustingWeek={replanLoading}
            onAdjustWeek={() => void handleWeeklyBriefAdjust()}
            weekCapacitySlot={
              !weeklyBriefLoading && weekCapacity ? (
                <SemanaWeekCapacityBar capacity={weekCapacity} />
              ) : null
            }
          />
        ) : null}

        {replanMode ? null : (
        <CalmSegmentedControl
          segments={[
            {
              id: 'calendar' as const,
              label: t('semana.viewCalendar'),
              accessibilityLabel: t('semana.viewCalendar'),
            },
            {
              id: 'list' as const,
              label: t('semana.viewList'),
              accessibilityLabel: t('semana.viewList'),
            },
          ]}
          value={viewMode}
          onChange={setViewMode}
          variant="track"
        />
        )}

        {replanMode ? (
          <>
            <SemanaReplanPreviewBar
              headline={replanProposal?.headline}
              subline={replanProposal?.subline}
              usedAi={replanUsedAi}
              loading={replanLoading}
              applying={replanApplying}
              onAccept={() => void handleReplanAccept()}
              onCancel={handleReplanCancel}
            />
            {replanProposal &&
            (replanProposal.kept.length > 0 || replanProposal.moved.length > 0) ? (
              <ReorganizeDayProposalSections
                kept={replanProposal.kept}
                moved={replanProposal.moved}
                planningMeta={planningMeta}
              />
            ) : null}
          </>
        ) : null}

        {viewMode === 'calendar' && !replanMode ? (
          <>
            <SemanaWeekNav
              label={monthNavLabel}
              canGoPrev={canGoPrevMonth}
              canGoNext={canGoNextMonth}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              prevA11yLabel={t('semana.monthNavA11yPrev')}
              nextA11yLabel={t('semana.monthNavA11yNext')}
              hint={!isSubscribed ? t('semana.navPremiumHint') : undefined}
              onLockedNavPress={!isSubscribed ? handleLockedNavPress : undefined}
            />

            <View style={styles.calendarGridWrap}>
              <SemanaCalendarGrid
                days={calendarDays}
                selectedDate={selectedDate}
                onSelectDate={handleSelectCalendarDate}
                selectableDateKeys={freeVisibleDateKeys}
                onLockedDatePress={handleLockedNavPress}
              />
            </View>

            <SemanaDaySection
              dateStr={selectedDate}
              title={t('semana.selectedDayTitle', { day: selectedDayLabel })}
              tasks={selectedDayTasks}
              projectsMap={projectsMap}
              userId={user?.id}
              quickAddProjects={projects.map((project) => ({
                id: project.id,
                name: project.name,
                color: project.color ?? THEME.colors.gradient.blue,
              }))}
              isToday={selectedDate === todayStr}
              hasCheckInToday={hasCheckInToday === true}
              checkInChipText={selectedDayCheckInLabel}
              emotionId={selectedDayEmotionId}
              energyLevel={selectedDayData?.energyLevel ?? null}
              focusCount={null}
              addTasksA11yLabel={`${t('semana.addToDayCta')} ${selectedDayLabel}`}
              addMoreA11yLabel={`${t('semana.addMore')} ${selectedDayLabel}`}
              onTasksChanged={handleTasksChanged}
              showToast={showToast}
            />

            {!isSubscribed && hiddenWeekDayCount > 0 ? (
              <SemanaFreeLimitCard hiddenDayCount={hiddenWeekDayCount} />
            ) : null}
          </>
        ) : (
          <>
        {replanMode ? null : (
        <SemanaRangePicker
          value={rangeMode}
          isSubscribed={isSubscribed}
          onChange={handleRangeModeChange}
          onLockedPress={handlePremiumRangePress}
        />
        )}

        {replanMode ? null : (
        <SemanaWeekNav
          label={displayRangeLabel}
          canGoPrev={canGoRangePrev}
          canGoNext={canGoRangeNext}
          onPrev={handleRangePrev}
          onNext={handleRangeNext}
          prevA11yLabel={
            rangeMode === 'day' ? t('semana.rangeNavPrevDayA11y') : t('semanaExtra.a11yPrevWeek')
          }
          nextA11yLabel={
            rangeMode === 'day' ? t('semana.rangeNavNextDayA11y') : t('semanaExtra.a11yNextWeek')
          }
          hint={!isSubscribed ? t('semana.navPremiumHint') : undefined}
          onLockedNavPress={!isSubscribed ? handleLockedNavPress : undefined}
        />
        )}

        {replanMode ? null : (
        <SemanaProjectFilter
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />
        )}

        {((rangeMode === 'month' ? monthLoading : loading) || replanLoading) &&
        boardWeekTasks.length === 0 ? (
          <Text style={styles.loadingWeek}>{t('semana.loadingDays')}</Text>
        ) : null}

        {!replanLoading && boardWeekTasks.length > 0 ? (
          <SemanaDraggableWeekBoard
            weekTasks={boardWeekTasks}
            projects={projects}
            userId={user?.id}
            boardLayout={replanMode ? 'weekGrid' : boardLayout}
            onMoveTask={handleBoardMoveTask}
            onTasksChanged={handleTasksChanged}
            moving={movingTask && !replanMode}
            onDraggingChange={setPlannerDragging}
            hasCheckInToday={hasCheckInToday === true}
            showToast={showToast}
          />
        ) : null}

        {!replanMode && !isSubscribed && hiddenWeekDayCount > 0 ? (
          <SemanaFreeLimitCard hiddenDayCount={hiddenWeekDayCount} />
        ) : null}

          </>
        )}

        {viewMode === 'list' && !replanMode ? (
        <View style={styles.bottomSection}>
          <CalmPrimaryButton
            label={t('semana.addTasksOrProjects')}
            onPress={() => openVaciarCapture()}
            large
            accessibilityLabel={t('semana.addTasksOrProjects')}
          />

          {schemaSetupType ? (
            <View style={styles.setupCard}>
              <Text style={styles.setupCardTitle}>{t('semanaExtra.setupTitle')}</Text>
              <Text style={styles.setupCardText}>
                {schemaSetupType === 'scheduled_date'
                  ? t('semanaExtra.setupScheduledDate')
                  : schemaSetupType === 'projects_table'
                    ? t('semanaExtra.setupProjectsTable')
                    : schemaSetupType === 'project_id'
                      ? t('semanaExtra.setupProjectId')
                      : t('semanaExtra.setupGeneric')}
              </Text>
              <Text style={styles.setupCardSteps}>{t('semanaExtra.setupSteps')}</Text>
              <Text style={styles.setupCardHint}>{t('semanaExtra.setupPullRefresh')}</Text>
            </View>
          ) : null}
        </View>
        ) : null}

        {__DEV__ ? (
          <View style={styles.diagnostico}>
            <Text style={styles.diagnosticoTitle}>{t('semanaExtra.devTitle')}</Text>
            <Text style={styles.diagnosticoLine}>
              {t('semanaExtra.devSession', {
                email: user?.email ?? t('semanaExtra.devSessionNone'),
              })}
            </Text>
            <Text style={styles.diagnosticoLine}>
              {t('semanaExtra.devSupabase', {
                status: supabaseEnvOk
                  ? t('semanaExtra.devSupabaseOk')
                  : t('semanaExtra.devSupabaseMissing'),
              })}
            </Text>
            {lastLoadError ? (
              <Text style={[styles.diagnosticoLine, styles.diagnosticoError]} numberOfLines={3}>
                {t('semanaExtra.devLastError', { error: lastLoadError })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </CalmScreen>

    </View>
  );
}

export default function SemanaScreenRoute() {
  return (
    <TabScreenErrorBoundary screenName="semana">
      <SemanaScreen />
    </TabScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  topBlock: {
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  focusProgress: {
    marginTop: THEME.spacing.sm,
  },
  calendarSection: {
    marginBottom: 0,
  },
  calendarGridWrap: {
    marginBottom: 0,
  },
  loadingWeek: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: 0,
  },
  bottomSection: {
    marginTop: 0,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  setupCard: {
    padding: THEME.spacing.md + 4,
    backgroundColor: THEME.colors.tint.blue.veryLight,
    borderRadius: THEME.borderRadius.rounded,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.gradient.blue,
    ...THEME.shadows.soft,
  },
  setupCardTitle: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  setupCardText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  setupCardSteps: {
    ...THEME.typography.meta,
    lineHeight: 20,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.medium,
  },
  setupCardHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  diagnostico: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    padding: THEME.spacing.md,
    ...THEME.surfaces.panel,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  diagnosticoTitle: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  diagnosticoLine: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    marginBottom: 2,
  },
  diagnosticoError: {
    color: THEME.colors.gradient.pink,
    marginTop: THEME.spacing.xs,
  },
});
