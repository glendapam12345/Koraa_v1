import { View, StyleSheet } from 'react-native';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { THEME } from '@/constants/theme';
import { HoyFocusPanel } from '@/components/hoy/HoyFocusPanel';
import { HoyRestOfDayPanel } from '@/components/hoy/HoyRestOfDayPanel';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { getHoyPriorityPlanTasks, getHoyWaitingPlanTasks } from '@/lib/hoyFocusTasks';
import { useHoyPlanTaskActions } from '@/hooks/useHoyPlanTaskActions';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';
import { useHoyDayReflection } from '@/hooks/useHoyDayReflection';
import { useHoyFocusTaskMeta } from '@/hooks/useHoyFocusTaskMeta';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { HoyDayReflectionFlow } from '@/components/vnext/HoyDayReflectionFlow';

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
  onShowMoreForToday?: () => void;
  onDeleteTask?: (task: Task) => void;
  onChangeEmotion?: () => void;
  crisisMode?: boolean;
  onCareModeDismiss?: () => void;
  onCareModeLearnMore?: () => void;
  onTasksReload?: (options?: { silent?: boolean }) => void | Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  focusedProject?: FocusedProjectInfo | null;
  onClearFocusedProject?: () => void;
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
  onShowMoreForToday,
  onDeleteTask,
  onChangeEmotion,
  crisisMode = false,
  onCareModeDismiss,
  onCareModeLearnMore,
  onTasksReload,
  showToast,
  setTasks,
  focusedProject = null,
  onClearFocusedProject,
}: HoyTasksSectionProps) {
  const { locale, t } = useI18n();
  const { config: lifeAreasConfig } = useUserLifeAreas(user?.id);

  const priorityPlanTasks = useMemo(
    () => getHoyPriorityPlanTasks(tasks, undefined, focusedProject?.id),
    [tasks, focusedProject?.id],
  );

  const waitingPlanTasks = useMemo(
    () => getHoyWaitingPlanTasks(tasks, undefined, focusedProject?.id),
    [tasks, focusedProject?.id],
  );

  const { orderedPriorityTasks, orderedWaitingTasks, handlePostpone, handleMove } =
    useHoyPlanTaskActions({
      priorityTasks: priorityPlanTasks,
      waitingTasks: waitingPlanTasks,
      setTasks,
      showToast: showToast ?? (() => {}),
      onTasksReload,
      postponeSuccessMessage: t('hoy.postponeStepSuccess'),
      promoteSuccessMessage: t('hoy.planPromoteSuccess'),
      demoteSuccessMessage: t('hoy.planDemoteSuccess'),
    });

  const { planningMeta, projectProgress } = useHoyFocusTaskMeta(tasks);

  const totalIncompleteCount = useMemo(
    () => tasks.filter((task) => !task.is_completed && !task.parent_task_id).length,
    [tasks],
  );

  const reflection = useHoyDayReflection({
    userId: user?.id,
    hasCheckIn: Boolean(todayMood),
    priorityStats: todayPriorityStats,
    incompleteCount: totalIncompleteCount,
    onTasksReload: onTasksReload ?? (async () => {}),
    showToast: showToast ?? (() => {}),
  });

  const waitingTasks = useMemo(
    () => waitingPlanTasks.filter((task) => !task.is_completed),
    [waitingPlanTasks],
  );

  const restOfDayTasks = waitingTasks;

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
        waitingCount={waitingTasks.length}
        waitingTasksSlot={null}
        onCareModeDismiss={onCareModeDismiss}
        onCareModeLearnMore={onCareModeLearnMore}
        focusedProject={focusedProject}
        onClearFocusedProject={onClearFocusedProject}
        lifeAreasConfig={lifeAreasConfig}
      />

      {!compactLayout && !crisisMode ? (
        <HoyDayReflectionFlow
          flowOpen={reflection.flowOpen}
          step={reflection.step}
          displayName={displayName}
          selectedReason={reflection.selectedReason}
          previewProposal={reflection.previewProposal}
          buildingPreview={reflection.buildingPreview}
          applying={reflection.applying}
          onClose={reflection.closeReflection}
          onSelectReason={reflection.handleSelectReason}
          onBackToReason={reflection.handleBackToReason}
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
