import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWeekTasks, type WeekDayCheckIn } from '@/hooks/useWeekTasks';
import { useMonthCalendar } from '@/hooks/useMonthCalendar';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { getSupabaseEnvStatus } from '@/lib/envCheck';
import {
  Download,
} from 'lucide-react-native';
import { shareTasksCsv } from '@/lib/exportTasksCsv';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { SemanaCalendarGrid } from '@/components/semana/SemanaCalendarGrid';
import { SemanaCalendarLegend } from '@/components/semana/SemanaCalendarLegend';
import { SemanaWeekNav } from '@/components/semana/SemanaWeekNav';
import { SemanaProjectFilter } from '@/components/semana/SemanaProjectFilter';
import { SemanaDaySection } from '@/components/semana/SemanaDaySection';
import { SemanaTodayCheckInBanner } from '@/components/semana/SemanaTodayCheckInBanner';
import { SemanaFreeLimitCard } from '@/components/semana/SemanaFreeLimitCard';
import { SemanaDraggableWeekBoard } from '@/components/semana/SemanaDraggableWeekBoard';
import { SemanaRangePicker } from '@/components/semana/SemanaRangePicker';
import { useSemanaTaskDrag } from '@/hooks/useSemanaTaskDrag';
import { Toast } from '@/components/Toast';
import { getLocalDateString } from '@/lib/dateLocal';
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
import { parseMonthAnchor } from '@/lib/calendarGrid';

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

export default function SemanaScreen() {
  const { t, locale } = useI18n();
  const { planAhead: planAheadParam } = useLocalSearchParams<{ planAhead?: string }>();
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const monthNamesFull = locale === 'en' ? MONTH_NAMES_FULL_EN : MONTH_NAMES_FULL_ES;
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const todayStr = getLocalDateString();
  const [rangeMode, setRangeMode] = useState<SemanaRangeMode>('week');
  const [rangeAnchorDate, setRangeAnchorDate] = useState<string>(todayStr);
  const todayDate = useMemo(() => new Date(), []);
  const [calendarYear, setCalendarYear] = useState(todayDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [planAheadMode, setPlanAheadMode] = useState(false);
  const planAheadFloor = useMemo(() => getNextWeekMonday(todayStr), [todayStr]);
  const showToast = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage(msg);
      setToastType(type);
    },
    [],
  );

  const { weekTasks, projects, loading, loadWeekTasks, loadDateRange, getWeekBounds, lastLoadError, schemaSetupType } = useWeekTasks(showToast, locale);
  const { hasCheckInToday, refresh: refreshCheckInToday } = useHasCheckInToday(user?.id);
  const { days: calendarDays, tasksByDate, loading: monthLoading, loadMonth } = useMonthCalendar(
    calendarYear,
    calendarMonth,
    showToast,
    locale,
  );
  const envStatus = getSupabaseEnvStatus();
  const supabaseEnvOk = envStatus.url && envStatus.key;

  const currentWeekBounds = useMemo(() => getWeekBounds(), [getWeekBounds]);

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
      loadMonth();
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
    if (viewMode === 'calendar') {
      void loadWeekTasks(undefined);
    }
  }, [viewMode, loadWeekTasks]);

  const canGoPrevMonth = isSubscribed;
  const canGoNextMonth = isSubscribed;
  const monthNavLabel = `${monthNamesFull[calendarMonth]} ${calendarYear}`;

  const handlePrevMonth = useCallback(() => {
    if (!canGoPrevMonth) return;
    if (calendarMonth === 0) {
      setCalendarYear((y) => y - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }, [canGoPrevMonth, calendarMonth]);

  const handleNextMonth = useCallback(() => {
    if (!canGoNextMonth) return;
    if (calendarMonth === 11) {
      setCalendarYear((y) => y + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }, [canGoNextMonth, calendarMonth]);

  useEffect(() => {
    return subscribeCheckInRefresh(() => {
      void refreshCheckInToday();
      if (viewMode === 'calendar') {
        void loadMonth();
        void loadWeekTasks(undefined);
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
    }, [refreshCheckInToday]),
  );

  useFocusEffect(
    useCallback(() => {
      if (planAheadParam !== '1') return;
      setPlanAheadMode(true);
      setViewMode('list');
      setRangeMode('week');
      setRangeAnchorDate(getNextWeekMonday(getLocalDateString()));
    }, [planAheadParam]),
  );

  const handleRefresh = useCallback(() => {
    if (viewMode === 'calendar') {
      loadMonth();
      loadWeekTasks(undefined);
      return;
    }
    if (rangeMode === 'month') {
      loadMonth();
      return;
    }
    const { start, end } = getRangeBounds(rangeMode, rangeAnchorDate);
    void loadDateRange(start, end);
  }, [viewMode, rangeMode, rangeAnchorDate, loadMonth, loadDateRange, loadWeekTasks]);

  const handleTasksChanged = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const { moveTaskToDay, moving: movingTask } = useSemanaTaskDrag({
    showToast,
    onTasksChanged: handleTasksChanged,
  });

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

  useEffect(() => {
    if (!freeVisibleDateKeys || freeVisibleDateKeys.has(selectedDate)) return;
    const fallback = freeVisibleDateKeys.has(todayStr)
      ? todayStr
      : [...freeVisibleDateKeys][0];
    if (fallback) setSelectedDate(fallback);
  }, [freeVisibleDateKeys, selectedDate, todayStr]);

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
        keyboardShouldPersistTaps="handled"
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
            subtitle={planAheadMode ? t('semana.planAheadIntro') : t('semana.introShort')}
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
          variant="accent"
        />

        {viewMode === 'calendar' ? (
          <>
            <View style={styles.calendarSection}>
              <SemanaCalendarLegend />
            </View>

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

            {monthLoading ? (
              <Text style={styles.loadingWeek}>{t('semana.loadingDays')}</Text>
            ) : (
              <View style={styles.calendarGridWrap}>
                <SemanaCalendarGrid
                  days={calendarDays}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  selectableDateKeys={freeVisibleDateKeys}
                  onLockedDatePress={handleLockedNavPress}
                />
              </View>
            )}

            <SemanaDaySection
              dateStr={selectedDate}
              title={t('semana.selectedDayTitle', { day: selectedDayLabel })}
              tasks={selectedDayTasks}
              projectsMap={projectsMap}
              isToday={selectedDate === todayStr}
              checkInChipText={selectedDayCheckInLabel}
              emotionId={selectedDayEmotionId}
              energyLevel={selectedDayData?.energyLevel ?? null}
              focusCount={null}
              globalCheckInBannerVisible={
                selectedDate === todayStr && hasCheckInToday === false
              }
              suppressEmptyWhenGlobalBanner={
                selectedDate === todayStr && hasCheckInToday === false
              }
              addTasksA11yLabel={`${t('semana.addTasks')} ${selectedDayLabel}`}
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
        <SemanaRangePicker
          value={rangeMode}
          isSubscribed={isSubscribed}
          onChange={handleRangeModeChange}
          onLockedPress={handlePremiumRangePress}
        />

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

        <SemanaProjectFilter
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        {(rangeMode === 'month' ? monthLoading : loading) ? (
          <Text style={styles.loadingWeek}>{t('semana.loadingDays')}</Text>
        ) : null}

        {!(rangeMode === 'month' ? monthLoading : loading) ? (
          <SemanaDraggableWeekBoard
            weekTasks={visibleWeekTasks}
            projects={projects}
            boardLayout={boardLayout}
            onMoveTask={moveTaskToDay}
            onTasksChanged={handleTasksChanged}
            moving={movingTask}
          />
        ) : null}

        {!isSubscribed && hiddenWeekDayCount > 0 ? (
          <SemanaFreeLimitCard hiddenDayCount={hiddenWeekDayCount} />
        ) : null}

          </>
        )}

        {viewMode === 'list' ? (
        <View style={styles.bottomSection}>
          <CalmPrimaryButton
            label={t('semana.addTasksOrProjects')}
            onPress={() => router.push('/(tabs)/vaciar')}
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
