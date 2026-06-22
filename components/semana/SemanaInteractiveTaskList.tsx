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
import { supabase } from '@/lib/supabase';

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
  /** Etiqueta de área/proyecto personalizada (p. ej. tareas sueltas). */
  resolveProjectInfo?: (task: Task) => {
    label: string;
    color: string;
    projectId?: string;
    projectName?: string;
  };
  /** Proyectos en el editor; por defecto se derivan de projectsMap. */
  editProjects?: { id: string; name: string }[];
  /** IDs de tareas raíz visibles (el listado completo va en `tasks`). */
  visibleTaskIds?: string[];
  /** Mostrar solo tareas completadas (sección archivadas). */
  completedOnly?: boolean;
  /** Desactiva swipe; mejor para listas con botones rápidos. */
  disableSwipe?: boolean;
};

export function SemanaInteractiveTaskList({
  tasks,
  projectsMap,
  onTasksChanged,
  showToast,
  resolveProjectInfo,
  editProjects: editProjectsProp,
  completedOnly = false,
  visibleTaskIds,
  disableSwipe = false,
}: SemanaInteractiveTaskListProps) {
  const { t, locale } = useI18n();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
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

  const visibleIdSet = useMemo(
    () => (visibleTaskIds?.length ? new Set(visibleTaskIds) : null),
    [visibleTaskIds],
  );

  const rootTasks = useMemo(() => {
    const base = localTasks.filter(
      (task) => !task.parent_task_id && (!visibleIdSet || visibleIdSet.has(task.id)),
    );
    if (completedOnly) {
      return base.filter((task) => task.is_completed);
    }
    return base.filter(
      (task) => !task.is_completed || completingIds.has(task.id),
    );
  }, [completedOnly, completingIds, localTasks, visibleIdSet]);

  const handleToggleTask = useCallback(
    (taskId: string, isSubtask?: boolean, parentTaskId?: string) => {
      const task = isSubtask
        ? localTasks
            .find((entry) => entry.id === parentTaskId)
            ?.subtasks?.find((st) => st.id === taskId)
        : localTasks.find((entry) => entry.id === taskId);

      if (task && !task.is_completed) {
        setCompletingIds((prev) => new Set(prev).add(taskId));
        setTimeout(() => {
          setCompletingIds((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
        }, 500);
      }

      void toggleTask(taskId, isSubtask, parentTaskId);
    },
    [localTasks, toggleTask],
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
      if (resolveProjectInfo) {
        return resolveProjectInfo(task);
      }
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
    [projectsMap, resolveProjectInfo, t],
  );

  const editProjects = useMemo(
    () =>
      editProjectsProp ??
      Object.entries(projectsMap).map(([id, meta]) => ({
        id,
        name: meta.name,
      })),
    [editProjectsProp, projectsMap],
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
                is_priority: payload.isPriority ?? task.is_priority,
                life_area_key: payload.projectId
                  ? null
                  : (payload.lifeAreaKey ?? task.life_area_key ?? null),
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
    try {
      if (editingTask.subtasks?.length) {
        const subtaskIds = editingTask.subtasks.map((st) => st.id);
        const { error: subtasksError } = await supabase
          .from('tasks')
          .delete()
          .in('id', subtaskIds);
        if (subtasksError) {
          showToast(t('errors.deleteSubtasksFailed'), 'error');
          return;
        }
      }
      const { error } = await supabase.from('tasks').delete().eq('id', editingTask.id);
      if (error) {
        showToast(t('errors.deleteTaskFailed'), 'error');
        return;
      }
      setLocalTasks((prev) =>
        prev.filter(
          (task) => task.id !== editingTask.id && task.parent_task_id !== editingTask.id,
        ),
      );
      closeEditTask();
      showToast(t('hoy.taskDeleted'), 'success');
      void reloadTasks();
    } catch {
      showToast(t('errors.deleteTaskFailed'), 'error');
    }
  }, [closeEditTask, editingTask, reloadTasks, showToast, t]);

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
              onToggle={() => handleToggleTask(task.id)}
              onToggleExpansion={() => toggleTaskExpansion(task.id)}
              onMenuPress={() => toggleMenu(task.id)}
              onEditTask={() => handleEditTask(task)}
              onDeleteTask={() => handleDeleteTask(task)}
              getCategoryColor={getCategoryColor}
              onSubtaskToggle={(subtaskId) => void handleToggleTask(subtaskId, true, task.id)}
              projectLabel={projectInfo.label}
              projectLabelColor={projectInfo.color}
              projectId={projectInfo.projectId}
              projectName={projectInfo.projectName}
              onPressProject={
                projectInfo.projectId
                  ? () => router.push(`/project/${projectInfo.projectId}`)
                  : undefined
              }
              onToggleTask={(taskId) => void handleToggleTask(taskId)}
              uniformCard
              swipeEnabled={!disableSwipe}
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
