import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWeekTasks, getWeekOptions, type WeekDayCheckIn } from '@/hooks/useWeekTasks';
import { useMonthCalendar } from '@/hooks/useMonthCalendar';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { getSupabaseEnvStatus } from '@/lib/envCheck';
import {
  Download,
} from 'lucide-react-native';
import { shareTasksCsv } from '@/lib/exportTasksCsv';
import { router, useFocusEffect } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { PremiumTeaserCard } from '@/components/PremiumTeaserCard';
import { SemanaCalendarGrid } from '@/components/semana/SemanaCalendarGrid';
import { SemanaCalendarLegend } from '@/components/semana/SemanaCalendarLegend';
import { SemanaWeekNav } from '@/components/semana/SemanaWeekNav';
import { SemanaProjectFilter } from '@/components/semana/SemanaProjectFilter';
import { SemanaDaySection } from '@/components/semana/SemanaDaySection';
import { SemanaTodayCheckInBanner } from '@/components/semana/SemanaTodayCheckInBanner';
import { SemanaFreePlanBanner } from '@/components/semana/SemanaFreePlanBanner';
import { SemanaFreeLimitCard } from '@/components/semana/SemanaFreeLimitCard';
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
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const monthNamesFull = locale === 'en' ? MONTH_NAMES_FULL_EN : MONTH_NAMES_FULL_ES;
  const { user } = useAuth();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const todayStr = getLocalDateString();
  const todayDate = useMemo(() => new Date(), []);
  const [calendarYear, setCalendarYear] = useState(todayDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const showToast = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage(msg);
      setToastType(type);
    },
    [],
  );

  const { weekTasks, checkInsByDate, projects, loading, loadWeekTasks, getWeekBounds, lastLoadError, schemaSetupType } = useWeekTasks(showToast, locale);
  const { hasCheckInToday, refresh: refreshCheckInToday } = useHasCheckInToday(user?.id);
  const { days: calendarDays, tasksByDate, loading: monthLoading, loadMonth } = useMonthCalendar(
    calendarYear,
    calendarMonth,
    showToast,
    locale,
  );
  const envStatus = getSupabaseEnvStatus();
  const supabaseEnvOk = envStatus.url && envStatus.key;

  const currentWeekStart = getWeekBounds().start;
  const weekOptions = useMemo(() => {
    const opts = getWeekOptions(6);
    return opts.map((o, i) => ({
      ...o,
      label:
        i === 0
          ? t('semana.weekPrev')
          : i === 1
            ? t('semana.weekCurrent')
            : `${o.start.slice(8)} ${monthNames[parseInt(o.start.slice(5, 7), 10) - 1]}`,
    }));
  }, [t, monthNames]);

  const weekIndex = useMemo(() => {
    const start = selectedWeekStart ?? currentWeekStart;
    const i = weekOptions.findIndex((o) => o.start === start);
    return i >= 0 ? i : 1;
  }, [selectedWeekStart, currentWeekStart, weekOptions]);

  const canGoPrev = isSubscribed && weekIndex > 0;
  const canGoNext = isSubscribed && weekIndex < weekOptions.length - 1;
  const displayWeekLabel =
    weekOptions[weekIndex]?.label ?? (weekTasks.length === 7
      ? (() => {
          const d0 = weekTasks[0].day.dateStr;
          const d6 = weekTasks[6].day.dateStr;
          return `${d0.slice(8)} – ${d6.slice(8)} ${monthNames[parseInt(d0.slice(5, 7), 10) - 1]}`;
        })()
      : t('semanaExtra.weekFallback'));

  useEffect(() => {
    if (viewMode === 'list') {
      loadWeekTasks(selectedWeekStart || undefined);
    }
  }, [loadWeekTasks, selectedWeekStart, viewMode]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadMonth();
    }
  }, [loadMonth, viewMode, calendarYear, calendarMonth]);

  useEffect(() => {
    if (viewMode === 'list' && projects.length === 0) {
      loadWeekTasks(selectedWeekStart || undefined);
    }
  }, [viewMode, projects.length, loadWeekTasks, selectedWeekStart]);

  useEffect(() => {
    if (viewMode === 'calendar' && projects.length === 0) {
      loadWeekTasks(undefined);
    }
  }, [viewMode, projects.length, loadWeekTasks]);

  const handlePrevWeek = useCallback(() => {
    if (!canGoPrev) return;
    setSelectedWeekStart(weekOptions[weekIndex - 1].start);
  }, [canGoPrev, weekIndex, weekOptions]);

  const handleNextWeek = useCallback(() => {
    if (!canGoNext) return;
    setSelectedWeekStart(weekOptions[weekIndex + 1].start);
  }, [canGoNext, weekIndex, weekOptions]);

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
      } else {
        void loadWeekTasks(selectedWeekStart || undefined);
      }
    });
  }, [refreshCheckInToday, viewMode, loadMonth, loadWeekTasks, selectedWeekStart]);

  useFocusEffect(
    useCallback(() => {
      void refreshCheckInToday();
    }, [refreshCheckInToday]),
  );

  const handleRefresh = useCallback(() => {
    if (viewMode === 'calendar') {
      loadMonth();
      if (projects.length === 0) {
        loadWeekTasks(selectedWeekStart || undefined);
      }
    } else {
      loadWeekTasks(selectedWeekStart || undefined);
    }
  }, [viewMode, loadMonth, loadWeekTasks, projects.length, selectedWeekStart]);

  const handleTasksChanged = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const isRefreshing = viewMode === 'calendar' ? monthLoading : loading;

  const projectsMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const filteredWeekTasks = useMemo(() => {
    if (!selectedProjectId) return weekTasks;
    return weekTasks.map(({ day, tasks }) => ({
      day,
      tasks: tasks.filter((t) => t.project_id === selectedProjectId),
    }));
  }, [weekTasks, selectedProjectId]);

  const visibleWeekSlice = useMemo(() => {
    if (isSubscribed) {
      return { visible: filteredWeekTasks, hiddenCount: 0, visibleDateKeys: null as Set<string> | null };
    }
    const { visible, hiddenCount } = getFreeVisibleWeekTasks(
      filteredWeekTasks,
      FREE_CALENDAR_VISIBLE_DAYS,
    );
    return {
      visible,
      hiddenCount,
      visibleDateKeys: new Set(visible.map(({ day }) => day.dateStr)),
    };
  }, [isSubscribed, filteredWeekTasks]);

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

  const selectedDayData = useMemo(
    () => calendarDays.find((d) => d.dateStr === selectedDate),
    [calendarDays, selectedDate],
  );
  const selectedDayUnlocked = isDateInFreeVisibleRange(selectedDate, freeVisibleDateKeys);
  const selectedDayTasks = selectedDayUnlocked ? (tasksByDate[selectedDate] ?? []) : [];
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.calm.lavenderDeep}
          />
        }
      >
        <ScreenHeader
          title={t('semana.title')}
          subtitle={t('semana.intro')}
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

        {!subscriptionLoading && !isSubscribed ? (
          <SemanaFreePlanBanner viewMode={viewMode} />
        ) : null}

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
        <SemanaWeekNav
          label={displayWeekLabel}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
          prevA11yLabel={t('semanaExtra.a11yPrevWeek')}
          nextA11yLabel={t('semanaExtra.a11yNextWeek')}
          hint={!isSubscribed ? t('semana.navPremiumHint') : undefined}
          onLockedNavPress={!isSubscribed ? handleLockedNavPress : undefined}
        />

        <SemanaProjectFilter
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        {loading ? (
          <Text style={styles.loadingWeek}>{t('semana.loadingDays')}</Text>
        ) : null}

        {!loading && visibleWeekTasks.map(({ day, tasks }) => {
          const dayLabel = formatDayLabel(day.dateStr, monthNames);
          const dayCheckIn = checkInsByDate[day.dateStr];
          return (
            <SemanaDaySection
              key={day.dateStr}
              dateStr={day.dateStr}
              title={dayLabel}
              tasks={tasks}
              projectsMap={projectsMap}
              isToday={day.isToday}
              checkInChipText={formatCheckInChip(dayCheckIn, t)}
              emotionId={dayCheckIn?.emotion?.toLowerCase() ?? null}
              energyLevel={dayCheckIn?.energy_level ?? null}
              focusCount={null}
              globalCheckInBannerVisible={day.isToday && hasCheckInToday === false}
              suppressEmptyWhenGlobalBanner={day.isToday && hasCheckInToday === false}
              addTasksA11yLabel={`${t('semana.addTasks')} ${dayLabel}`}
              addMoreA11yLabel={`${t('semana.addMore')} ${dayLabel}`}
              onTasksChanged={handleTasksChanged}
              showToast={showToast}
            />
          );
        })}

        {!isSubscribed ? <SemanaFreeLimitCard hiddenDayCount={hiddenWeekDayCount} /> : null}

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

        {!loading && !subscriptionLoading && !isSubscribed && viewMode === 'calendar' ? (
          <PremiumTeaserCard
            title={t('semana.premiumTitle')}
            body={t('premiumTeaser.semanaBody', { days: FREE_CALENDAR_VISIBLE_DAYS })}
            paywallReturnTo="/(tabs)/semana"
          />
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  setupCardTitle: {
    ...THEME.typography.body,
    fontSize: 15,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  setupCardText: {
    ...THEME.typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  setupCardSteps: {
    ...THEME.typography.small,
    fontSize: 13,
    lineHeight: 20,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.medium,
  },
  setupCardHint: {
    ...THEME.typography.small,
    fontSize: 12,
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
