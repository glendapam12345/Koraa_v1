import { View, StyleSheet, Alert } from 'react-native';
import { useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { HoyFocusPanel } from '@/components/hoy/HoyFocusPanel';
import { HoyFocusTaskRow } from '@/components/hoy/HoyFocusTaskRow';
import { HoyRestOfDayPanel } from '@/components/hoy/HoyRestOfDayPanel';
import { useI18n } from '@/contexts/I18nContext';
import { useAppleHealthConnection } from '@/hooks/useAppleHealthConnection';
import type { Task } from '@/components/tasks/TaskCard';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { getHoyFocusTasks } from '@/lib/hoyFocusTasks';
import { buildHoyAttentionPlan } from '@/lib/hoyAttentionPlan';
import { useHoyDayReflection } from '@/hooks/useHoyDayReflection';
import { useHoyFocusTaskMeta } from '@/hooks/useHoyFocusTaskMeta';
import { HoyDayReflectionFlow } from '@/components/vnext/HoyDayReflectionFlow';
import { HoyDayReflectionCard } from '@/components/vnext/HoyDayReflectionCard';
import {
  buildFocusTaskDeadline,
  formatFocusTaskDuration,
  getFocusTaskEstimatedMinutes,
  resolveFocusTaskAreaLabel,
} from '@/lib/hoy/focusTaskDisplay';

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
  onTasksReload?: () => void | Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
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
}: HoyTasksSectionProps) {
  const { locale, t } = useI18n();
  const health = useAppleHealthConnection(t);

  const handleHealthConnect = useCallback(async () => {
    const result = await health.connect();
    if (result.ok) {
      const body = result.healthKit
        ? t('appleHealth.connectSuccessBodyHealthKit')
        : t('appleHealth.connectSuccessBody');
      Alert.alert(t('appleHealth.connectSuccessTitle'), body);
      return;
    }
    if (result.reason === 'unavailable') {
      Alert.alert(t('appleHealth.unavailableTitle'), t('appleHealth.unavailableBody'));
      return;
    }
    if (result.reason === 'permission_denied') {
      Alert.alert(
        t('appleHealth.permissionDeniedTitle'),
        t('appleHealth.permissionDeniedBody'),
      );
      return;
    }
    Alert.alert(t('appleHealth.connectErrorTitle'), t('appleHealth.connectErrorBody'));
  }, [health, t]);

  const focusTasks = useMemo(
    () => getHoyFocusTasks(tasks, incompleteTasksForToday),
    [tasks, incompleteTasksForToday],
  );

  const { planningMeta, projectProgress } = useHoyFocusTaskMeta(tasks);

  const attentionPlan = useMemo(() => {
    if (!todayMood || energyLevel <= 0 || !time || !focusLevel) return null;
    const projectList = Object.entries(projectsMap).map(([id, meta]) => ({
      id,
      name: meta.name,
      due_date: meta.due_date ?? null,
    }));
    return buildHoyAttentionPlan(tasks, projectList, {
      energyLevel,
      emotion: todayMood,
      availableTime: time,
      focusLevel,
    });
  }, [tasks, projectsMap, todayMood, energyLevel, time, focusLevel]);

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

  const focusTaskIds = useMemo(() => new Set(focusTasks.map((task) => task.id)), [focusTasks]);

  /** Pendientes de hoy que no están en el plan principal (pueden esperar). */
  const waitingTasks = useMemo(
    () => incompleteTasksForToday.filter((task) => !focusTaskIds.has(task.id)),
    [focusTaskIds, incompleteTasksForToday],
  );

  const restOfDayTasks = waitingTasks;

  const visibleWaitingTasks = useMemo(() => waitingTasks.slice(0, 5), [waitingTasks]);

  const waitingTasksSlot = useMemo(
    () =>
      visibleWaitingTasks.length > 0 ? (
        <View style={styles.waitingList}>
          {visibleWaitingTasks.map((task, index) => {
            const project = task.project_id ? projectsMap[task.project_id] : undefined;
            const minutes = getFocusTaskEstimatedMinutes(task, planningMeta[task.id]);
            const deadline = buildFocusTaskDeadline(task, project, locale, t);
            const progress = task.project_id ? projectProgress[task.project_id] : undefined;

            return (
              <HoyFocusTaskRow
                key={task.id}
                content={task.content}
                completed={task.is_completed}
                index={index}
                durationLabel={formatFocusTaskDuration(minutes)}
                deadlineLabel={deadline?.label ?? null}
                deadlineUrgent={deadline?.urgent ?? false}
                projectId={task.project_id ?? null}
                projectName={project?.name ?? null}
                projectColor={project?.color ?? THEME.colors.gradient.blue}
                projectPercent={progress?.percent ?? null}
                areaLabel={resolveFocusTaskAreaLabel(project)}
                onToggleComplete={() => void handleToggleTask(task.id)}
                onOpenDetails={() => handleEditTask(task)}
                onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
              />
            );
          })}
        </View>
      ) : null,
    [
      handleEditTask,
      handleToggleTask,
      locale,
      onDeleteTask,
      planningMeta,
      projectProgress,
      projectsMap,
      t,
      visibleWaitingTasks,
    ],
  );

  return (
    <View style={styles.root}>
      <HoyFocusPanel
        userId={user?.id}
        locale={locale}
        displayName={displayName}
        todayMood={todayMood}
        emotionLabel={todayEmotionLabel}
        energyLevel={energyLevel}
        time={time}
        focusLevel={focusLevel}
        coachSuggestion={coachSuggestion}
        attentionPlan={attentionPlan}
        priorityStats={todayPriorityStats}
        focusTasks={focusTasks}
        totalPending={incompleteTasksForToday.length}
        projectsMap={projectsMap}
        projectProgress={projectProgress}
        planningMeta={planningMeta}
        onToggleTask={(taskId) => void handleToggleTask(taskId)}
        onOpenTask={handleEditTask}
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
        shortSleep={health.shortSleep}
        sleepCard={{
          available: health.available,
          connected: health.connected,
          lastNightHours: health.lastNightHours,
          shortSleep: health.shortSleep,
          onConnect: handleHealthConnect,
          onOpenSleep: () => void health.openSleep(),
        }}
        crisisMode={crisisMode}
        waitingCount={waitingTasks.length}
        waitingTasksSlot={waitingTasksSlot}
        onCareModeDismiss={onCareModeDismiss}
        onCareModeLearnMore={onCareModeLearnMore}
        reorganizeSlot={
          reflection.shouldShowCard ? (
            <HoyDayReflectionCard onPress={reflection.openReflection} />
          ) : null
        }
      />

      {!compactLayout && !crisisMode ? (
        <HoyDayReflectionFlow
          sheetOpen={reflection.sheetOpen}
          successOpen={reflection.successOpen}
          selectedOutcome={reflection.selectedOutcome}
          replanning={reflection.replanning}
          lastProposal={reflection.lastProposal}
          onCloseReflection={reflection.closeReflection}
          onSelectOutcome={reflection.setSelectedOutcome}
          onReplan={() => void reflection.handleReplan()}
          onDismissSuccess={reflection.dismissSuccess}
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
  waitingList: {
    gap: THEME.spacing.sm,
  },
});
