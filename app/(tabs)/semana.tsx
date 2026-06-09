import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
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
  Brain,
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
import { Toast } from '@/components/Toast';
import { getTodayPriorityStats } from '@/lib/priorityProgress';
import { getLocalDateString } from '@/lib/dateLocal';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTH_NAMES_FULL_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MONTH_NAMES_FULL_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
const FREE_VISIBLE_DAYS = 3;

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

  const isRefreshing = viewMode === 'calendar' ? monthLoading : loading;

  const projectsMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const filteredWeekTasks = useMemo(() => {
    if (!selectedProjectId) return weekTasks;
    return weekTasks.map(({ day, tasks }) => ({
      day,
      tasks: tasks.filter((t) => t.project_id === selectedProjectId),
    }));
  }, [weekTasks, selectedProjectId]);

  const visibleWeekTasks = useMemo(() => {
    if (isSubscribed) return filteredWeekTasks;
    return filteredWeekTasks.slice(0, FREE_VISIBLE_DAYS);
  }, [isSubscribed, filteredWeekTasks]);

  const selectedDayData = useMemo(
    () => calendarDays.find((d) => d.dateStr === selectedDate),
    [calendarDays, selectedDate],
  );
  const selectedDayTasks = tasksByDate[selectedDate] ?? [];
  const selectedDayLabel = formatDayLabel(selectedDate, monthNames);
  const selectedDayCheckInLabel = useMemo(() => {
    const checkIn = selectedDayData?.emotion
      ? { emotion: selectedDayData.emotion, energy_level: selectedDayData.energyLevel ?? 0 }
      : undefined;
    return formatCheckInChip(checkIn, t);
  }, [selectedDayData, t]);

  const selectedDayEmotionId = selectedDayData?.emotion?.toLowerCase() ?? null;

  const todayWeekTasks = useMemo(() => {
    const todayDay = filteredWeekTasks.find(({ day }) => day.dateStr === todayStr);
    return todayDay?.tasks ?? [];
  }, [filteredWeekTasks, todayStr]);

  const todayPriorityStats = useMemo(
    () => getTodayPriorityStats(todayWeekTasks),
    [todayWeekTasks],
  );

  const exportableTasks = useMemo(() => {
    if (viewMode === 'calendar') {
      return Object.values(tasksByDate).flat();
    }
    return filteredWeekTasks.flatMap(({ tasks }) => tasks);
  }, [viewMode, tasksByDate, filteredWeekTasks]);

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
        gap={THEME.layout.sectionGapCompact}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.gradient.blue}
          />
        }
      >
        <ScreenHeader
          title={t('semana.title')}
          subtitle={t('semana.subtitle')}
          trailing={
            <>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/vaciar')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('semana.brainDumpA11y')}
                style={[styles.headerIconButton, styles.headerIconButtonPlain]}
              >
                <Brain size={22} color={THEME.colors.calm.lavenderDeep} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void handleExportTasks()}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('semana.exportA11y')}
                style={[styles.headerIconButton, styles.headerIconButtonPlain]}
              >
                <Download size={22} color={THEME.colors.calm.lavenderDeep} />
              </TouchableOpacity>
            </>
          }
        />

        <Text style={styles.intro}>{t('semana.intro')}</Text>

        {hasCheckInToday === false ? <SemanaTodayCheckInBanner /> : null}

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleChip, viewMode === 'calendar' && styles.viewToggleChipActive]}
            onPress={() => setViewMode('calendar')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'calendar' }}
            accessibilityLabel={t('semana.viewCalendar')}
            accessibilityHint={t('semanaExtra.a11yViewCalendarHint')}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'calendar' && styles.viewToggleTextActive,
              ]}
            >
              {t('semana.viewCalendar')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleChip, viewMode === 'list' && styles.viewToggleChipActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'list' }}
            accessibilityLabel={t('semana.viewList')}
            accessibilityHint={t('semanaExtra.a11yViewListHint')}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'list' && styles.viewToggleTextActive,
              ]}
            >
              {t('semana.viewList')}
            </Text>
          </TouchableOpacity>
        </View>

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
            />

            {monthLoading ? (
              <Text style={styles.loadingWeek}>{t('semana.loadingDays')}</Text>
            ) : (
              <View style={styles.calendarGridWrap}>
                <SemanaCalendarGrid
                  days={calendarDays}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
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
              focusCount={selectedDate === todayStr ? todayPriorityStats.total : null}
              globalCheckInBannerVisible={
                selectedDate === todayStr && hasCheckInToday === false
              }
              addTasksA11yLabel={`${t('semana.addTasks')} ${selectedDayLabel}`}
              addMoreA11yLabel={`${t('semana.addMore')} ${selectedDayLabel}`}
            />
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
              focusCount={day.isToday ? todayPriorityStats.total : null}
              globalCheckInBannerVisible={day.isToday && hasCheckInToday === false}
              addTasksA11yLabel={`${t('semana.addTasks')} ${dayLabel}`}
              addMoreA11yLabel={`${t('semana.addMore')} ${dayLabel}`}
            />
          );
        })}

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

        {!loading && !subscriptionLoading && !isSubscribed && (
          <PremiumTeaserCard
            title={t('semana.premiumTitle')}
            body={t('premiumTeaser.semanaBody', { days: FREE_VISIBLE_DAYS })}
            paywallReturnTo="/(tabs)/semana"
          />
        )}

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
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonPlain: {
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  focusProgress: {
    marginTop: THEME.spacing.sm,
  },
  intro: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  viewToggle: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: 4,
  },
  viewToggleChip: {
    flex: 1,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleChipActive: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  viewToggleText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    fontFamily: THEME.fonts.heading.medium,
  },
  viewToggleTextActive: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
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
