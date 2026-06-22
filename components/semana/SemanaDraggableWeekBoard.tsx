import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { DayTasks, Project } from '@/hooks/useWeekTasks';
import type { Task } from '@/hooks/useTasks';
import { buildSemanaPlannerModel } from '@/lib/semana/buildSemanaPlannerModel';
import { WeekPlannerDragBoard } from '@/components/tasks/experience/WeekPlannerDragBoard';
import { MoveTaskToDaySheet } from '@/components/tasks/experience/MoveTaskToDaySheet';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { useTaskPlanEdit } from '@/hooks/useTaskPlanEdit';
import { supabase } from '@/lib/supabase';

import type { SemanaBoardLayout } from '@/lib/semana/rangeMode';

type SemanaDraggableWeekBoardProps = {
  weekTasks: DayTasks[];
  projects: Project[];
  boardLayout?: SemanaBoardLayout;
  onMoveTask: (taskId: string, targetDayId: string) => Promise<{ ok: boolean }>;
  onTasksChanged?: () => void;
  moving?: boolean;
};

export function SemanaDraggableWeekBoard({
  weekTasks,
  projects,
  boardLayout = 'weekGrid',
  onMoveTask,
  onTasksChanged,
  moving = false,
}: SemanaDraggableWeekBoardProps) {
  const { t, locale } = useI18n();
  const [moveTask, setMoveTask] = useState<{ taskId: string; dayId: string; title: string } | null>(
    null,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { days, areas } = useMemo(
    () => buildSemanaPlannerModel(weekTasks, projects, t('projectsUi.looseTitle'), locale),
    [weekTasks, projects, t, locale],
  );

  const tasksById = useMemo(() => {
    const map: Record<string, Task> = {};
    for (const { tasks } of weekTasks) {
      for (const task of tasks) {
        map[task.id] = task;
      }
    }
    return map;
  }, [weekTasks]);

  const editProjects = useMemo(
    () => projects.map((project) => ({ id: project.id, name: project.name })),
    [projects],
  );

  const openTasksCount = useMemo(
    () => days.reduce((sum, day) => sum + day.tasks.length, 0),
    [days],
  );

  const { saving: planEditSaving, savePlan } = useTaskPlanEdit({
    onSaved: () => {
      setEditingTask(null);
      onTasksChanged?.();
    },
  });

  const handleRequestMove = (taskId: string, dayId: string) => {
    const task = days.flatMap((day) => day.tasks).find((entry) => entry.id === taskId);
    if (!task) return;
    setMoveTask({ taskId, dayId, title: task.title });
  };

  const handleMoveToDay = async (targetDayId: string) => {
    if (!moveTask) return;
    await onMoveTask(moveTask.taskId, targetDayId);
    setMoveTask(null);
  };

  const handlePressTask = useCallback(
    (taskId: string) => {
      const task = tasksById[taskId];
      if (task) setEditingTask(task);
    },
    [tasksById],
  );

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      const task = tasksById[taskId];
      if (!task) return;
      const nextCompleted = !task.is_completed;
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId);
      if (!error) onTasksChanged?.();
    },
    [onTasksChanged, tasksById],
  );

  const handleSavePlanEdit = useCallback(
    async (payload: Parameters<typeof savePlan>[0]) => {
      await savePlan(payload);
    },
    [savePlan],
  );

  const handleDeleteEditingTask = useCallback(async () => {
    if (!editingTask) return;
    const { error } = await supabase.from('tasks').delete().eq('id', editingTask.id);
    if (!error) {
      setEditingTask(null);
      onTasksChanged?.();
    }
  }, [editingTask, onTasksChanged]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{t('semana.plannerInteractHint')}</Text>

      <WeekPlannerDragBoard
        days={days}
        areas={areas}
        layout={boardLayout}
        onMoveTask={onMoveTask}
        onRequestMoveSheet={handleRequestMove}
        onPressTask={handlePressTask}
        onToggleComplete={(taskId) => void handleToggleComplete(taskId)}
      />

      {openTasksCount === 0 ? (
        <View style={styles.emptyWeek}>
          <Text style={styles.emptyWeekEmoji}>📅</Text>
          <Text style={styles.emptyWeekTitle}>{t('semana.emptyDay')}</Text>
          <Text style={styles.emptyWeekHint}>{t('semana.emptyHint')}</Text>
        </View>
      ) : null}

      {moving ? (
        <ActivityIndicator color={THEME.colors.calm.lavenderDeep} style={styles.moving} />
      ) : null}

      <MoveTaskToDaySheet
        visible={moveTask != null}
        taskTitle={moveTask?.title ?? ''}
        days={days}
        currentDayId={moveTask?.dayId ?? ''}
        onSelect={(dayId) => void handleMoveToDay(dayId)}
        onClose={() => setMoveTask(null)}
      />

      {editingTask ? (
        <TaskEditModal
          visible={editingTask != null}
          task={editingTask}
          projects={editProjects}
          onSavePlan={handleSavePlanEdit}
          onDelete={handleDeleteEditingTask}
          saving={planEditSaving}
          onClose={() => setEditingTask(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
    marginBottom: 2,
  },
  moving: {
    alignSelf: 'center',
  },
  emptyWeek: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.sm,
  },
  emptyWeekEmoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    lineHeight: 34,
  },
  emptyWeekTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  emptyWeekHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
