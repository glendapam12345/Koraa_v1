import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { THEME } from '@/constants/theme';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { HoyFocusTaskRow } from '@/components/hoy/HoyFocusTaskRow';
import { HoyDailyPlanCard } from '@/components/hoy/HoyDailyPlanCard';
import { HoyFeelHero } from '@/components/hoy/HoyFeelHero';
import { HoyMoodHeroCard } from '@/components/hoy/HoyMoodHeroCard';
import { HoyNightCompanionCard } from '@/components/hoy/HoyNightCompanionCard';
import { HoyCrisisBanner } from '@/components/hoy/HoyCrisisBanner';
import { HoyGentleRhythmStrip } from '@/components/hoy/HoyGentleRhythmStrip';
import { HoyMoveTasksLink } from '@/components/hoy/HoyMoveTasksLink';
import { HoyLitePeekCard } from '@/components/hoy/HoyLitePeekCard';
import { HoyPlanAreaBlock } from '@/components/hoy/HoyPlanAreaBlock';
import { HoyDayCapacitySummary } from '@/components/hoy/HoyDayCapacitySummary';
import { HoyAfternoonNudge } from '@/components/hoy/HoyAfternoonNudge';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { getEmotionEmoji } from '@/lib/emotionEmoji';
import { isLateNight } from '@/lib/timeOfDayContext';
import { CARE_MODE_MAX_FOCUS_STEPS, getCareModeTaskCounts } from '@/lib/hoyCareMode';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';
import type { ProjectProgressMap } from '@/hooks/useHoyFocusTaskMeta';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import type { DayCapacitySnapshot } from '@/lib/hoy/dayCapacity';
import {
  buildFocusTaskDeadline,
  formatFocusTaskDuration,
  getFocusTaskEstimatedMinutes,
  getFocusTaskPreferredTimeLabel,
  type HoyProjectInfo,
} from '@/lib/hoy/focusTaskDisplay';
import { buildHoyPlanAreaGroups } from '@/lib/hoy/buildHoyPlanAreaGroups';
import { makePresetCustomAreaLabelGetter } from '@/lib/lifeAreas/makePresetCustomAreaLabelGetter';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';

type HoyFocusPanelProps = {
  locale: AppLocale;
  displayName: string;
  todayMood: string;
  emotionLabel: string;
  energyLevel: number;
  time?: string;
  focusLevel?: string;
  coachSuggestion: string;
  aiPlanHeadline?: string;
  focusFromAi?: boolean;
  priorityStats: FocusProgressStats;
  focusTasks: Task[];
  totalPending: number;
  projectsMap: Record<string, HoyProjectInfo>;
  projectProgress: ProjectProgressMap;
  planningMeta: Record<string, TaskPlanningMeta>;
  onToggleTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  onPostponeTask?: (taskId: string) => void;
  onMoveFocusTask?: (taskId: string, direction: 'up' | 'down') => void;
  orderedFocusTasks?: Task[];
  orderedWaitingTasks?: Task[];
  onMoveWaitingTask?: (taskId: string, direction: 'up' | 'down') => void;
  restExpanded?: boolean;
  onRestExpandedChange?: (open: boolean) => void;
  onDeleteTask?: (task: Task) => void;
  onChangeEmotion?: () => void;
  /** Primer día en Hoy: menos secciones; el peek explica qué hay guardado. */
  compactLayout?: boolean;
  onShowFullView?: () => void;
  /** Emergency Kit: suaviza pasos sugeridos (1 visible, el resto puede esperar). */
  crisisMode?: boolean;
  /** Filas interactivas de tareas que pueden esperar. */
  waitingTasksSlot?: ReactNode;
  /** Tareas fuera del plan principal de hoy. */
  waitingCount?: number;
  onCareModeDismiss?: () => void;
  onCareModeLearnMore?: () => void;
  focusedProject?: FocusedProjectInfo | null;
  onClearFocusedProject?: () => void;
  lifeAreasConfig?: UserLifeAreasConfig;
  dayCapacity?: DayCapacitySnapshot | null;
  onAdjustDay?: () => void;
  showAfternoonNudge?: boolean;
  hideRhythmStrip?: boolean;
};

export function HoyFocusPanel({
  locale,
  displayName,
  emotionLabel,
  energyLevel,
  time = '',
  focusLevel = '',
  todayMood,
  coachSuggestion,
  aiPlanHeadline = '',
  focusFromAi = false,
  priorityStats,
  focusTasks,
  totalPending,
  projectsMap,
  projectProgress,
  planningMeta,
  onToggleTask,
  onOpenTask,
  onPostponeTask,
  onMoveFocusTask,
  orderedFocusTasks,
  orderedWaitingTasks,
  onMoveWaitingTask,
  restExpanded = false,
  onRestExpandedChange,
  onDeleteTask,
  onChangeEmotion,
  compactLayout = false,
  onShowFullView,
  crisisMode = false,
  waitingTasksSlot,
  waitingCount,
  onCareModeDismiss,
  onCareModeLearnMore,
  focusedProject = null,
  onClearFocusedProject,
  lifeAreasConfig,
  dayCapacity = null,
  onAdjustDay,
  showAfternoonNudge = false,
  hideRhythmStrip = false,
}: HoyFocusPanelProps) {
  const { t } = useI18n();
  const getDefaultAreaLabel = (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey);
  const getPresetCustomLabel = makePresetCustomAreaLabelGetter(t);
  const [prioritiesExpanded, setPrioritiesExpanded] = useState(true);
  const [waitingExpanded, setWaitingExpanded] = useState(true);

  const emotionEmoji = getEmotionEmoji(todayMood);
  const incompleteFocusTasks = useMemo(() => {
    const source = orderedFocusTasks ?? focusTasks.filter((task) => !task.is_completed);
    return source.filter((task) => !task.is_completed);
  }, [focusTasks, orderedFocusTasks]);

  const displayFocusTasks = useMemo(() => {
    const source = orderedFocusTasks ?? focusTasks;
    if (crisisMode) {
      const open = source.filter((task) => !task.is_completed);
      return open.slice(0, CARE_MODE_MAX_FOCUS_STEPS);
    }
    return source;
  }, [crisisMode, focusTasks, orderedFocusTasks]);

  useEffect(() => {
    if (incompleteFocusTasks.length > 0) {
      setPrioritiesExpanded(true);
    }
  }, [incompleteFocusTasks.length]);
  const nonFocusPending = Math.max(0, totalPending - incompleteFocusTasks.length);
  const allFocusDone =
    priorityStats.total > 0 && priorityStats.done >= priorityStats.total;

  const addTasksButton = (
    <TouchableOpacity
      style={styles.addTasksBtn}
      onPress={() => openVaciarCapture()}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.planAddTasksCta')}
      accessibilityHint={t('hoy.planAddTasksHint')}
    >
      <Text style={styles.addTasksLabel}>{t('hoy.planAddTasksCta')}</Text>
    </TouchableOpacity>
  );

  const openFeel = () => {
    if (onChangeEmotion) {
      onChangeEmotion();
      return;
    }
    openRecheckCheckIn('hoy_focus');
  };

  const hasCheckIn = Boolean(todayMood);

  const visibleFocusTasks = useMemo(() => {
    if (!prioritiesExpanded) return [];
    return displayFocusTasks;
  }, [displayFocusTasks, prioritiesExpanded]);

  const careCounts = crisisMode ? getCareModeTaskCounts(incompleteFocusTasks.length, nonFocusPending) : null;
  const restLinkCount = waitingCount ?? careCounts?.waitingCount ?? nonFocusPending;

  const togglePriorities = () => {
    setPrioritiesExpanded((open) => !open);
  };

  const toggleWaiting = () => {
    setWaitingExpanded((open) => !open);
  };

  const renderFocusTaskRow = (
    task: Task,
    index: number,
    total: number,
    bucket: 'priority' | 'waiting' = 'priority',
  ) => {
    const project = task.project_id ? projectsMap[task.project_id] : undefined;
    const minutes = getFocusTaskEstimatedMinutes(task, planningMeta[task.id]);
    const preferredTimeLabel = getFocusTaskPreferredTimeLabel(
      task,
      locale,
      planningMeta[task.id],
    );
    const deadline = buildFocusTaskDeadline(task, project, locale, t);
    const progress = task.project_id ? projectProgress[task.project_id] : undefined;
    const onMove = bucket === 'waiting' ? onMoveWaitingTask : onMoveFocusTask;

    return (
      <HoyFocusTaskRow
        key={task.id}
        content={task.content}
        completed={task.is_completed}
        index={index}
        durationLabel={minutes > 0 ? formatFocusTaskDuration(minutes) : null}
        preferredTimeLabel={preferredTimeLabel}
        deadlineLabel={deadline?.label ?? null}
        deadlineUrgent={deadline?.urgent ?? false}
        projectId={task.project_id ?? null}
        projectName={project?.name ?? null}
        projectColor={project?.color ?? THEME.colors.gradient.blue}
        projectPercent={progress?.percent ?? null}
        areaLabel={null}
        isPriority={task.is_priority}
        onToggleComplete={() => onToggleTask(task.id)}
        onOpenDetails={() => onOpenTask(task)}
        onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
        onPostpone={
          onPostponeTask && bucket === 'priority' ? () => onPostponeTask(task.id) : undefined
        }
        onMoveUp={onMove ? () => onMove(task.id, 'up') : undefined}
        onMoveDown={onMove ? () => onMove(task.id, 'down') : undefined}
        canMoveUp={index > 0}
        canMoveDown={index < total - 1}
      />
    );
  };

  const visibleWaitingTasks = useMemo(() => {
    if (!waitingExpanded) return [];
    const source = orderedWaitingTasks ?? [];
    return source.filter((task) => !task.is_completed);
  }, [orderedWaitingTasks, waitingExpanded]);

  const renderTasksByArea = (
    taskList: Task[],
    bucket: 'priority' | 'waiting',
  ) => {
    if (taskList.length === 0) return null;

    const areaGroups = buildHoyPlanAreaGroups(
      taskList,
      projectsMap,
      lifeAreasConfig ?? { labels: {}, custom: [] },
      getDefaultAreaLabel,
      getPresetCustomLabel,
    );

    if (areaGroups.length === 0) return null;

    return (
      <View style={styles.areaGroupList}>
        {areaGroups.map((group) => (
          <HoyPlanAreaBlock key={group.area.ref} area={group.area} stepCount={group.tasks.length}>
            {group.tasks.map((task, index) =>
              renderFocusTaskRow(task, index, group.tasks.length, bucket),
            )}
          </HoyPlanAreaBlock>
        ))}
      </View>
    );
  };

  const prioritiesSlot = (
    <>
      {visibleFocusTasks.length > 0 ? (
        renderTasksByArea(visibleFocusTasks, 'priority')
      ) : focusedProject ? (
        <View style={styles.focusedEmpty}>
          <Text style={styles.focusedEmptyTitle}>
            {t('hoy.focusedProjectEmptyTitle', { name: focusedProject.name })}
          </Text>
          <Text style={styles.focusedEmptyBody}>{t('hoy.focusedProjectEmptyBody')}</Text>
        </View>
      ) : (
        <Text style={styles.emptyInline}>{t('hoy.planPrioritiesSubEmpty')}</Text>
      )}
    </>
  );

  const waitingSlot = (
    <>
      {visibleWaitingTasks.length > 0 ? (
        renderTasksByArea(visibleWaitingTasks, 'waiting')
      ) : (
        <Text style={styles.emptyInline}>{t('hoy.planWaitingSubEmpty')}</Text>
      )}
    </>
  );

  const planFooterSlot =
    !compactLayout && !crisisMode ? (
      <>
        <HoyMoveTasksLink embedded />
        {addTasksButton}
        {!allFocusDone && !hideRhythmStrip ? (
          <HoyGentleRhythmStrip
            crisisMode={crisisMode}
            energyLevel={energyLevel}
            prioritiesDone={priorityStats.done}
            prioritiesTotal={priorityStats.total}
            allFocusDone={allFocusDone}
          />
        ) : null}
      </>
    ) : null;

  const planWaitingSlot = waitingTasksSlot ?? waitingSlot;

  return (
    <View style={styles.root}>
      {crisisMode && onCareModeDismiss && onCareModeLearnMore ? (
        <HoyCrisisBanner
          fullWidth
          onDismiss={onCareModeDismiss}
          onLearnMore={onCareModeLearnMore}
        />
      ) : null}

      {!compactLayout && !crisisMode ? (
        hasCheckIn ? (
          <View style={styles.heroStack}>
            <HoyMoodHeroCard
              emotionEmoji={emotionEmoji}
              emotionLabel={emotionLabel}
              energyLevel={energyLevel}
              focusCount={incompleteFocusTasks.length}
              restCount={restLinkCount}
              coachLine={coachSuggestion}
              allFocusDone={allFocusDone}
              crisisMode={crisisMode}
              onPress={openFeel}
            />
            {isLateNight() ? (
              <HoyNightCompanionCard todayMood={todayMood} energyLevel={energyLevel} />
            ) : null}
          </View>
        ) : (
          <>
            <HoyFeelHero
              hasCheckIn={hasCheckIn}
              emotionEmoji={emotionEmoji}
              emotionLabel={emotionLabel}
              energyLevel={energyLevel}
              onUpdateFeel={openFeel}
            />
            {isLateNight() ? (
              <HoyNightCompanionCard todayMood={todayMood} energyLevel={energyLevel} />
            ) : null}
          </>
        )
      ) : null}

      {!compactLayout ? (
        <HoyDailyPlanCard
          stepCount={incompleteFocusTasks.length}
          waitingCount={restLinkCount}
          crisisMode={crisisMode}
          prioritiesDone={priorityStats.done}
          prioritiesTotal={priorityStats.total}
          allFocusDone={allFocusDone}
          hasCheckIn={hasCheckIn}
          planHeadline={aiPlanHeadline}
          planFromAi={focusFromAi}
          focusedProject={focusedProject}
          onClearFocusedProject={onClearFocusedProject}
          prioritiesSlot={prioritiesSlot}
          prioritiesExpanded={prioritiesExpanded}
          onTogglePriorities={togglePriorities}
          waitingExpanded={waitingExpanded}
          onToggleWaiting={toggleWaiting}
          waitingSlot={planWaitingSlot}
          footerSlot={planFooterSlot}
          capacitySummarySlot={
            hasCheckIn && dayCapacity && dayCapacity.stepCount > 0 ? (
              <>
                <HoyDayCapacitySummary
                  capacity={dayCapacity}
                  energyLevel={energyLevel}
                  onAdjustDay={onAdjustDay}
                />
                {showAfternoonNudge ? <HoyAfternoonNudge /> : null}
              </>
            ) : null
          }
        />
      ) : null}

      {compactLayout ? (
        <>
          {!crisisMode ? (
            <HoyFeelHero
              hasCheckIn={hasCheckIn}
              emotionEmoji={emotionEmoji}
              emotionLabel={emotionLabel}
              energyLevel={energyLevel}
              onUpdateFeel={openFeel}
            />
          ) : null}

          <CalmCard style={styles.focusCard}>
            {allFocusDone ? (
              <Text style={styles.doneInline}>{t('hoy.planPrioritiesSubAllDone')}</Text>
            ) : focusTasks.length > 0 ? (
              <View style={styles.focusBlock}>{prioritiesSlot}</View>
            ) : (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyTitle}>{t('hoy.focusEmptyTitle')}</Text>
                <Text style={styles.emptyBody}>{t('hoy.focusEmptyBody')}</Text>
                {addTasksButton}
              </View>
            )}
          </CalmCard>

          {!crisisMode ? addTasksButton : null}

          {onShowFullView && onRestExpandedChange ? (
            <HoyLitePeekCard
              restCount={nonFocusPending}
              onShowMoreForToday={() => onRestExpandedChange(true)}
              onShowFullView={onShowFullView}
            />
          ) : null}
        </>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.layout.tabSectionGap,
  },
  heroStack: {
    gap: THEME.spacing.xs,
  },
  addTasksBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    ...THEME.shadows.soft,
  },
  addTasksLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  postHeroCluster: {
    gap: THEME.spacing.sm,
    marginTop: -THEME.spacing.xs,
  },
  recheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  recheckIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  recheckTextCol: {
    flex: 1,
    gap: 2,
  },
  recheckQuestion: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  recheckAction: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 20,
  },
  focusHeader: {
    gap: 4,
    marginTop: THEME.spacing.xs,
  },
  sectionTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  sectionSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  focusCard: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  focusBlock: {
    gap: THEME.spacing.sm,
  },
  taskList: {
    gap: THEME.spacing.sm,
    paddingTop: 2,
  },
  areaGroupList: {
    gap: THEME.spacing.md,
    paddingTop: 2,
  },
  rhythmCard: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[100],
    borderColor: THEME.colors.calm.border,
  },
  moreStepsBtn: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  moreStepsText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textDecorationLine: 'underline',
  },
  emptyBlock: {
    gap: THEME.spacing.xs,
  },
  emptyTabHint: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
  },
  emptyBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  emptyTitle: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  doneInline: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  focusedEmpty: {
    gap: 4,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  emptyInline: {
    ...THEME.typography.body,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  focusedEmptyTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  focusedEmptyBody: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  restOfDayLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
  },
  restOfDayLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
