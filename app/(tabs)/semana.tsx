import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWeekTasks, getWeekOptions } from '@/hooks/useWeekTasks';
import type { Task } from '@/hooks/useTasks';
import { getSupabaseEnvStatus } from '@/lib/envCheck';
import { Calendar, Plus, FolderKanban, FileText, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { PremiumTeaserCard } from '@/components/PremiumTeaserCard';
import { FocusProgressBar } from '@/components/FocusProgressBar';
import { getTodayPriorityStats } from '@/lib/priorityProgress';
import { getLocalDateString } from '@/lib/dateLocal';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const FREE_VISIBLE_DAYS = 3;

function formatDayLabel(dateStr: string, months: readonly string[]): string {
  const dayNum = parseInt(dateStr.slice(8, 10), 10);
  const month = months[parseInt(dateStr.slice(5, 7), 10) - 1];
  return `${dayNum} ${month}`;
}

export default function SemanaScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const { user } = useAuth();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  void toastMessage; // used by showToast; Toast UI not rendered on this screen
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToastMessage(msg), []);

  const { weekTasks, projects, loading, loadWeekTasks, getWeekBounds, lastLoadError, schemaSetupType } = useWeekTasks(showToast, locale);
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
    loadWeekTasks(selectedWeekStart || undefined);
  }, [loadWeekTasks, selectedWeekStart]);

  const handlePrevWeek = useCallback(() => {
    if (!canGoPrev) return;
    setSelectedWeekStart(weekOptions[weekIndex - 1].start);
  }, [canGoPrev, weekIndex, weekOptions]);

  const handleNextWeek = useCallback(() => {
    if (!canGoNext) return;
    setSelectedWeekStart(weekOptions[weekIndex + 1].start);
  }, [canGoNext, weekIndex, weekOptions]);

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

  const todayStr = getLocalDateString();
  const todayWeekTasks = useMemo(() => {
    const todayDay = filteredWeekTasks.find(({ day }) => day.dateStr === todayStr);
    return todayDay?.tasks ?? [];
  }, [filteredWeekTasks, todayStr]);

  const todayPriorityStats = useMemo(
    () => getTodayPriorityStats(todayWeekTasks),
    [todayWeekTasks],
  );

  const weekIncludesToday = filteredWeekTasks.some(({ day }) => day.dateStr === todayStr);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + THEME.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadWeekTasks(selectedWeekStart || undefined)}
            tintColor={THEME.colors.gradient.blue}
          />
        }
      >
        <LinearGradient
          colors={THEME.colors.gradientTint.header}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('semanaExtra.a11yOpenAddTasks')}
              style={styles.headerCalendarButtonWrap}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCalendarButton}
              >
                <Calendar size={22} color={THEME.colors.onGradient} />
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{t('semana.title')}</Text>
              <Text style={styles.subtitle}>{t('semana.subtitle')}</Text>
              {weekIncludesToday && (
                <FocusProgressBar stats={todayPriorityStats} style={styles.focusProgress} />
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.weekNav}>
          <TouchableOpacity
            style={[styles.weekNavButton, !canGoPrev && styles.weekNavButtonDisabled]}
            onPress={handlePrevWeek}
            disabled={!canGoPrev}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('semanaExtra.a11yPrevWeek')}
          >
            <ChevronLeft size={22} color={canGoPrev ? THEME.colors.gradient.blue : THEME.colors.text.secondary} />
            <Text style={[styles.weekNavButtonText, !canGoPrev && styles.weekNavButtonTextDisabled]}>
              {t('semana.prev')}
            </Text>
          </TouchableOpacity>
          <View style={styles.weekNavCenterWrap}>
            <LinearGradient
              colors={THEME.colors.gradientTint.weekNav}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.weekNavCenter}
            >
              <Text style={styles.weekNavLabel} numberOfLines={1}>
                {displayWeekLabel}
              </Text>
            </LinearGradient>
          </View>
          <TouchableOpacity
            style={[styles.weekNavButton, !canGoNext && styles.weekNavButtonDisabled]}
            onPress={handleNextWeek}
            disabled={!canGoNext}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('semanaExtra.a11yNextWeek')}
          >
            <Text style={[styles.weekNavButtonText, !canGoNext && styles.weekNavButtonTextDisabled]}>
              {t('semana.next')}
            </Text>
            <ChevronRight size={22} color={canGoNext ? THEME.colors.gradient.blue : THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              onPress={() => setSelectedProjectId(null)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('semanaExtra.a11yViewAllTasks')}
              style={styles.filterChipTouchable}
            >
              {!selectedProjectId ? (
                <LinearGradient
                  colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterChipGradient}
                >
                  <Text style={styles.filterChipTextSelected}>{t('semana.all')}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{t('semana.all')}</Text>
                </View>
              )}
            </TouchableOpacity>
            {projects.map((p) => {
              const isSelected = selectedProjectId === p.id;
              const chipColor = p.color || THEME.colors.gradient.blue;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedProjectId(p.id)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('semanaExtra.a11yFilterProject', { name: p.name })}
                  style={styles.filterChipTouchable}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[chipColor, chipColor]}
                      style={[styles.filterChipGradient, { opacity: 0.95 }]}
                    >
                      <View style={[styles.filterChipDotLight, { backgroundColor: THEME.colors.onGradientMuted }]} />
                      <Text style={styles.filterChipTextSelected} numberOfLines={1}>{p.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterChip}>
                      <View style={[styles.filterChipDot, { backgroundColor: chipColor }]} />
                      <Text style={styles.filterChipText} numberOfLines={1}>{p.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <Text style={styles.loadingWeek}>{t('semana.loadingDays')}</Text>
        ) : null}

        {!loading && visibleWeekTasks.map(({ day, tasks }) => (
          <View key={day.dateStr} style={styles.daySection}>
            {day.isToday ? (
              <LinearGradient
                colors={THEME.colors.gradientTint.dayToday}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.dayHeader, styles.dayHeaderToday]}
              >
                <Text style={[styles.dayLabel, styles.dayLabelToday]} numberOfLines={1}>
                  {formatDayLabel(day.dateStr, monthNames)}
                </Text>
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>{t('semana.today')}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel} numberOfLines={1}>
                  {formatDayLabel(day.dateStr, monthNames)}
                </Text>
              </View>
            )}

            {tasks.length === 0 ? (
              <View style={styles.dayBody}>
                <View style={styles.emptyDay}>
                  <Text style={styles.emptyDayEmoji}>📅</Text>
                  <Text style={styles.emptyDayText}>{t('semana.emptyDay')}</Text>
                  <Text style={styles.emptyDayHint}>{t('semana.emptyHint')}</Text>
                  <TouchableOpacity
                    style={styles.addDayButtonWrap}
                    onPress={() => router.push(`/(tabs)/vaciar?date=${day.dateStr}`)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('semana.addTasks')} ${formatDayLabel(day.dateStr, monthNames)}`}
                  >
                    <LinearGradient
                      colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.addDayButton}
                    >
                      <Plus size={18} color={THEME.colors.onGradient} />
                      <Text style={styles.addDayButtonText}>{t('semana.addTasks')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.dayBody}>
                <View style={styles.taskList}>
                  {tasks.map((task) => (
                    <WeekTaskItem
                      key={task.id}
                      task={task}
                      projectName={
                        task.project_id
                          ? projectsMap[task.project_id]?.name || t('semana.projectFallback')
                          : null
                      }
                      projectColor={
                        task.project_id
                          ? projectsMap[task.project_id]?.color || THEME.colors.gradient.blue
                          : undefined
                      }
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.addDayButtonOutlined}
                  onPress={() => router.push(`/(tabs)/vaciar?date=${day.dateStr}`)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('semana.addMore')} ${formatDayLabel(day.dateStr, monthNames)}`}
                >
                  <Plus size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.addDayButtonTextOutlined}>{t('semana.addMore')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('semana.addTasksOrProjects')}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Plus size={22} color={THEME.colors.onGradient} />
              <Text style={styles.addButtonText}>{t('semana.addTasksOrProjects')}</Text>
            </LinearGradient>
          </TouchableOpacity>

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

        {!loading && !subscriptionLoading && !isSubscribed && (
          <PremiumTeaserCard
            title={t('semana.premiumTitle')}
            body={t('semanaExtra.premiumBody', { days: FREE_VISIBLE_DAYS })}
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
      </ScrollView>
    </View>
  );
}

function WeekTaskItem({
  task,
  projectName,
  projectColor,
}: {
  task: Task;
  projectName: string | null;
  projectColor?: string;
}) {
  const { t } = useI18n();
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const accentColor = projectColor || THEME.colors.gradient.blue;

  return (
    <View style={[styles.taskCard, { borderLeftColor: accentColor }]}>
      <View style={styles.taskRow}>
        <View
          style={[
            styles.taskCheck,
            task.is_completed && styles.taskCheckCompleted,
          ]}
        />
        <View style={styles.taskBody}>
          {projectName ? (
            <View style={styles.projectBadge}>
              <FolderKanban size={12} color={accentColor} />
              <Text style={[styles.projectBadgeText, { color: accentColor }]}>{projectName}</Text>
            </View>
          ) : (
            <View style={styles.standaloneBadge}>
              <FileText size={12} color={THEME.colors.text.secondary} />
              <Text style={styles.standaloneBadgeText}>{t('semana.looseTasks')}</Text>
            </View>
          )}
          <Text
            style={[
              styles.taskContent,
              task.is_completed && styles.taskContentCompleted,
            ]}
            numberOfLines={2}
          >
            {task.content}
          </Text>
          {hasSubtasks && (
            <View style={styles.subtasksList}>
              {task.subtasks!.map((st) => (
                <View key={st.id} style={styles.subtaskRow}>
                  <ChevronRight size={14} color={THEME.colors.text.secondary} />
                  <Text
                    style={[
                      styles.subtaskContent,
                      st.is_completed && styles.taskContentCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {st.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    paddingBottom: THEME.spacing.xl,
  },
  headerGradient: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  headerCalendarButtonWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  headerCalendarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    ...THEME.typography.h2,
    fontSize: 26,
    color: THEME.colors.text.main,
    marginBottom: 2,
  },
  subtitle: {
    ...THEME.typography.body,
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  focusProgress: {
    marginTop: THEME.spacing.sm,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  weekNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    minWidth: 90,
    maxWidth: 100,
  },
  weekNavButtonDisabled: {
    opacity: 0.5,
  },
  weekNavButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  weekNavButtonTextDisabled: {
    color: THEME.colors.text.secondary,
  },
  weekNavCenterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  weekNavCenter: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  weekNavLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  filterRow: {
    marginBottom: THEME.spacing.md,
  },
  filterContent: {
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  filterChipTouchable: {
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs + 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  filterChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs + 2,
    borderRadius: THEME.borderRadius.pill,
  },
  filterChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipDotLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
  },
  filterChipTextSelected: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  loadingWeek: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  daySection: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: 0,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: 0,
    backgroundColor: THEME.colors.fill[200],
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  dayHeaderToday: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.surfaceOverlay.borderMedium,
  },
  dayBody: {
    padding: THEME.spacing.md,
  },
  dayLabel: {
    ...THEME.typography.h3,
    fontSize: 16,
    color: THEME.colors.text.main,
  },
  dayLabelToday: {
    color: THEME.colors.gradient.blue,
  },
  todayBadge: {
    marginLeft: THEME.spacing.sm,
    backgroundColor: THEME.colors.gradient.blue,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.standard,
  },
  todayBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyDay: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    alignItems: 'center',
  },
  emptyDayEmoji: {
    fontSize: 40,
    marginBottom: THEME.spacing.xs,
  },
  emptyDayText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  emptyDayHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: THEME.spacing.md,
  },
  addDayButtonWrap: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    alignSelf: 'stretch',
    ...THEME.shadows.soft,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  addDayButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 14,
  },
  addDayButtonOutlined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    marginTop: THEME.spacing.xs,
  },
  addDayButtonTextOutlined: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 13,
  },
  taskList: {
    gap: THEME.spacing.xs,
  },
  taskCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    borderLeftWidth: 4,
    ...THEME.shadows.soft,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
    marginTop: 2,
  },
  taskCheckCompleted: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  taskBody: {
    flex: 1,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  projectBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  standaloneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  standaloneBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  taskContent: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  taskContentCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  subtasksList: {
    marginTop: THEME.spacing.xs,
    paddingLeft: THEME.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.fill[200],
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  subtaskContent: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  bottomSection: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    gap: THEME.spacing.md,
  },
  addButton: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md + 4,
    paddingHorizontal: THEME.spacing.lg,
  },
  addButtonText: {
    ...THEME.typography.body,
    fontSize: 16,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
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
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
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
