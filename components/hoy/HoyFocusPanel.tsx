import { useMemo, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { THEME } from '@/constants/theme';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { HoyFocusTaskRow } from '@/components/hoy/HoyFocusTaskRow';
import { HoyPrimaryFocusCard } from '@/components/hoy/HoyPrimaryFocusCard';
import { HoyFeelHero } from '@/components/hoy/HoyFeelHero';
import { HoyBreathNudge } from '@/components/hoy/HoyBreathNudge';
import { HoyNightCompanionCard } from '@/components/hoy/HoyNightCompanionCard';
import { HoyCrisisBanner } from '@/components/hoy/HoyCrisisBanner';
import { HoyLitePeekCard } from '@/components/hoy/HoyLitePeekCard';
import { HoyDayCapacitySummary } from '@/components/hoy/HoyDayCapacitySummary';
import { HoyAfternoonNudge } from '@/components/hoy/HoyAfternoonNudge';
import { HoyPlanExpandableRow } from '@/components/hoy/HoyPlanExpandableRow';
import { HoyFocusedProjectStrip } from '@/components/hoy/HoyFocusedProjectStrip';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { getEmotionEmoji } from '@/lib/emotionEmoji';
import { isLateNight } from '@/lib/timeOfDayContext';
import { CARE_MODE_MAX_FOCUS_STEPS, getCareModeTaskCounts } from '@/lib/hoyCareMode';
import { HOY_DEFAULT_FOCUS_LIMIT } from '@/lib/hoyFocusTasks';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';
import type { ProjectProgressMap } from '@/hooks/useHoyFocusTaskMeta';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import type { DayCapacitySnapshot } from '@/lib/hoy/dayCapacity';
import {
  formatFocusTaskDuration,
  getFocusTaskEstimatedMinutes,
  getFocusTaskPreferredTimeLabel,
  type HoyProjectInfo,
} from '@/lib/hoy/focusTaskDisplay';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';

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
  compactLayout?: boolean;
  onShowFullView?: () => void;
  crisisMode?: boolean;
  waitingTasksSlot?: ReactNode;
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
  /** Día 1: resalta un solo micro-paso sin presión. */
  firstSessionMicroStep?: boolean;
};

/**
 * Hoy: 1 hero (sentir o franja) → 1 foco → 1 apoyo (“puede esperar”).
 */
export function HoyFocusPanel({
  locale,
  emotionLabel,
  energyLevel,
  todayMood,
  priorityStats,
  focusTasks,
  totalPending,
  planningMeta,
  onToggleTask,
  onOpenTask,
  orderedFocusTasks,
  orderedWaitingTasks,
  onRestExpandedChange,
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
  dayCapacity = null,
  onAdjustDay,
  showAfternoonNudge = false,
  firstSessionMicroStep = false,
  coachSuggestion,
}: HoyFocusPanelProps) {
  const { t } = useI18n();
  const [waitingExpanded, setWaitingExpanded] = useState(false);
  const coachLine = coachSuggestion.trim();

  const emotionEmoji = getEmotionEmoji(todayMood);
  const incompleteFocusTasks = useMemo(() => {
    const source = orderedFocusTasks ?? focusTasks.filter((task) => !task.is_completed);
    return source.filter((task) => !task.is_completed);
  }, [focusTasks, orderedFocusTasks]);

  const displayFocusTasks = useMemo(() => {
    const source = (orderedFocusTasks ?? focusTasks).filter((task) => !task.is_completed);
    const limit = crisisMode ? CARE_MODE_MAX_FOCUS_STEPS : HOY_DEFAULT_FOCUS_LIMIT;
    return source.slice(0, limit);
  }, [crisisMode, focusTasks, orderedFocusTasks]);

  const overflowFocusTasks = useMemo(() => {
    if (crisisMode) return [];
    const source = (orderedFocusTasks ?? focusTasks).filter((task) => !task.is_completed);
    return source.slice(HOY_DEFAULT_FOCUS_LIMIT);
  }, [crisisMode, focusTasks, orderedFocusTasks]);

  const nonFocusPending = Math.max(0, totalPending - incompleteFocusTasks.length);
  const allFocusDone =
    priorityStats.total > 0 && priorityStats.done >= priorityStats.total;

  const primaryTask = displayFocusTasks[0] ?? null;

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

  const careCounts = crisisMode
    ? getCareModeTaskCounts(incompleteFocusTasks.length, nonFocusPending)
    : null;

  const mergedWaitingTasks = useMemo(() => {
    const base = (orderedWaitingTasks ?? []).filter((task) => !task.is_completed);
    return [...overflowFocusTasks, ...base];
  }, [orderedWaitingTasks, overflowFocusTasks]);

  const restLinkCount =
    waitingCount != null
      ? waitingCount + overflowFocusTasks.length
      : careCounts?.waitingCount ?? mergedWaitingTasks.length;

  const toggleWaiting = () => {
    setWaitingExpanded((open) => !open);
  };

  const renderFocusTaskRow = (task: Task, index: number) => {
    const minutes = getFocusTaskEstimatedMinutes(task, planningMeta[task.id]);
    const preferredTimeLabel = getFocusTaskPreferredTimeLabel(
      task,
      locale,
      planningMeta[task.id],
    );

    return (
      <HoyFocusTaskRow
        key={task.id}
        content={task.content}
        completed={task.is_completed}
        index={index}
        durationLabel={minutes > 0 ? formatFocusTaskDuration(minutes) : null}
        preferredTimeLabel={preferredTimeLabel}
        onToggleComplete={() => onToggleTask(task.id)}
        onOpenDetails={() => onOpenTask(task)}
      />
    );
  };

  const primaryMeta = primaryTask
    ? (() => {
        const minutes = getFocusTaskEstimatedMinutes(primaryTask, planningMeta[primaryTask.id]);
        const preferred = getFocusTaskPreferredTimeLabel(
          primaryTask,
          locale,
          planningMeta[primaryTask.id],
        );
        if (preferred && minutes > 0) {
          return `${preferred} · ${formatFocusTaskDuration(minutes)}`;
        }
        return preferred || (minutes > 0 ? formatFocusTaskDuration(minutes) : null);
      })()
    : null;

  const visibleWaitingTasks = waitingExpanded ? mergedWaitingTasks : [];

  const waitingSlot = waitingTasksSlot ?? (
    <>
      {visibleWaitingTasks.length > 0 ? (
        <View style={styles.taskList}>
          {visibleWaitingTasks.map((task, index) => renderFocusTaskRow(task, index))}
        </View>
      ) : (
        <Text style={styles.emptyInline}>{t('hoy.planWaitingSubEmpty')}</Text>
      )}
    </>
  );

  const waitingSubtitle = waitingExpanded
    ? t('hoy.planWaitingSubOpen')
    : t('hoy.planWaitingSub', { count: restLinkCount });

  const feelHero = !crisisMode ? (
    <HoyFeelHero
      hasCheckIn={hasCheckIn}
      emotionEmoji={emotionEmoji}
      emotionLabel={emotionLabel}
      energyLevel={energyLevel}
      onUpdateFeel={openFeel}
    />
  ) : null;

  const focusBlock = allFocusDone ? (
    <CalmCard style={styles.doneCard}>
      <Text style={styles.doneInline}>{t('hoy.planPrioritiesSubAllDone')}</Text>
    </CalmCard>
  ) : primaryTask ? (
    <HoyPrimaryFocusCard
      content={primaryTask.content}
      completed={primaryTask.is_completed}
      metaLabel={primaryMeta}
      firstSessionNudge={firstSessionMicroStep}
      onToggleComplete={() => onToggleTask(primaryTask.id)}
      onOpenDetails={() => onOpenTask(primaryTask)}
    />
  ) : focusedProject ? (
    <CalmCard style={styles.doneCard}>
      <Text style={styles.focusedEmptyTitle}>
        {t('hoy.focusedProjectEmptyTitle', { name: focusedProject.name })}
      </Text>
      <Text style={styles.focusedEmptyBody}>{t('hoy.focusedProjectEmptyBody')}</Text>
    </CalmCard>
  ) : (
    <CalmCard style={styles.doneCard}>
      <Text style={styles.emptyTitle}>
        {firstSessionMicroStep || compactLayout
          ? t('hoy.firstSessionEmptyTitle')
          : t('hoy.focusEmptyTitle')}
      </Text>
      <Text style={styles.emptyBody}>
        {firstSessionMicroStep || compactLayout
          ? t('hoy.firstSessionEmptyBody')
          : t('hoy.focusEmptyBody')}
      </Text>
      {addTasksButton}
    </CalmCard>
  );

  return (
    <View style={styles.root}>
      {crisisMode && onCareModeDismiss && onCareModeLearnMore ? (
        <HoyCrisisBanner
          fullWidth
          onDismiss={onCareModeDismiss}
          onLearnMore={onCareModeLearnMore}
        />
      ) : null}

      {!compactLayout ? (
        <>
          {feelHero}
          {coachLine ? (
            <Text style={styles.coachLine} accessibilityRole="text">
              {coachLine}
            </Text>
          ) : null}
          {isLateNight() ? (
            <HoyNightCompanionCard todayMood={todayMood} energyLevel={energyLevel} />
          ) : null}

          {focusedProject && onClearFocusedProject ? (
            <HoyFocusedProjectStrip
              project={focusedProject}
              onClearFocus={onClearFocusedProject}
            />
          ) : null}

          {(hasCheckIn && dayCapacity?.isOverloaded) ||
          (showAfternoonNudge && !dayCapacity?.isOverloaded) ? (
            <View style={styles.capacityCluster}>
              {hasCheckIn && dayCapacity?.isOverloaded ? (
                <HoyDayCapacitySummary
                  capacity={dayCapacity}
                  energyLevel={energyLevel}
                  onAdjustDay={onAdjustDay}
                />
              ) : null}
              {showAfternoonNudge && !dayCapacity?.isOverloaded ? <HoyAfternoonNudge /> : null}
            </View>
          ) : null}

          {focusBlock}

          {restLinkCount > 0 ? (
            <CalmCard variant="soft" style={styles.waitingCard}>
              <HoyPlanExpandableRow
                variant="muted"
                compact
                title={t('hoy.planWaitingTitle')}
                subtitle={waitingSubtitle}
                expanded={waitingExpanded}
                onToggle={toggleWaiting}
                accessibilityLabel={t('hoy.planWaitingA11y', { count: restLinkCount })}
              >
                {waitingSlot}
              </HoyPlanExpandableRow>
            </CalmCard>
          ) : null}

          {!crisisMode && primaryTask ? (
            <TouchableOpacity
              style={styles.addTasksSoft}
              onPress={() => openVaciarCapture()}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.planAddTasksCta')}
            >
              <Text style={styles.addTasksSoftLabel}>{t('hoy.planAddTasksCta')}</Text>
            </TouchableOpacity>
          ) : null}

          {!crisisMode && hasCheckIn && energyLevel > 0 && energyLevel <= 2 ? (
            <HoyBreathNudge />
          ) : null}
        </>
      ) : (
        <>
          {feelHero}
          {coachLine ? (
            <Text style={styles.coachLine} accessibilityRole="text">
              {coachLine}
            </Text>
          ) : null}

          {allFocusDone ? (
            <CalmCard style={styles.focusCard}>
              <Text style={styles.doneInline}>{t('hoy.planPrioritiesSubAllDone')}</Text>
            </CalmCard>
          ) : primaryTask ? (
            <HoyPrimaryFocusCard
              content={primaryTask.content}
              completed={primaryTask.is_completed}
              metaLabel={primaryMeta}
              firstSessionNudge={firstSessionMicroStep}
              onToggleComplete={() => onToggleTask(primaryTask.id)}
              onOpenDetails={() => onOpenTask(primaryTask)}
            />
          ) : (
            <CalmCard style={styles.focusCard}>
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyTitle}>{t('hoy.firstSessionEmptyTitle')}</Text>
                <Text style={styles.emptyBody}>{t('hoy.firstSessionEmptyBody')}</Text>
                {addTasksButton}
              </View>
            </CalmCard>
          )}

          {!crisisMode && primaryTask ? addTasksButton : null}

          {onShowFullView && onRestExpandedChange ? (
            <HoyLitePeekCard
              restCount={nonFocusPending}
              onShowMoreForToday={() => onRestExpandedChange(true)}
              onShowFullView={onShowFullView}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.layout.sectionGap,
  },
  capacityCluster: {
    gap: THEME.spacing.sm,
  },
  coachLine: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.accent.italic,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  waitingCard: {
    padding: THEME.spacing.sm,
  },
  doneCard: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
  },
  addTasksBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  addTasksLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  addTasksSoft: {
    alignSelf: 'flex-start',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  addTasksSoftLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 22,
  },
  focusCard: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  planSectionTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  taskList: {
    gap: 0,
  },
  emptyBlock: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
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
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
    paddingVertical: THEME.spacing.sm,
  },
  emptyInline: {
    ...THEME.typography.body,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 22,
    paddingVertical: THEME.spacing.md,
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
});
