import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { openTipsCategory } from '@/lib/tipsNavigation';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { THEME } from '@/constants/theme';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { HoyFocusTaskRow } from '@/components/hoy/HoyFocusTaskRow';
import { HoyPrimaryFocusCard } from '@/components/hoy/HoyPrimaryFocusCard';
import { HoyFeelHero } from '@/components/hoy/HoyFeelHero';
import { HoyNightCompanionCard } from '@/components/hoy/HoyNightCompanionCard';
import { HoyCrisisBanner } from '@/components/hoy/HoyCrisisBanner';
import { HoyLitePeekCard } from '@/components/hoy/HoyLitePeekCard';
import { HoyDayCapacitySummary } from '@/components/hoy/HoyDayCapacitySummary';
import { HoyAfternoonNudge } from '@/components/hoy/HoyAfternoonNudge';
import { HoyPlanExpandableRow } from '@/components/hoy/HoyPlanExpandableRow';
import { HoyFocusedProjectStrip } from '@/components/hoy/HoyFocusedProjectStrip';
import { HoyFirstDayClose } from '@/components/hoy/HoyFirstDayClose';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CARE_MODE_MAX_FOCUS_STEPS, getCareModeTaskCounts } from '@/lib/hoyCareMode';
import { HOY_DEFAULT_FOCUS_LIMIT } from '@/lib/hoyFocusTasks';
import { useI18n } from '@/contexts/I18nContext';
import { useEllieMiddayPrompt } from '@/hooks/useEllieMiddayPrompt';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';
import type { ProjectProgressMap } from '@/hooks/useHoyFocusTaskMeta';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import type { DayCapacitySnapshot } from '@/lib/hoy/dayCapacity';
import type { FirstDayCloseCue } from '@/lib/firstDayClose';
import { shouldHideHoyPlan } from '@/lib/hoyEllieDailyState';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';
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
  onAdjustDay?: (reason?: WhatChangedReason) => void;
  showAfternoonNudge?: boolean;
  hideRhythmStrip?: boolean;
  /** Día 1: resalta un solo micro-paso sin presión. */
  firstSessionMicroStep?: boolean;
  /** Día 0: cita suave para mañana (valor + motivo para volver). */
  firstDayClose?: FirstDayCloseCue | null;
  /** Si saltó recordatorios, puede activar la cita de mañana desde Hoy. */
  onEnableTomorrowReminder?: () => void;
  userId?: string;
  moodUpdated?: boolean;
  onMoodReplan?: () => void;
  onMoodKeep?: () => void;
};

/**
 * Hoy: 1 hero (sentir o franja) → 1 foco → 1 apoyo (“puede esperar”).
 */
export function HoyFocusPanel({
  locale,
  displayName,
  emotionLabel,
  energyLevel,
  todayMood,
  time: _time,
  focusLevel = '',
  priorityStats: _priorityStats,
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
  firstDayClose = null,
  onEnableTomorrowReminder,
  coachSuggestion,
  userId,
  moodUpdated = false,
  onMoodReplan,
  onMoodKeep,
}: HoyFocusPanelProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [waitingExpanded, setWaitingExpanded] = useState(false);
  const hasCheckIn = Boolean(todayMood);
  const hasTasks = focusTasks.some((task) => !task.is_completed);
  const allFocusDone =
    _priorityStats.total > 0 && _priorityStats.done >= _priorityStats.total;
  const {
    dailyState,
    chooseOkay: chooseMiddayOkay,
    chooseDayChanged: chooseMiddayDayChanged,
    confirmDayChanged,
    chooseMind: chooseMiddayMind,
    acceptAdapt,
    closePlan,
    closeDay,
    dismiss,
    chooseNightUrgent,
    chooseNightNotUrgent,
    onHoyFocus,
    planCloseAccepted,
    step: middayStep,
  } = useEllieMiddayPrompt(
    userId,
    hasCheckIn && !crisisMode,
    hasTasks,
    allFocusDone,
    moodUpdated,
  );
  useFocusEffect(
    useCallback(() => {
      onHoyFocus();
    }, [onHoyFocus]),
  );
  const hideTodayPlan = shouldHideHoyPlan(dailyState, middayStep);
  const hideCaptureEmptyCard = hideTodayPlan;
  const showFirstDayClose =
    Boolean(firstDayClose) &&
    !crisisMode &&
    !(dailyState === 'plan_done' && !planCloseAccepted);
  const coachLine = !hasCheckIn
    ? ''
    : firstSessionMicroStep
      ? t('hoy.firstDayValueCoach')
      : coachSuggestion.trim();

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

  const primaryTask = displayFocusTasks[0] ?? null;

  const addTasksButton = (
    <TouchableOpacity
      style={styles.addTasksBtn}
      onPress={() => openVaciarCapture({ source: 'hoy' })}
      delayPressIn={0}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.planAddTasksCta')}
      accessibilityHint={t('hoy.planAddTasksHint')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

  const showCoach = false;
  const day0Loop = Boolean(firstDayClose);
  const feelHero = !crisisMode ? (
    <HoyFeelHero
      hasCheckIn={hasCheckIn}
      dailyState={dailyState}
      hasTasks={hasTasks}
      hasNightLeftovers={incompleteFocusTasks.length > 0}
      emotionLabel={emotionLabel}
      emotionKey={todayMood}
      energyLevel={energyLevel}
      focusLevel={focusLevel}
      displayName={displayName}
      middayStep={middayStep}
      onUpdateFeel={openFeel}
      onMiddayOkay={chooseMiddayOkay}
      onMiddayDayChanged={() => {
        chooseMiddayDayChanged();
        openFeel();
      }}
      onMiddayChangedConfirm={(reason) => {
        confirmDayChanged(() => onAdjustDay?.(reason));
      }}
      onMiddayMind={() => {
        chooseMiddayMind(() => openVaciarCapture({ source: 'hoy' }));
      }}
      onReturnAccept={dismiss}
      onReturnEdit={() => {
        dismiss();
        onAdjustDay?.();
      }}
      onAdaptLooksGood={acceptAdapt}
      onAdaptEdit={() => {
        acceptAdapt();
        onAdjustDay?.();
      }}
      onFreeRest={() => {
        acceptAdapt();
        openTipsCategory(router, 'rest', {
          emotion: todayMood,
          energyLevel,
        });
      }}
      onFreeEmpty={() => {
        acceptAdapt();
        openVaciarCapture({ source: 'hoy' });
      }}
      onFreeExplore={() => {
        acceptAdapt();
        openTipsCategory(router, 'mindset', {
          emotion: todayMood,
          energyLevel,
        });
      }}
      planCloseAccepted={planCloseAccepted}
      onPlanDoneEmpty={() => {
        openVaciarCapture({ source: 'hoy' });
      }}
      onPlanDoneRest={() => {
        openTipsCategory(router, 'rest', {
          emotion: todayMood,
          energyLevel,
        });
      }}
      onPlanDoneSeeYou={closePlan}
      onMoodReplan={onMoodReplan}
      onMoodKeep={onMoodKeep}
      onNightUrgent={chooseNightUrgent}
      onNightNotUrgent={chooseNightNotUrgent}
      onNightDone={closeDay}
      onNightSeeLeft={dismiss}
    />
  ) : null;

  /** Sin check-in: solo Ellie. Tareas vive en la tab; nada de plan / 1→2→3 / empty card. */
  if (!hasCheckIn && !crisisMode) {
    return <View style={styles.root}>{feelHero}</View>;
  }

  const focusBlock = primaryTask ? (
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
  ) : hideCaptureEmptyCard ? null : (
    <CalmCard style={styles.doneCard}>
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
          {showCoach ? (
            <Text style={styles.coachLine} accessibilityRole="text">
              {coachLine}
            </Text>
          ) : null}
          {dailyState === 'day_closed' ? (
            <HoyNightCompanionCard todayMood={todayMood} energyLevel={energyLevel} />
          ) : null}

          {focusedProject && onClearFocusedProject ? (
            <HoyFocusedProjectStrip
              project={focusedProject}
              onClearFocus={onClearFocusedProject}
            />
          ) : null}

          {!day0Loop && hasCheckIn && dayCapacity?.isOverloaded ? (
            <HoyDayCapacitySummary
              capacity={dayCapacity}
              energyLevel={energyLevel}
              onAdjustDay={onAdjustDay}
            />
          ) : null}

          {!hideTodayPlan ? (
            <View style={styles.planCluster}>
              {showAfternoonNudge && !dayCapacity?.isOverloaded ? <HoyAfternoonNudge /> : null}
              {focusBlock}
            </View>
          ) : null}

          {showFirstDayClose && firstDayClose ? (
            <HoyFirstDayClose
              cue={firstDayClose}
              allDone={allFocusDone}
              onEnableReminder={onEnableTomorrowReminder}
            />
          ) : null}

          {!hideTodayPlan && restLinkCount > 0 ? (
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

          {!day0Loop && !crisisMode && !hideTodayPlan && primaryTask ? (
            <TouchableOpacity
              style={styles.addTasksBtn}
              onPress={() => openVaciarCapture({ source: 'hoy' })}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.planAddTasksCta')}
              accessibilityHint={t('hoy.planAddTasksHint')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.addTasksLabel}>{t('hoy.planAddTasksCta')}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <>
          {feelHero}
          {showCoach ? (
            <Text style={styles.coachLine} accessibilityRole="text">
              {coachLine}
            </Text>
          ) : null}

          {!hideTodayPlan && primaryTask ? (
            <HoyPrimaryFocusCard
              content={primaryTask.content}
              completed={primaryTask.is_completed}
              metaLabel={primaryMeta}
              firstSessionNudge={firstSessionMicroStep}
              onToggleComplete={() => onToggleTask(primaryTask.id)}
              onOpenDetails={() => onOpenTask(primaryTask)}
            />
          ) : !hideTodayPlan && hideCaptureEmptyCard ? null : !hideTodayPlan ? (
            <CalmCard style={styles.focusCard}>
              {addTasksButton}
            </CalmCard>
          ) : null}

          {!day0Loop && !crisisMode && !hideTodayPlan && primaryTask ? addTasksButton : null}

          {showFirstDayClose && firstDayClose ? (
            <HoyFirstDayClose
              cue={firstDayClose}
              allDone={allFocusDone}
              onEnableReminder={onEnableTomorrowReminder}
            />
          ) : null}

          {!hideTodayPlan && restLinkCount > 0 ? (
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

          {!day0Loop && onShowFullView && onRestExpandedChange ? (
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
    gap: THEME.layout.sectionGapCompact,
  },
  planCluster: {
    gap: THEME.spacing.xs,
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
