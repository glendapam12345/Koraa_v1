import { View, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { HoyFocusPanel } from '@/components/hoy/HoyFocusPanel';
import { HoyRestOfDayPanel } from '@/components/hoy/HoyRestOfDayPanel';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { FocusProgressStats } from '@/components/FocusProgressBar';

export type HoyTasksSectionProps = {
  todayMood: string;
  todayEmotionLabel: string;
  energyLevel: number;
  time: string;
  focusLevel: string;
  todayPriorityStats: FocusProgressStats;
  hoyLiteLayout: boolean | null;
  user: { id: string } | null;
  tasks: Task[];
  displayedIncompleteTasks: Task[];
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
  onOpenCalendar: () => void;
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
  todayPriorityStats,
  hoyLiteLayout,
  user,
  tasks,
  displayedIncompleteTasks,
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
  const { locale } = useI18n();

  const focusTasks = useMemo(
    () =>
      displayedIncompleteTasks.filter(
        (task) => task.is_priority && !task.parent_task_id,
      ),
    [displayedIncompleteTasks],
  );

  const restOfDayTasks = useMemo(
    () =>
      incompleteTasksForToday.filter(
        (task) => !task.is_priority || Boolean(task.parent_task_id),
      ),
    [incompleteTasksForToday],
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

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.sm,
  },
});
