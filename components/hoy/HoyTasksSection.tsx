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
  projectsMap: Record<string, { name: string; color?: string }>;
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
  onLightenLoad?: () => void;
  crisisMode?: boolean;
  onCareModeDismiss?: () => void;
  onCareModeLearnMore?: () => void;
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
  onLightenLoad,
  crisisMode = false,
  onCareModeDismiss,
  onCareModeLearnMore,
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
          {visibleWaitingTasks.map((task, index) => (
            <HoyFocusTaskRow
              key={task.id}
              task={task}
              index={index}
              projectName={
                task.project_id ? projectsMap[task.project_id]?.name ?? null : null
              }
              onToggleComplete={() => void handleToggleTask(task.id)}
              onOpenDetails={() => handleEditTask(task)}
              onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
            />
          ))}
        </View>
      ) : null,
    [
      handleEditTask,
      handleToggleTask,
      onDeleteTask,
      projectsMap,
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
        priorityStats={todayPriorityStats}
        focusTasks={focusTasks}
        totalPending={incompleteTasksForToday.length}
        projectsMap={projectsMap}
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
        onLightenLoad={onLightenLoad}
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
      />
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
