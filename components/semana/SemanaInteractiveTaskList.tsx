import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { TaskCard, type Task } from '@/components/tasks/TaskCard';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { useI18n } from '@/contexts/I18nContext';
import { normalizeCategoryKey } from '@/lib/i18n/categoryLabels';
import { useHoyTaskExpansion } from '@/hooks/useHoyTaskExpansion';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useHoyDeleteTask } from '@/hooks/useHoyTaskActions';
import { useTaskPlanEdit } from '@/hooks/useTaskPlanEdit';

type ProjectInfo = {
  name: string;
  color: string;
};

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

type SemanaInteractiveTaskListProps = {
  tasks: Task[];
  projectsMap: Record<string, ProjectInfo>;
  onTasksChanged: () => void;
  showToast: ToastFn;
};

export function SemanaInteractiveTaskList({
  tasks,
  projectsMap,
  onTasksChanged,
  showToast,
}: SemanaInteractiveTaskListProps) {
  const { t, locale } = useI18n();
  const [localTasks, setLocalTasks] = useState(tasks);
  const backgroundLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingTasksRef = useRef(false);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const reloadTasks = useCallback(async () => {
    onTasksChanged();
  }, [onTasksChanged]);

  const {
    expandedTasks,
    expandedDetailsTasks,
    menuOpen,
    closeMenu,
    toggleMenu,
    editingTask,
    toggleDetailsExpansion,
    toggleTaskExpansion,
    handleEditTask,
    closeEditTask,
    setMenuOpen,
  } = useHoyTaskExpansion();

  const { toggleTask, clearToggleTimers } = useTaskActions({
    tasks: localTasks,
    setTasks: setLocalTasks,
    loadTasks: reloadTasks,
    showToast,
    setMenuOpen,
    backgroundLoadTimeoutRef,
    isLoadingTasksRef,
    locale,
  });

  const { handleDeleteTask } = useHoyDeleteTask({
    t,
    showToast,
    setTasks: setLocalTasks,
    loadTasks: reloadTasks,
    setMenuOpen,
  });

  useEffect(() => () => clearToggleTimers(), [clearToggleTimers]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        closeMenu();
      };
    }, [closeMenu]),
  );

  const rootTasks = useMemo(
    () => localTasks.filter((task) => !task.parent_task_id),
    [localTasks],
  );

  const getCategoryColor = useCallback((category: string) => {
    const key = normalizeCategoryKey(category) ?? category.trim().toLowerCase();
    return (
      THEME.colors.category[key as keyof typeof THEME.colors.category] ??
      THEME.colors.text.secondary
    );
  }, []);

  const getProjectInfo = useCallback(
    (task: Task) => {
      if (!task.project_id) {
        return {
          label: t('components.looseTasks'),
          color: THEME.colors.text.secondary,
          projectId: undefined as string | undefined,
          projectName: undefined as string | undefined,
        };
      }
      const project = projectsMap[task.project_id];
      return {
        label: project?.name ?? t('semana.projectFallback'),
        color: project?.color ?? THEME.colors.gradient.blue,
        projectId: task.project_id,
        projectName: project?.name,
      };
    },
    [projectsMap, t],
  );

  const editProjects = useMemo(
    () =>
      Object.entries(projectsMap).map(([id, meta]) => ({
        id,
        name: meta.name,
      })),
    [projectsMap],
  );

  const { saving: planEditSaving, savePlan } = useTaskPlanEdit({
    onError: (message) => showToast(message, 'error'),
    onSaved: (taskId, payload) => {
      setLocalTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                content: payload.content,
                scheduled_date: payload.scheduledDate,
                project_id: payload.projectId,
              }
            : task,
        ),
      );
      closeEditTask();
      showToast(t('hooks.taskUpdated'), 'success');
      void reloadTasks();
    },
  });

  const handleSavePlanEdit = useCallback(
    async (payload: Parameters<typeof savePlan>[0]) => {
      await savePlan(payload);
    },
    [savePlan],
  );

  const handleDeleteEditingTask = useCallback(async () => {
    if (!editingTask) return;
    await handleDeleteTask(editingTask);
    closeEditTask();
  }, [closeEditTask, editingTask, handleDeleteTask]);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {menuOpen ? (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.closeMenuA11y')}
        />
      ) : null}

      <View style={styles.list}>
        {rootTasks.map((task, index) => {
          const projectInfo = getProjectInfo(task);
          return (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              expanded={expandedTasks.has(task.id)}
              expandedDetails={expandedDetailsTasks.has(task.id)}
              onToggleDetailsExpand={() => toggleDetailsExpansion(task.id)}
              menuOpen={menuOpen === task.id}
              onToggle={() => void toggleTask(task.id)}
              onToggleExpansion={() => toggleTaskExpansion(task.id)}
              onMenuPress={() => toggleMenu(task.id)}
              onEditTask={() => handleEditTask(task)}
              onDeleteTask={() => handleDeleteTask(task)}
              getCategoryColor={getCategoryColor}
              onSubtaskToggle={(subtaskId) => void toggleTask(subtaskId, true, task.id)}
              projectLabel={projectInfo.label}
              projectLabelColor={projectInfo.color}
              projectId={projectInfo.projectId}
              projectName={projectInfo.projectName}
              onPressProject={
                projectInfo.projectId
                  ? () => router.push(`/project/${projectInfo.projectId}`)
                  : undefined
              }
              onToggleTask={(taskId) => void toggleTask(taskId)}
              uniformCard
            />
          );
        })}
      </View>

      {editingTask ? (
        <TaskEditModal
          visible={editingTask !== null}
          task={editingTask}
          projects={editProjects}
          onSavePlan={handleSavePlanEdit}
          onDelete={handleDeleteEditingTask}
          saving={planEditSaving}
          onClose={closeEditTask}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  list: {
    gap: THEME.spacing.xs,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});
