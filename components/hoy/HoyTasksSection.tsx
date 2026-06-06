import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import {
  Plus,
  Heart,
  Target,
  ArrowRight,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  ClipboardList,
  CalendarRange,
} from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { TaskList } from '@/components/tasks/TaskList';
import { HoyTasksHero } from '@/components/hoy/HoyTasksHero';
import { HoyFocusPanel } from '@/components/hoy/HoyFocusPanel';
import { HoyRestOfDayPanel } from '@/components/hoy/HoyRestOfDayPanel';
import { HoyFocusScopeBanner } from '@/components/hoy/HoyFocusScopeBanner';
import { hoyTasksSectionStyles as styles } from '@/components/hoy/hoyTasksSectionStyles';
import { CATEGORY_ORDER_KEYS, categoryLabel, normalizeCategoryKey } from '@/lib/i18n/categoryLabels';
import { getPrioritizationExplainerBullets } from '@/lib/smartPrioritization';
import { getLocalDateString } from '@/lib/dateLocal';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { FocusProgressStats } from '@/components/FocusProgressBar';

export type HoyTaskSection = {
  id: string;
  title: string;
  color: string;
  isCategory: true;
  categoryKey: string;
  tasks: Task[];
};

export type EmotionalClosureCard = {
  title: string;
  message: string;
  note: string;
};

export type EmotionalMemoryInsight = {
  title: string;
  message: string;
  tip: string;
};

export type HoyTasksSectionProps = {
  todayMood: string | null;
  todayEmotionLabel: string;
  energyLevel: number;
  time: string;
  focusLevel: string;
  focusSummaryLine: string | null;
  todayPriorityStats: FocusProgressStats;
  getEmotionColor: (mood: string) => string;
  hoyLiteLayout: boolean | null;
  showSecondaryModulesEffective: boolean;
  heroDetailsExpanded: boolean;
  onToggleHeroDetails: () => void;
  explanation: { reasoning?: string; suggestion?: string };
  emotionalClosure: EmotionalClosureCard | null;
  emotionalToneLine: string | null;
  emotionalCardsAnim: Animated.Value;
  selectedEmotionalMemoryInsight: EmotionalMemoryInsight | null;
  taskFilter: 'hoy' | 'todas';
  onTaskFilterChange: (filter: 'hoy' | 'todas') => void;
  user: { id: string } | null;
  onShowRedistribute: () => void;
  tasks: Task[];
  incompleteTasks: Task[];
  displayedIncompleteTasks: Task[];
  incompleteTasksForToday: Task[];
  projectsMap: Record<string, { name: string; color?: string }>;
  getCategoryColor: (category: string) => string;
  expandedTasks: Set<string>;
  expandedDetailsTasks: Set<string>;
  menuOpen: string | null;
  onMenuPress: (taskId: string) => void;
  expandedSections: Set<string> | null;
  onExpandedSectionsChange: Dispatch<SetStateAction<Set<string> | null>>;
  looseTasksExpanded: boolean;
  onToggleLooseTasksExpanded: () => void;
  expandedProjectStepsTasks: Set<string>;
  onExpandedProjectStepsChange: Dispatch<SetStateAction<Set<string>>>;
  handleToggleTask: (taskId: string, isSubtask?: boolean, parentTaskId?: string) => void | Promise<void>;
  toggleTaskExpansion: (taskId: string) => void;
  toggleDetailsExpansion: (taskId: string) => void;
  handleEditTask: (task: Task) => void;
  handleDeleteTask: (task: Task) => void;
  toggleTask: (taskId: string, isSubtask: boolean, parentTaskId?: string) => void;
  getTaskPriorityInsightForList: (taskId: string) => { whyUp: string[]; whyDown: string[] } | undefined;
  compactFocusLayout?: boolean;
  /** Lista simple de pendientes (no focos) tras «Ver más» en vista foco. */
  restOfDayExpanded?: boolean;
  onCollapseRestOfDay?: () => void;
  displayName?: string;
  currentStreak?: number;
  coachSuggestion?: string;
  onOpenCalendar?: () => void;
  onShowMoreForToday?: () => void;
  onDeleteTask?: (task: Task) => void;
  onChangeEmotion?: () => void;
  showDayChangedCard?: boolean;
  showNothingDoneCard?: boolean;
  onQuickRecheck?: () => void;
  onDismissDayChanged?: () => void;
  onLightenLoad?: () => void;
};

export function HoyTasksSection({
  todayMood,
  todayEmotionLabel,
  energyLevel,
  time,
  focusLevel,
  focusSummaryLine,
  todayPriorityStats,
  getEmotionColor,
  hoyLiteLayout,
  showSecondaryModulesEffective,
  heroDetailsExpanded,
  onToggleHeroDetails,
  explanation,
  emotionalClosure,
  emotionalToneLine,
  emotionalCardsAnim,
  selectedEmotionalMemoryInsight,
  taskFilter,
  onTaskFilterChange,
  user,
  onShowRedistribute,
  tasks,
  incompleteTasks,
  displayedIncompleteTasks,
  incompleteTasksForToday,
  projectsMap,
  getCategoryColor,
  expandedTasks,
  expandedDetailsTasks,
  menuOpen,
  onMenuPress,
  expandedSections,
  onExpandedSectionsChange,
  looseTasksExpanded,
  onToggleLooseTasksExpanded,
  expandedProjectStepsTasks,
  onExpandedProjectStepsChange,
  handleToggleTask,
  toggleTaskExpansion,
  toggleDetailsExpansion,
  handleEditTask,
  handleDeleteTask,
  toggleTask,
  getTaskPriorityInsightForList,
  compactFocusLayout = false,
  restOfDayExpanded = false,
  onCollapseRestOfDay,
  displayName = '',
  currentStreak = 0,
  coachSuggestion = '',
  onOpenCalendar,
  onShowMoreForToday,
  onDeleteTask,
  onChangeEmotion,
  showDayChangedCard = false,
  showNothingDoneCard = false,
  onQuickRecheck,
  onDismissDayChanged,
  onLightenLoad,
}: HoyTasksSectionProps) {
  const { t, locale } = useI18n();

  const focusTasks = useMemo(
    () =>
      displayedIncompleteTasks.filter(
        (task) => task.is_priority && !task.parent_task_id,
      ),
    [displayedIncompleteTasks],
  );

  const focusTaskCount = focusTasks.length;

  const restOfDayTasks = useMemo(
    () =>
      incompleteTasksForToday.filter(
        (task) => !task.is_priority && !task.parent_task_id,
      ),
    [incompleteTasksForToday],
  );

  const taskSections = useMemo(() => {
    const byCategory = new Map<string, Task[]>();
    const normalizeCategory = (cat: string | undefined | null): string => {
      return normalizeCategoryKey(cat || 'otros') ?? 'otros';
    };
    displayedIncompleteTasks.forEach((task) => {
      const key = normalizeCategory(task.category);
      const list = byCategory.get(key) ?? [];
      list.push(task);
      byCategory.set(key, list);
    });
    const sortByPriority = (a: Task, b: Task) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0);
    const sections: HoyTaskSection[] = [];
    CATEGORY_ORDER_KEYS.forEach((key) => {
      const taskList = byCategory.get(key) ?? [];
      if (taskList.length === 0) return;
      const label = categoryLabel(locale, key);
      const color = getCategoryColor(key);
      sections.push({
        id: `cat-${key}`,
        title: label,
        color,
        isCategory: true,
        categoryKey: key,
        tasks: [...taskList].sort(sortByPriority),
      });
    });
    return sections;
  }, [displayedIncompleteTasks, getCategoryColor, locale]);

  const projectSectionsForToday = useMemo(() => {
    const byProject = new Map<string, number>();
    let looseCount = 0;
    displayedIncompleteTasks.forEach((task) => {
      const pid = task.project_id ?? null;
      if (pid) {
        byProject.set(pid, (byProject.get(pid) ?? 0) + 1);
      } else {
        looseCount += 1;
      }
    });
    const list: { id: string; name: string; color: string; count: number }[] = [];
    Object.entries(projectsMap).forEach(([id, { name, color }]) => {
      const count = byProject.get(id) ?? 0;
      list.push({ id, name, color: color ?? THEME.colors.gradient.blue, count });
    });
    list.sort((a, b) => b.count - a.count);
    return { projectRows: list, looseCount };
  }, [displayedIncompleteTasks, projectsMap]);

  const looseTasksList = useMemo(
    () => displayedIncompleteTasks.filter((task) => !task.project_id),
    [displayedIncompleteTasks],
  );

  useEffect(() => {
    onExpandedSectionsChange(null);
  }, [hoyLiteLayout, onExpandedSectionsChange]);

  if (compactFocusLayout && todayMood && onOpenCalendar) {
    return (
      <View style={styles.tasksContainer}>
        <HoyFocusPanel
          userId={user?.id}
          locale={locale}
          displayName={displayName}
          currentStreak={currentStreak}
          todayMood={todayMood}
          emotionLabel={todayEmotionLabel}
          energyLevel={energyLevel}
          time={time}
          focusLevel={focusLevel}
          coachSuggestion={coachSuggestion}
          priorityStats={todayPriorityStats}
          focusTasks={focusTasks}
          totalPending={incompleteTasksForToday.length}
          projectsMap={projectsMap}
          onToggleTask={(taskId) => void handleToggleTask(taskId)}
          onOpenTask={handleEditTask}
          onOpenCalendar={onOpenCalendar}
          onShowMoreForToday={restOfDayExpanded ? undefined : onShowMoreForToday}
          onDeleteTask={onDeleteTask}
          onChangeEmotion={onChangeEmotion}
          showDayChangedCard={showDayChangedCard}
          showNothingDoneCard={showNothingDoneCard}
          onQuickRecheck={onQuickRecheck}
          onDismissDayChanged={onDismissDayChanged}
          onLightenLoad={onLightenLoad}
          initialMoreOpen={hoyLiteLayout === false}
        />
        {restOfDayExpanded && onCollapseRestOfDay ? (
          <HoyRestOfDayPanel
            tasks={tasks}
            restTasks={restOfDayTasks}
            projectsMap={projectsMap}
            expandedTasks={expandedTasks}
            expandedDetailsTasks={expandedDetailsTasks}
            menuOpen={menuOpen}
            onMenuPress={onMenuPress}
            onToggleTask={handleToggleTask}
            onToggleExpansion={toggleTaskExpansion}
            onToggleDetailsExpansion={toggleDetailsExpansion}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onSubtaskToggle={(subtaskId, parentTaskId) => toggleTask(subtaskId, true, parentTaskId)}
            getCategoryColor={getCategoryColor}
            onCollapse={onCollapseRestOfDay}
          />
        ) : null}
      </View>
    );
  }

  return (
          <View style={styles.tasksContainer}>
            <View style={styles.tasksListCard}>
              {todayMood && !compactFocusLayout && (
                <View style={[styles.heroTodayWrap, styles.heroTodayWrapFirst]}>
                  <HoyTasksHero
                    todayMood={todayMood}
                    emotionColor={getEmotionColor(todayMood)}
                    emotionLabel={todayEmotionLabel}
                    energyLevel={energyLevel}
                    time={time}
                    focusLevel={focusLevel}
                    focusSummaryLine={focusSummaryLine}
                    priorityStats={todayPriorityStats}
                  />
                  {!hoyLiteLayout && (
                    <TouchableOpacity
                      style={[styles.prioritiesContext, styles.prioritiesContextUnderHero]}
                      onPress={onToggleHeroDetails}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        heroDetailsExpanded
                          ? t('hoyExtra.orderHide')
                          : t('hoyExtra.orderShow')
                      }
                    >
                      <View style={styles.prioritiesContextHeaderRow}>
                        <Text style={styles.heroDetailsToggleTitle} numberOfLines={1}>
                          {t('commonExtra.moreAboutTodayOrder')}
                        </Text>
                        {heroDetailsExpanded ? (
                          <ChevronDown size={16} color={THEME.colors.text.secondary} />
                        ) : (
                          <ChevronRight size={16} color={THEME.colors.text.secondary} />
                        )}
                      </View>
                      {heroDetailsExpanded && (
                        <View style={styles.heroDetailsExpandedBody}>
                          {explanation.reasoning ? (
                            <>
                              <Text style={styles.heroDetailsSectionLabel}>{t('hoy.perCheckIn')}</Text>
                              <Text style={styles.prioritiesContextText}>{explanation.reasoning}</Text>
                              {explanation.suggestion ? (
                                <View style={styles.prioritiesSuggestionBox}>
                                  <Lightbulb size={18} color={THEME.colors.gradient.blue} />
                                  <Text style={styles.prioritiesSuggestion}>{explanation.suggestion}</Text>
                                </View>
                              ) : null}
                            </>
                          ) : null}
                          <Text style={styles.heroDetailsSectionLabel}>{t('hoy.howPrioritizes')}</Text>
                          <View style={styles.prioritizeHowList}>
                            {getPrioritizationExplainerBullets(locale).map((line, i) => (
                              <Text key={i} style={styles.prioritizeHowBullet}>
                                • {line}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  {emotionalClosure && !hoyLiteLayout && showSecondaryModulesEffective && (
                    <Animated.View
                      style={[
                        styles.emotionalCardAnimatedWrap,
                        {
                          opacity: emotionalCardsAnim,
                          transform: [
                            {
                              translateY: emotionalCardsAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.fill[100]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emotionalClosureCard}
                      >
                        <View style={styles.emotionalSignalBadgeRow}>
                          <View style={styles.emotionalSignalBadge}>
                            <Text style={styles.emotionalSignalBadgeText}>{t('hoy.emotionalLoop')}</Text>
                          </View>
                          <View style={styles.emotionalSignalDot} />
                        </View>
                        <View style={styles.emotionalClosureHeader}>
                          <Target size={16} color={THEME.colors.gradient.blue} />
                          <Text style={styles.emotionalClosureTitle}>{emotionalClosure.title}</Text>
                        </View>
                        <Text style={styles.emotionalClosureMessage}>{emotionalClosure.message}</Text>
                        <View style={styles.emotionalSignalTipRow}>
                          <ArrowRight size={14} color={THEME.colors.gradient.blue} />
                          <Text style={styles.emotionalClosureNote}>{emotionalClosure.note}</Text>
                        </View>
                        <Text style={styles.emotionalToneLine}>{emotionalToneLine}</Text>
                      </LinearGradient>
                    </Animated.View>
                  )}
                </View>
              )}
              {selectedEmotionalMemoryInsight && !hoyLiteLayout && showSecondaryModulesEffective && (
                <Animated.View
                  style={[
                    styles.emotionalCardAnimatedWrap,
                    {
                      opacity: emotionalCardsAnim,
                      transform: [
                        {
                          translateY: emotionalCardsAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[THEME.colors.tint.pink.soft, THEME.colors.fill[100]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emotionalMemoryCard}
                  >
                    <View style={styles.emotionalSignalBadgeRow}>
                      <View style={[styles.emotionalSignalBadge, styles.emotionalMemoryBadge]}>
                        <Text style={styles.emotionalSignalBadgeText}>{t('commonExtra.weeklyMemory')}</Text>
                      </View>
                      <View style={styles.emotionalSignalDot} />
                    </View>
                    <View style={styles.emotionalMemoryHeader}>
                      <Heart size={16} color={THEME.colors.gradient.pink} />
                      <Text style={styles.emotionalMemoryTitle}>{selectedEmotionalMemoryInsight.title}</Text>
                    </View>
                    <Text style={styles.emotionalMemoryMessage}>{selectedEmotionalMemoryInsight.message}</Text>
                    <View style={styles.emotionalSignalTipRow}>
                      <ArrowRight size={14} color={THEME.colors.gradient.pink} />
                      <Text style={styles.emotionalMemoryTip}>{selectedEmotionalMemoryInsight.tip}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
              {todayMood && !compactFocusLayout ? (
                <HoyFocusScopeBanner
                  totalPending={incompleteTasks.length}
                  focusCount={todayPriorityStats.total}
                />
              ) : null}
              <View style={styles.tareasHeaderSection}>
              <Text style={styles.tareasTitle} numberOfLines={1}>
                {todayMood && compactFocusLayout
                  ? t('hoy.forTodayTitle')
                  : t('commonExtra.tasksSection')}
              </Text>
              {/* Fecha + filtros en una fila; el estado va debajo a todo el ancho (evita columna estrecha al lado de los pills). */}
              <View style={styles.tareasHeaderMetaRow}>
                <Text style={styles.tareasDate}>
                  {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                {!hoyLiteLayout && !compactFocusLayout && (
                  <View style={styles.taskFilterWrap}>
                    <TouchableOpacity
                      style={[styles.taskFilterPill, taskFilter === 'hoy' && styles.taskFilterPillActive]}
                      onPress={() => onTaskFilterChange('hoy')}
                      activeOpacity={0.8}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: taskFilter === 'hoy' }}
                      accessibilityLabel={t('hoyExtra.filterTodayA11y')}
                      accessibilityHint={t('hoyExtra.filterTodayHint')}
                    >
                      {taskFilter === 'hoy' && (
                        <LinearGradient
                          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Text style={[styles.taskFilterLabel, taskFilter === 'hoy' && styles.taskFilterLabelActive]}>
                        {t('hoy.filterToday')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taskFilterPill, taskFilter === 'todas' && styles.taskFilterPillActive]}
                      onPress={() => onTaskFilterChange('todas')}
                      activeOpacity={0.8}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: taskFilter === 'todas' }}
                      accessibilityLabel={t('hoyExtra.filterAllA11y')}
                      accessibilityHint={t('hoyExtra.filterAllHint')}
                    >
                      {taskFilter === 'todas' && (
                        <LinearGradient
                          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Text style={[styles.taskFilterLabel, taskFilter === 'todas' && styles.taskFilterLabelActive]}>
                        {t('hoy.filterAll')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.tareasSubtitle}>
                {displayedIncompleteTasks.length === 0
                  ? taskFilter === 'hoy'
                    ? t('hoy.noTasksToday')
                    : t('hoy.noTasksPending')
                  : taskFilter === 'hoy'
                    ? t(
                        displayedIncompleteTasks.length === 1
                          ? 'hoy.taskCountToday'
                          : 'hoy.taskCountTodayPlural',
                        { count: displayedIncompleteTasks.length },
                      )
                    : t(
                        displayedIncompleteTasks.length === 1
                          ? 'hoy.taskCountPending'
                          : 'hoy.taskCountPendingPlural',
                        { count: displayedIncompleteTasks.length },
                      )}
              </Text>
              {taskFilter === 'hoy' && !hoyLiteLayout && !compactFocusLayout && (
                <Text style={styles.taskFilterHint}>{t('hoy.filterHint')}</Text>
              )}
              {displayedIncompleteTasks.length > 0 && (
                <Text style={styles.taskCompactHint} accessibilityRole="text">
                  {todayMood ? t('hoy.sortHint') : t('hoy.noFeelSortHint')}
                </Text>
              )}
              {todayMood && focusTaskCount > 0 && (
                <View style={styles.focusSectionBanner}>
                  <Target size={18} color={THEME.colors.gradient.blue} />
                  <View style={styles.focusSectionBannerText}>
                    <Text style={styles.focusSectionTitle}>
                      {t('hoy.focusSectionTitle', { count: focusTaskCount })}
                    </Text>
                    <Text style={styles.focusSectionSub}>{t('hoy.focusSectionSub')}</Text>
                  </View>
                </View>
              )}
              {incompleteTasks.length >= 1 && user && todayMood && showSecondaryModulesEffective && (
                <TouchableOpacity
                  style={styles.redistributeCta}
                  onPress={onShowRedistribute}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('hoyExtra.redistributeA11y')}
                  accessibilityHint={t('hoyExtra.redistributeHint')}
                >
                  <CalendarRange size={20} color={THEME.colors.gradient.blue} />
                  <View style={styles.redistributeCtaTextWrap}>
                    <Text style={styles.redistributeCtaTitle}>{t('hoy.lightenLoad')}</Text>
                    <Text style={styles.redistributeCtaSub} numberOfLines={2}>
                      {t('hoy.lightenLoadSub')}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={THEME.colors.text.tertiary} />
                </TouchableOpacity>
              )}
              </View>

              {/* Resumen por tipo de tarea: proyectos y tareas sin proyecto (debajo del encabezado para evitar hueco) */}
              {showSecondaryModulesEffective && (projectSectionsForToday.projectRows.length > 0) && (
                <View style={styles.byProjectSection}>
                  <View style={styles.byProjectHeader}>
                    <View style={styles.byProjectHeaderLeft}>
                      <View style={styles.byProjectHeaderIconWrap}>
                        <FolderKanban size={20} color={THEME.colors.gradient.blue} />
                      </View>
                      <Text style={styles.byProjectTitle} numberOfLines={1}>
                        {t('hoyExtra.tasksSummaryTitle')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.byProjectVerTodosHeader}
                      onPress={() => router.push('/proyectos')}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={t('hoyExtra.allProjectsA11y')}
                      accessibilityHint={t('hoyExtra.allProjectsHint')}
                    >
                      <Text style={styles.byProjectVerTodosText}>{t('hoy.viewAll')}</Text>
                      <ChevronRight size={18} color={THEME.colors.gradient.blue} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.byProjectList}>
                    {projectSectionsForToday.projectRows.map((row) => (
                      <TouchableOpacity
                        key={row.id}
                        style={styles.byProjectRow}
                        onPress={() => router.push(`/project/${row.id}` as const)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={t('hoyPlanFallback.projectRowA11y', { name: row.name, count: row.count })}
                        accessibilityHint={t('hoyExtra.openProjectHint')}
                      >
                        <View style={[styles.byProjectColorBar, { backgroundColor: row.color }]} />
                        <View style={styles.byProjectRowContent}>
                          <Text style={styles.byProjectRowName} numberOfLines={1}>{row.name}</Text>
                          <Text style={styles.byProjectRowCount}>
                            {row.count === 0 ? t('hoyExtra.noPending') : row.count === 1 ? t('hoyExtra.pendingOne', { count: row.count }) : t('hoyExtra.pendingMany', { count: row.count })}
                          </Text>
                        </View>
                        <ChevronRight size={20} color={THEME.colors.text.tertiary} />
                      </TouchableOpacity>
                    ))}
                    {projectSectionsForToday.looseCount > 0 && (
                      <>
                        <TouchableOpacity
                          style={styles.byProjectRowLoose}
                          onPress={onToggleLooseTasksExpanded}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={looseTasksExpanded ? t('hoyExtra.collapseLoose') : t('hoyExtra.expandLoose', { count: projectSectionsForToday.looseCount })}
                          accessibilityState={{ expanded: looseTasksExpanded }}
                        >
                          <View style={[styles.byProjectColorBar, { backgroundColor: THEME.colors.text.tertiary }]} />
                          <View style={styles.byProjectRowContent}>
                            <Text style={styles.byProjectRowName}>{t('hoy.looseTasks')}</Text>
                            <Text style={styles.byProjectRowCount}>
                              {t(
                                projectSectionsForToday.looseCount === 1
                                  ? 'sectionHeader.taskOne'
                                  : 'sectionHeader.taskMany',
                                { count: projectSectionsForToday.looseCount },
                              )}
                            </Text>
                          </View>
                          {looseTasksExpanded ? (
                            <ChevronDown size={20} color={THEME.colors.text.tertiary} />
                          ) : (
                            <ChevronRight size={20} color={THEME.colors.text.tertiary} />
                          )}
                        </TouchableOpacity>
                        {looseTasksExpanded && looseTasksList.length > 0 && (
                          <View style={styles.byProjectLooseList}>
                            <TaskList
                              tasks={tasks}
                              incompleteTasks={looseTasksList}
                              expandedTasks={expandedTasks}
                              expandedDetailsTasks={expandedDetailsTasks}
                              menuOpen={menuOpen}
                              onToggleTask={handleToggleTask}
                              onToggleExpansion={toggleTaskExpansion}
                              onToggleDetailsExpansion={toggleDetailsExpansion}
                              onMenuPress={onMenuPress}
                              onEditTask={handleEditTask}
                              onDeleteTask={handleDeleteTask}
                              getCategoryColor={getCategoryColor}
                              onSubtaskToggle={(subtaskId, parentTaskId) => toggleTask(subtaskId, true, parentTaskId)}
                              getProjectInfo={() => ({ label: '', color: THEME.colors.text.secondary })}
                              getProjectSteps={(_projectId, _excludeTaskId) => []}
                              expandedProjectSteps={expandedProjectStepsTasks}
                              onToggleProjectSteps={(taskId) => {
                                onExpandedProjectStepsChange((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(taskId)) next.delete(taskId);
                                  else next.add(taskId);
                                  return next;
                                });
                              }}
                              onPressProject={() => {}}
                              hideProjectLabel={true}
                              sectionAccentColor={THEME.colors.text.secondary}
                              sectionCategory="otros"
                              uniformCard
                              getTaskPriorityInsight={getTaskPriorityInsightForList}
                            />
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              )}
              {displayedIncompleteTasks.length > 0 ? (
                taskSections.map((sec) => {
                  const isSectionExpanded = expandedSections === null || expandedSections.has(sec.id);
                  const toggleSection = () => {
                    onExpandedSectionsChange((prev) => {
                      const expanded = prev === null || prev.has(sec.id);
                      if (expanded) {
                        if (prev === null) {
                          return new Set<string>(taskSections.map((s) => s.id).filter((id) => id !== sec.id));
                        }
                        const next = new Set<string>(prev);
                        next.delete(sec.id);
                        return next;
                      }
                      const next = prev === null ? new Set<string>() : new Set<string>(prev);
                      next.add(sec.id);
                      return next;
                    });
                  };
                  return (
                    <View key={sec.id} style={styles.areaCard}>
                      <TouchableOpacity
                        style={[styles.categoryLabelStrip, { borderLeftColor: sec.color }]}
                        onPress={toggleSection}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={isSectionExpanded ? t('hoyPlanFallback.collapseSection', { title: sec.title }) : t('hoyPlanFallback.expandSection', { count: sec.tasks.length, title: sec.title })}
                        accessibilityState={{ expanded: isSectionExpanded }}
                      >
                        <Text style={styles.categoryLabelName}>{sec.title}</Text>
                        <View style={styles.categoryLabelRight}>
                          <Text style={styles.categoryLabelCount}>
                            {t(
                              sec.tasks.length === 1 ? 'sectionHeader.taskOne' : 'sectionHeader.taskMany',
                              { count: sec.tasks.length },
                            )}
                          </Text>
                          {isSectionExpanded ? (
                            <ChevronDown size={20} color={sec.color} style={styles.categoryLabelChevron} />
                          ) : (
                            <ChevronRight size={20} color={sec.color} style={styles.categoryLabelChevron} />
                          )}
                        </View>
                      </TouchableOpacity>
                      {isSectionExpanded && (
                        <View style={styles.areaCardInner}>
                          <TaskList
                            tasks={tasks}
                            incompleteTasks={sec.tasks}
                            expandedTasks={expandedTasks}
                            expandedDetailsTasks={expandedDetailsTasks}
                            menuOpen={menuOpen}
                            onToggleTask={handleToggleTask}
                            onToggleExpansion={toggleTaskExpansion}
                            onToggleDetailsExpansion={toggleDetailsExpansion}
                            onMenuPress={onMenuPress}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            getCategoryColor={getCategoryColor}
                            onSubtaskToggle={(subtaskId, parentTaskId) => toggleTask(subtaskId, true, parentTaskId)}
                            getProjectInfo={(task) => {
                              const projectId = task.parent_task_id
                                ? (incompleteTasks.find((t) => t.id === task.parent_task_id) ?? tasks.find((t) => t.id === task.parent_task_id))?.project_id ?? task.project_id
                                : task.project_id;
                              if (task.parent_task_id && projectId) {
                                const p = projectsMap[projectId];
                                const name = p?.name ?? t('hoyExtra.projectFallback');
                                return {
                                  label: t('hoyExtra.partOf', { name }),
                                  color: p?.color ?? THEME.colors.gradient.blue,
                                  projectId,
                                  projectName: name,
                                };
                              }
                              if (task.project_id) {
                                const p = projectsMap[task.project_id];
                                const name = p?.name ?? t('hoyExtra.projectFallback');
                                return {
                                  label: t('hoyExtra.projectColon', { name }), color: p?.color ?? THEME.colors.gradient.blue, projectId: task.project_id, projectName: name };
                              }
                              return { label: '', color: THEME.colors.text.secondary };
                            }}
                            getProjectSteps={(projectId, excludeTaskId) =>
                              displayedIncompleteTasks.filter(
                                (t) => t.project_id === projectId && t.id !== excludeTaskId
                              )
                            }
                            expandedProjectSteps={expandedProjectStepsTasks}
                            onToggleProjectSteps={(taskId) => {
                              onExpandedProjectStepsChange((prev) => {
                                const next = new Set(prev);
                                if (next.has(taskId)) next.delete(taskId);
                                else next.add(taskId);
                                return next;
                              });
                            }}
                            onPressProject={(projectId) => router.push(`/project/${projectId}` as const)}
                            hideProjectLabel={false}
                            sectionAccentColor={sec.color}
                            sectionCategory={sec.categoryKey}
                            uniformCard
                            getTaskPriorityInsight={getTaskPriorityInsightForList}
                          />
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyTasksInCard}>
                  <ClipboardList size={40} color={THEME.colors.gradient.blue} style={styles.emptyTasksIcon} />
                  {incompleteTasks.length === 0 && tasks.length > 0 ? (
                    <>
                      <Text style={styles.emptyTasksTitle}>{t('hoy.allDone')}</Text>
                      <Text style={styles.emptyTasksInCardText}>{t('hoy.allDoneSub')}</Text>
                    </>
                  ) : taskFilter === 'hoy' &&
                    incompleteTasks.length > 0 &&
                    incompleteTasksForToday.length === 0 ? (
                    <>
                      <Text style={styles.emptyTasksTitle}>{t('hoy.noTasksToday')}</Text>
                      <Text style={styles.emptyTasksInCardText}>{t('hoy.noTasksOtherDays')}</Text>
                      <View style={styles.emptyTasksActions}>
                        <TouchableOpacity
                          style={styles.emptyTasksLinkPill}
                          onPress={() => onTaskFilterChange('todas')}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={t('hoyExtra.filterAllA11y')}
                        >
                          <Text style={styles.emptyTasksLinkPillText}>{t('commonExtra.viewAllTasks')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.emptyTasksLinkPill, styles.emptyTasksLinkPillSecond]}
                          onPress={() =>
                            router.push(
                              `/(tabs)/vaciar?date=${getLocalDateString()}`,
                            )
                          }
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={t('hoyExtra.addTodayA11y')}
                          accessibilityHint={t('hoyExtra.addTodayHint')}
                        >
                          <Text style={styles.emptyTasksLinkPillText}>{t('commonExtra.addForToday')}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyTasksTitle}>{t('hoy.listStarts')}</Text>
                      <Text style={styles.emptyTasksInCardText}>{t('hoy.listStartsSub')}</Text>
                    </>
                  )}
                  <View style={styles.emptyTasksCta}>
                    <CalmPrimaryButton
                      label={t('hoy.goToTasks')}
                      onPress={() => router.push('/(tabs)/vaciar')}
                      large
                    />
                    {incompleteTasks.length === 0 && tasks.length > 0 ? (
                      <TouchableOpacity
                        style={styles.emptyTasksSecondaryCta}
                        onPress={() => openRecheckCheckIn('hoy_tasks_empty')}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={t('hoyExtra.goFeelA11y')}
                        accessibilityHint={t('hoyExtra.goFeelHint')}
                      >
                        <Text style={styles.emptyTasksSecondaryCtaText}>{t('commonExtra.goToFeelShort')}</Text>
                        <ChevronRight size={18} color={THEME.colors.gradient.blue} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}

              {displayedIncompleteTasks.length > 0 && (
                <TouchableOpacity
                  style={styles.agregarMasWrap}
                  onPress={() => router.push('/(tabs)/vaciar')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('hoyExtra.addMoreA11y')}
                  accessibilityHint={t('hoyExtra.addMoreHint')}
                >
                  <Plus size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.agregarMasHint}>{t('commonExtra.addMoreTasksHint')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
  );
}
