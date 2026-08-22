import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { DayTasks, Project } from '@/hooks/useWeekTasks';
import type { Task } from '@/hooks/useTasks';
import { buildSemanaPlannerModel } from '@/lib/semana/buildSemanaPlannerModel';
import { loadTaskPlanningMetaMap } from '@/lib/taskPlanningMeta';
import type { WeekPlannerTaskStatus } from '@/lib/lifeAreas/types';
import { WeekPlannerDragBoard } from '@/components/tasks/experience/WeekPlannerDragBoard';
import { MoveTaskToDaySheet } from '@/components/tasks/experience/MoveTaskToDaySheet';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import {
  ProjectQuickAddTaskModal,
  type ProjectQuickAddTarget,
} from '@/components/projects/ProjectQuickAddTaskModal';
import { useTaskPlanEdit } from '@/hooks/useTaskPlanEdit';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { supabase } from '@/lib/supabase';

import type { SemanaBoardLayout } from '@/lib/semana/rangeMode';

type SemanaDraggableWeekBoardProps = {
  weekTasks: DayTasks[];
  projects: Project[];
  userId?: string;
  boardLayout?: SemanaBoardLayout;
  onMoveTask: (taskId: string, targetDayId: string) => Promise<{ ok: boolean }>;
  onTasksChanged?: (created?: {
    title: string;
    taskId?: string;
    scheduledDate?: string | null;
    projectId?: string | null;
  }) => void;
  moving?: boolean;
  onDraggingChange?: (dragging: boolean) => void;
  hasCheckInToday?: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onTaskCompletedLocal?: (taskId: string, isCompleted: boolean) => void;
};

export function SemanaDraggableWeekBoard({
  weekTasks,
  projects,
  userId,
  boardLayout = 'weekGrid',
  onMoveTask,
  onTasksChanged,
  moving = false,
  onDraggingChange,
  hasCheckInToday = false,
  showToast,
  onTaskCompletedLocal,
}: SemanaDraggableWeekBoardProps) {
  const { t, locale } = useI18n();
  const [moveTask, setMoveTask] = useState<{ taskId: string; dayId: string; title: string } | null>(
    null,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [quickAddTarget, setQuickAddTarget] = useState<ProjectQuickAddTarget | null>(null);
  const [planningMetaVersion, setPlanningMetaVersion] = useState(0);
  const [completeById, setCompleteById] = useState<Record<string, boolean>>({});
  const completeByIdRef = useRef(completeById);
  const togglingRef = useRef(new Set<string>());
  completeByIdRef.current = completeById;

  useEffect(() => {
    let cancelled = false;
    void loadTaskPlanningMetaMap().then(() => {
      if (!cancelled) setPlanningMetaVersion((value) => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { days: modelDays, areas } = useMemo(
    () => buildSemanaPlannerModel(weekTasks, projects, t('projectsUi.looseTitle'), locale),
    [weekTasks, projects, t, locale, planningMetaVersion],
  );

  const days = useMemo(() => {
    if (Object.keys(completeById).length === 0) return modelDays;
    return modelDays.map((day) => ({
      ...day,
      tasks: day.tasks.map((task) => {
        const override = completeById[task.id];
        if (override == null) return task;
        const status: WeekPlannerTaskStatus = override
          ? 'done'
          : task.status === 'star'
            ? 'star'
            : 'pending';
        return { ...task, status };
      }),
    }));
  }, [completeById, modelDays]);

  const tasksById = useMemo(() => {
    const map: Record<string, Task> = {};
    for (const { tasks } of weekTasks) {
      for (const task of tasks) {
        map[task.id] = task;
      }
    }
    return map;
  }, [weekTasks]);

  useEffect(() => {
    setCompleteById((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const { tasks } of weekTasks) {
        for (const task of tasks) {
          if (next[task.id] != null && next[task.id] === Boolean(task.is_completed)) {
            delete next[task.id];
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [weekTasks]);

  const editProjects = useMemo(
    () => projects.map((project) => ({ id: project.id, name: project.name, color: project.color })),
    [projects],
  );

  const quickAddProjects = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color ?? THEME.colors.gradient.blue,
      })),
    [projects],
  );

  const openTasksCount = useMemo(
    () => days.reduce((sum, day) => sum + day.tasks.length, 0),
    [days],
  );

  const { saving: planEditSaving, savePlan } = useTaskPlanEdit({
    onSaved: () => {
      void loadTaskPlanningMetaMap().then(() => setPlanningMetaVersion((value) => value + 1));
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
      if (togglingRef.current.has(taskId)) return;
      const task = tasksById[taskId];
      if (!task) return;
      const current = completeByIdRef.current[taskId] ?? Boolean(task.is_completed);
      const nextCompleted = !current;
      togglingRef.current.add(taskId);
      setCompleteById((prev) => ({ ...prev, [taskId]: nextCompleted }));
      onTaskCompletedLocal?.(taskId, nextCompleted);
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId);
      togglingRef.current.delete(taskId);
      if (error) {
        setCompleteById((prev) => ({ ...prev, [taskId]: current }));
        onTaskCompletedLocal?.(taskId, current);
        showToast?.(t('errors.updateFailed'), 'error');
        return;
      }
      onTasksChanged?.();
    },
    [onTaskCompletedLocal, onTasksChanged, showToast, t, tasksById],
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
    if (error) {
      showToast?.(t('errors.deleteTaskFailed'), 'error');
      return;
    }
    setEditingTask(null);
    onTasksChanged?.();
  }, [editingTask, onTasksChanged, showToast, t]);

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      const task = tasksById[taskId];
      if (!task) return;
      const taskLabel =
        task.content.length > 40 ? `${task.content.slice(0, 40)}…` : task.content;
      Alert.alert(t('hoy.deleteTaskTitle'), t('hoy.deleteTaskConfirm', { task: taskLabel }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('errors.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { error } = await supabase.from('tasks').delete().eq('id', taskId);
              if (error) {
                showToast?.(t('errors.deleteTaskFailed'), 'error');
                return;
              }
              onTasksChanged?.();
            })();
          },
        },
      ]);
    },
    [onTasksChanged, showToast, t, tasksById],
  );

  const handlePressAddToDay = useCallback(
    (dayId: string, dayLabel: string) => {
      onDraggingChange?.(false);
      setQuickAddTarget({ mode: 'day', date: dayId, dayLabel });
    },
    [onDraggingChange],
  );

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
        onDeleteTask={handleDeleteTask}
        onPressAddToDay={handlePressAddToDay}
        onDraggingChange={onDraggingChange}
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
          userId={userId}
          onSavePlan={handleSavePlanEdit}
          onDelete={handleDeleteEditingTask}
          saving={planEditSaving}
          onClose={() => setEditingTask(null)}
        />
      ) : null}

      <ProjectQuickAddTaskModal
        visible={quickAddTarget != null}
        target={quickAddTarget}
        userId={userId}
        hasCheckInToday={hasCheckInToday}
        projects={quickAddProjects}
        onClose={() => setQuickAddTarget(null)}
        onSaved={({ title: savedTitle, dayLabel, projectName, taskId, scheduledDate, projectId }) => {
          onTasksChanged?.({
            title: savedTitle,
            taskId,
            scheduledDate,
            projectId,
          });
          if (dayLabel) {
            showToast?.(
              projectName
                ? t('semana.quickAddDayProjectSuccess', {
                    title: savedTitle,
                    day: dayLabel,
                    project: projectName,
                  })
                : t('semana.quickAddDaySuccess', { title: savedTitle, day: dayLabel }),
              'success',
            );
          }
        }}
        onOpenFullCapture={(projectId) => {
          if (quickAddTarget?.mode !== 'day') return;
          openVaciarCapture({ date: quickAddTarget.date, projectId: projectId ?? undefined });
        }}
      />
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
