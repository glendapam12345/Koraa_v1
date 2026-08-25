import { View, StyleSheet } from 'react-native';
import { useMemo, useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { HoyFocusPanel } from '@/components/hoy/HoyFocusPanel';
import { HoyRestOfDayPanel } from '@/components/hoy/HoyRestOfDayPanel';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { orderTasksByFocusIds } from '@/lib/hoy/orderTasksByFocusIds';
import { getHoyPriorityPlanTasks, getHoyWaitingPlanTasks } from '@/lib/hoyFocusTasks';
import { useHoyPlanTaskActions } from '@/hooks/useHoyPlanTaskActions';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';
import type { FirstDayCloseCue } from '@/lib/firstDayClose';
import type { ReturnMemory } from '@/lib/returnMemory';
import { useHoyDayReflection } from '@/hooks/useHoyDayReflection';
import { useHoyFocusTaskMeta } from '@/hooks/useHoyFocusTaskMeta';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { HoyDayReflectionFlow } from '@/components/vnext/HoyDayReflectionFlow';
import { HoyDayReflectionCard } from '@/components/hoy/HoyDayReflectionCard';
import { KoraaDailyTipsSection } from '@/components/koraa/KoraaDailyTipsSection';
import { buildDayCapacitySnapshot } from '@/lib/hoy/dayCapacity';
import { shouldShowAfternoonNudge } from '@/lib/hoy/proactivePlanSignals';
import {
  peekRecheckReplanNudge,
  dismissRecheckReplanNudge,
  type RecheckReplanNudge,
} from '@/lib/recheckReplanNudge';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';
import { resolveTipsByIds } from '@/lib/ai/resolveBriefTips';
import { openTipsCategory } from '@/lib/tipsNavigation';
import type { TipCategoryId } from '@/lib/tipsTypes';
import type { PatternHoyApplyMode } from '@/lib/behaviorInsights';
import { applyPatternHoyToPlanTasks } from '@/lib/applyPatternHoyMode';

export type HoyTasksSectionProps = {
  todayMood: string;
  todayEmotionLabel: string;
  energyLevel: number;
  time: string;
  focusLevel: string;
  todayPriorityStats: FocusProgressStats;
  /** Primer día en Hoy sin módulos secundarios expandidos. */
  compactLayout?: boolean;
  onShowFullView?: () => void;
  user: { id: string } | null;
  tasks: Task[];
  incompleteTasksForToday: Task[];
  projectsMap: Record<string, { name: string; color?: string; due_date?: string | null }>;
  expandedTasks: Set<string>;
  expandedDetailsTasks: Set<string>;
  menuOpen: string | null;
  onMenuPress: (taskId: string) => void;
  handleToggleTask: (taskId: string, isSubtask?: boolean, parentTaskId?: string) => void | Promise<void>;
  toggleTaskExpansion: (taskId: string) => void;
  toggleDetailsExpansion: (taskId: string) => void;
  handleEditTask: (task: Task) => void;
  handleDeleteTask: (task: Task) => void;
  toggleTask: (taskId: string, isSubtask: boolean, parentTaskId?: string) => void;
  getCategoryColor: (category: string) => string;
  restOfDayExpanded?: boolean;
  onCollapseRestOfDay?: () => void;
  displayName?: string;
  coachSuggestion?: string;
  /** Modo activo desde Para mí → reordena el plan de Hoy. */
  patternHoyMode?: PatternHoyApplyMode | null;
  dailyTipIds?: string[];
  dailyTipLead?: string;
  dailyTipsFromAi?: boolean;
  aiFocusTaskIds?: string[];
  aiPlanHeadline?: string;
  focusFromAi?: boolean;
  onShowMoreForToday?: () => void;
  onDeleteTask?: (task: Task) => void;
  onChangeEmotion?: () => void;
  crisisMode?: boolean;
  onCareModeDismiss?: () => void;
  onCareModeLearnMore?: () => void;
  onTasksReload?: (options?: { silent?: boolean }) => void | Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  /** Pasos recién guardados desde Tareas — van al frente del plan de Hoy. */
  pinnedHoyTaskIds?: string[];
  focusedProject?: FocusedProjectInfo | null;
  onClearFocusedProject?: () => void;
  firstSessionMicroStep?: boolean;
  firstDayClose?: FirstDayCloseCue | null;
  onEnableTomorrowReminder?: () => void;
  returnMemory?: ReturnMemory | null;
};

export function HoyTasksSection({
  todayMood,
  todayEmotionLabel,
  energyLevel,
  time,
  focusLevel,
  todayPriorityStats,
  compactLayout = false,
  onShowFullView,
  user,
  tasks,
  incompleteTasksForToday,
  projectsMap,
  expandedTasks,
  expandedDetailsTasks,
  menuOpen,
  onMenuPress,
  handleToggleTask,
  toggleTaskExpansion,
  toggleDetailsExpansion,
  handleEditTask,
  handleDeleteTask,
  toggleTask,
  getCategoryColor,
  restOfDayExpanded = false,
  onCollapseRestOfDay,
  displayName = '',
  coachSuggestion = '',
  patternHoyMode = null,
  dailyTipIds = [],
  dailyTipLead = '',
  dailyTipsFromAi = false,
  aiFocusTaskIds = [],
  aiPlanHeadline = '',
  focusFromAi = false,
  onShowMoreForToday,
  onDeleteTask,
  onChangeEmotion,
  crisisMode = false,
  onCareModeDismiss,
  onCareModeLearnMore,
  onTasksReload,
  showToast,
  setTasks,
  pinnedHoyTaskIds = [],
  focusedProject = null,
  onClearFocusedProject,
  firstSessionMicroStep = false,
  firstDayClose = null,
  onEnableTomorrowReminder,
}: HoyTasksSectionProps) {
  const { locale, t } = useI18n();
  const { config: lifeAreasConfig } = useUserLifeAreas(user?.id);
  const [recheckNudge, setRecheckNudge] = useState<RecheckReplanNudge | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        setRecheckNudge(null);
        return;
      }
      let cancelled = false;
      void (async () => {
        const nudge = await peekRecheckReplanNudge(user.id);
        if (!cancelled) setRecheckNudge(nudge);
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  useEffect(() => {
    if (!user?.id) return;
    return subscribeCheckInRefresh(() => {
      void peekRecheckReplanNudge(user.id).then(setRecheckNudge);
    });
  }, [user?.id]);

  const dismissRecheckNudge = useCallback(() => {
    if (user?.id) void dismissRecheckReplanNudge(user.id);
    setRecheckNudge(null);
  }, [user?.id]);

  const { priorityPlanTasks, waitingPlanTasks } = useMemo(() => {
    const base = getHoyPriorityPlanTasks(tasks, undefined, focusedProject?.id);
    const ordered = orderTasksByFocusIds(base, [...pinnedHoyTaskIds, ...aiFocusTaskIds]);
    const waitingBase = getHoyWaitingPlanTasks(tasks, undefined, focusedProject?.id);
    if (!patternHoyMode) {
      return { priorityPlanTasks: ordered, waitingPlanTasks: waitingBase };
    }
    const applied = applyPatternHoyToPlanTasks(ordered, waitingBase, patternHoyMode);
    return {
      priorityPlanTasks: applied.priorityTasks,
      waitingPlanTasks: applied.waitingTasks,
    };
  }, [tasks, focusedProject?.id, aiFocusTaskIds, patternHoyMode, pinnedHoyTaskIds]);

  const { orderedPriorityTasks, orderedWaitingTasks, handlePostpone, handleMove } =
    useHoyPlanTaskActions({
      priorityTasks: priorityPlanTasks,
      waitingTasks: waitingPlanTasks,
      prependTaskIds: pinnedHoyTaskIds,
      setTasks,
      showToast: showToast ?? (() => {}),
      onTasksReload,
      postponeSuccessMessage: t('hoy.postponeStepSuccess'),
      promoteSuccessMessage: t('hoy.planPromoteSuccess'),
      demoteSuccessMessage: t('hoy.planDemoteSuccess'),
    });

  const { planningMeta, projectProgress } = useHoyFocusTaskMeta(tasks);

  const dayCapacity = useMemo(
    () =>
      buildDayCapacitySnapshot({
        planTasks: orderedPriorityTasks,
        planningMeta,
        availableTime: time,
        energyLevel,
      }),
    [energyLevel, orderedPriorityTasks, planningMeta, time],
  );

  const totalIncompleteCount = useMemo(
    () => tasks.filter((task) => !task.is_completed && !task.parent_task_id).length,
    [tasks],
  );

  const reflection = useHoyDayReflection({
    userId: user?.id,
    hasCheckIn: Boolean(todayMood),
    priorityStats: todayPriorityStats,
    incompleteCount: totalIncompleteCount,
    isOverloaded: dayCapacity.isOverloaded,
    energyLevel,
    onTasksReload: onTasksReload ?? (async () => {}),
    showToast: showToast ?? (() => {}),
  });

  const allFocusDone =
    todayPriorityStats.total > 0 && todayPriorityStats.done >= todayPriorityStats.total;

  const showAfternoonNudge = shouldShowAfternoonNudge({
    hasCheckIn: Boolean(todayMood),
    crisisMode,
    compactLayout,
    allFocusDone,
    priorityStats: todayPriorityStats,
  });

  const waitingTasks = useMemo(
    () => waitingPlanTasks.filter((task) => !task.is_completed),
    [waitingPlanTasks],
  );

  const restOfDayTasks = waitingTasks;

  const tipsContext = useMemo(
    () => ({
      emotion: todayMood.toLowerCase() || 'tranquila',
      energyLevel,
    }),
    [todayMood, energyLevel],
  );

  const dailyTips = useMemo(
    () => resolveTipsByIds(dailyTipIds, locale),
    [dailyTipIds, locale],
  );

  // Consejos destacados viven en Para mí — Hoy se queda en plan + check-in.
  const showDailyTips = false;
  const hasHoySteps = orderedPriorityTasks.some((task) => !task.is_completed);

  return (
    <View style={styles.root}>
      <HoyFocusPanel
        locale={locale}
        displayName={displayName}
        todayMood={todayMood}
        emotionLabel={todayEmotionLabel}
        energyLevel={energyLevel}
        time={time}
        focusLevel={focusLevel}
        coachSuggestion={coachSuggestion}
        aiPlanHeadline={aiPlanHeadline}
        focusFromAi={focusFromAi}
        priorityStats={todayPriorityStats}
        focusTasks={priorityPlanTasks}
        orderedFocusTasks={orderedPriorityTasks}
        orderedWaitingTasks={orderedWaitingTasks}
        totalPending={incompleteTasksForToday.length}
        projectsMap={projectsMap}
        projectProgress={projectProgress}
        planningMeta={planningMeta}
        onToggleTask={(taskId) => void handleToggleTask(taskId)}
        onOpenTask={handleEditTask}
        onPostponeTask={(taskId) => void handlePostpone(taskId)}
        onMoveFocusTask={(taskId, direction) => void handleMove(taskId, direction, 'priority')}
        onMoveWaitingTask={(taskId, direction) => void handleMove(taskId, direction, 'waiting')}
        restExpanded={restOfDayExpanded}
        onRestExpandedChange={(open) => {
          if (open) {
            onShowMoreForToday?.();
          } else {
            onCollapseRestOfDay?.();
          }
        }}
        onDeleteTask={onDeleteTask}
        onChangeEmotion={onChangeEmotion}
        compactLayout={compactLayout}
        onShowFullView={onShowFullView}
        crisisMode={crisisMode}
        firstSessionMicroStep={firstSessionMicroStep}
        firstDayClose={firstDayClose}
        onEnableTomorrowReminder={onEnableTomorrowReminder}
        waitingCount={waitingTasks.length}
        waitingTasksSlot={null}
        onCareModeDismiss={onCareModeDismiss}
        onCareModeLearnMore={onCareModeLearnMore}
        focusedProject={focusedProject}
        onClearFocusedProject={onClearFocusedProject}
        lifeAreasConfig={lifeAreasConfig}
        dayCapacity={dayCapacity}
        onAdjustDay={reflection.openReflection}
        showAfternoonNudge={showAfternoonNudge}
        hideRhythmStrip
        userId={user?.id}
        moodUpdated={Boolean(recheckNudge) && hasHoySteps}
        onMoodReplan={() => {
          dismissRecheckNudge();
          reflection.openReflection();
        }}
        onMoodKeep={dismissRecheckNudge}
      />

      {showDailyTips ? (
        <KoraaDailyTipsSection
          tips={dailyTips}
          tipLead={dailyTipLead}
          fromAi={dailyTipsFromAi}
          onOpenTip={(tip) =>
            openTipsCategory(router, tip.category as TipCategoryId, tipsContext, tip.id)
          }
        />
      ) : null}

      {!compactLayout && !crisisMode && reflection.shouldShowCard && allFocusDone ? (
        <HoyDayReflectionCard
          onPress={reflection.openReflection}
          variant={reflection.reflectionVariant}
        />
      ) : null}

      {!crisisMode ? (
        <HoyDayReflectionFlow
          flowOpen={reflection.flowOpen}
          step={reflection.step}
          displayName={displayName}
          selectedReason={reflection.selectedReason}
          previewProposal={reflection.previewProposal}
          pendingAssignments={reflection.pendingAssignments}
          buildingPreview={reflection.buildingPreview}
          applying={reflection.applying}
          capacity={dayCapacity}
          planningMeta={planningMeta}
          onClose={reflection.closeReflection}
          onSelectReason={reflection.handleSelectReason}
          onBackToReason={reflection.handleBackToReason}
          onChangeTaskDate={reflection.handleChangeTaskDate}
          onConfirm={() => void reflection.handleConfirm()}
        />
      ) : null}

      {compactLayout && restOfDayExpanded && onCollapseRestOfDay ? (
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

const styles = StyleSheet.create({
  root: {
    gap: THEME.layout.tabSectionGap,
  },
});
