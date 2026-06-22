import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, CheckCircle2, Plus, Pencil, CheckSquare, Trash2 } from 'lucide-react-native';
import type { Task } from '@/components/tasks/TaskCard';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { ProjectEditModal } from '@/components/projects/ProjectEditModal';
import { ProjectMetaRow } from '@/components/projects/ProjectMetaRow';
import { ProjectFocusCta } from '@/components/projects/ProjectFocusCta';
import { ProjectNotesBlock } from '@/components/projects/ProjectNotesBlock';
import {
  ProjectQuickAddTaskModal,
  type ProjectQuickAddTarget,
} from '@/components/projects/ProjectQuickAddTaskModal';
import { Toast } from '@/components/Toast';
import { useI18n } from '@/contexts/I18nContext';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { confirmDeleteProject, deleteProjectById } from '@/lib/deleteProject';
import { fetchProjectById, fetchUserProjects } from '@/lib/projectDueDateSchema';
import { normalizeDueDateInput } from '@/lib/projectProgress';
import { updateProjectFields } from '@/lib/updateProjectFields';
import { TaskMoveProjectModal } from '@/components/tasks/TaskMoveProjectModal';
import {
  getNextWeekDateString,
  getTomorrowDateString,
  moveTaskToProject,
  rescheduleTask,
} from '@/lib/taskReplan';
import { getProjectEmoji } from '@/lib/projectEmoji';
import {
  resolveProjectLifeAreaKey,
  makeCustomLifeAreaRef,
  type LifeAreaKey,
  type LifeAreaRef,
} from '@/lib/lifeAreas/lifeAreaCatalog';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { AreaNameEditSheet } from '@/components/projects/AreaNameEditSheet';
import { LooseTasksFilterBar } from '@/components/projects/LooseTasksFilterBar';
import {
  filterLooseTasks,
  isLooseTaskSortFilter,
  type LooseTaskSortFilter,
} from '@/lib/looseTasks';
import { resolveLifeAreaDisplay } from '@/lib/lifeAreas/userLifeAreas';
import { makePresetCustomAreaLabelGetter } from '@/lib/lifeAreas/makePresetCustomAreaLabelGetter';
import type { TranslationKey } from '@/lib/i18n';
import { useTaskPlanEdit } from '@/hooks/useTaskPlanEdit';
import { normalizeCategoryKey } from '@/lib/i18n/categoryLabels';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { SemanaInteractiveTaskList } from '@/components/semana/SemanaInteractiveTaskList';
import {
  LOOSE_COMPLETED_RETENTION_DAYS,
  filterRetainedLooseCompletedTasks,
  purgeExpiredLooseCompletedTasks,
} from '@/lib/looseCompletedRetention';

export default function ProjectScreen() {
  const params = useLocalSearchParams<{
    id: string;
    filter?: string;
    area?: string;
    highlight?: string;
  }>();
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const areaFilter = typeof params.area === 'string' ? params.area : undefined;
  const highlightTaskId =
    typeof params.highlight === 'string' ? params.highlight : undefined;
  const initialFilter = isLooseTaskSortFilter(params.filter) ? params.filter : 'all';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const { config: lifeAreasConfig, addCustomArea } = useUserLifeAreas(user?.id);
  const [showNewAreaSheet, setShowNewAreaSheet] = useState(false);
  const [project, setProject] = useState<{
    name: string;
    color: string;
    dueDate: string | null;
    lifeAreaKey: LifeAreaRef;
    notes: string | null;
  } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedDetailsTasks, setExpandedDetailsTasks] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectColor, setEditProjectColor] = useState<string>(THEME.colors.gradient.blue);
  const [editProjectDueDate, setEditProjectDueDate] = useState('');
  const [editProjectLifeAreaKey, setEditProjectLifeAreaKey] = useState<LifeAreaRef>('other');
  const [editProjectNotes, setEditProjectNotes] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const [quickAddTarget, setQuickAddTarget] = useState<ProjectQuickAddTarget | null>(null);
  const [looseFilter, setLooseFilter] = useState<LooseTaskSortFilter>(initialFilter);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [moveTaskTarget, setMoveTaskTarget] = useState<Task | null>(null);
  const [looseSelectMode, setLooseSelectMode] = useState(false);
  const [looseSelectedIds, setLooseSelectedIds] = useState<Set<string>>(() => new Set());
  const [allProjects, setAllProjects] = useState<{ id: string; name: string; color: string }[]>(
    [],
  );
  const hasLoadedRef = useRef(false);

  const { hasCheckInToday } = useHasCheckInToday(user?.id);
  const isLoose = projectId === 'sin-proyecto';

  const loadProjectAndTasks = useCallback(async (options?: { silent?: boolean }) => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }
    const silent = Boolean(options?.silent && hasLoadedRef.current);
    if (!silent) setLoading(true);
    try {
      if (isLoose) {
        setProject({ name: t('projectDetail.looseName'), color: THEME.colors.text.tertiary, dueDate: null, lifeAreaKey: 'home', notes: null });

        await purgeExpiredLooseCompletedTasks(user.id);

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .is('project_id', null)
          .is('parent_task_id', null)
          .order('is_priority', { ascending: false })
          .order('created_at', { ascending: true });

        if (tasksError) {
          setTasks([]);
          setLoading(false);
          return;
        }

        const parentIds = (tasksData ?? []).map((task) => task.id);
        let subtasksData: Task[] = [];
        if (parentIds.length > 0) {
          const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .in('parent_task_id', parentIds)
            .order('created_at', { ascending: true });
          subtasksData = (data as Task[]) ?? [];
        }

        const tasksWithSubtasks = (tasksData ?? []).map((task: Task) => ({
          ...task,
          subtasks: subtasksData.filter((st: Task) => st.parent_task_id === task.id),
        }));
        setTasks(tasksWithSubtasks);
        hasLoadedRef.current = true;
      } else {
        const [projectResult, tasksResult] = await Promise.all([
          fetchProjectById(user.id, projectId),
          supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('project_id', projectId)
            .is('parent_task_id', null)
            .order('is_priority', { ascending: false })
            .order('created_at', { ascending: true }),
        ]);

        const { data: projectData, error: projectError } = projectResult;
        const { data: tasksData, error: tasksError } = tasksResult;

        if (projectError || !projectData) {
          setProject(null);
          setTasks([]);
          setLoading(false);
          return;
        }
        setProject({
          name: projectData.name,
          color: projectData.color ?? THEME.colors.gradient.blue,
          dueDate: projectData.due_date ?? null,
          lifeAreaKey: resolveProjectLifeAreaKey(projectData.life_area_key, projectData.name),
          notes: projectData.notes ?? null,
        });

        if (tasksError) {
          setTasks([]);
          setLoading(false);
          return;
        }

        const parentIds = (tasksData ?? []).map((task) => task.id);
        let subtasksData: Task[] = [];
        if (parentIds.length > 0) {
          const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .in('parent_task_id', parentIds)
            .order('created_at', { ascending: true });
          subtasksData = (data as Task[]) ?? [];
        }

        const tasksWithSubtasks = (tasksData ?? []).map((task: Task) => ({
          ...task,
          subtasks: subtasksData.filter((st: Task) => st.parent_task_id === task.id),
        }));
        setTasks(tasksWithSubtasks);
        hasLoadedRef.current = true;
      }
    } catch {
      setProject(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, projectId, isLoose, t]);

  const openQuickAdd = useCallback(() => {
    if (isLoose) {
      const lifeAreaRef =
        areaFilter && (areaFilter.startsWith('custom:') || areaFilter.length > 0)
          ? (areaFilter as LifeAreaRef)
          : undefined;
      setQuickAddTarget({ mode: 'loose', lifeAreaRef });
      return;
    }
    if (!project || !projectId) return;
    setQuickAddTarget({
      mode: 'project',
      id: projectId,
      name: project.name,
      color: project.color,
    });
  }, [isLoose, project, projectId, areaFilter]);

  const handleQuickAddSaved = useCallback(
    ({ title, projectName }: { title: string; projectName?: string }) => {
      void loadProjectAndTasks({ silent: true });
      const message = projectName
        ? t('projects.quickAddSuccess', { title, name: projectName })
        : t('projects.quickAddSuccessLoose', { title });
      setToastMessage(message);
    },
    [loadProjectAndTasks, t],
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    loadProjectAndTasks();
  }, [loadProjectAndTasks]);

  useEffect(() => {
    if (highlightTaskId) {
      setExpandedTasks((prev) => new Set(prev).add(highlightTaskId));
      setExpandedDetailsTasks((prev) => new Set(prev).add(highlightTaskId));
    }
  }, [highlightTaskId, tasks.length]);

  useEffect(() => {
    if (isLooseTaskSortFilter(params.filter)) {
      setLooseFilter(params.filter);
    }
  }, [params.filter]);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data } = await fetchUserProjects(user.id);
      setAllProjects(
        (data ?? []).map((entry) => ({
          id: entry.id,
          name: entry.name,
          color: entry.color ?? THEME.colors.gradient.blue,
        })),
      );
    })();
  }, [user?.id]);

  const handleMoveTomorrow = useCallback(
    async (task: Task) => {
      const { error } = await rescheduleTask(task.id, getTomorrowDateString());
      if (error) return;
      setToastMessage(t('tasks.replanMovedTomorrow'));
      loadProjectAndTasks({ silent: true });
    },
    [loadProjectAndTasks, t],
  );

  const handleMoveNextWeek = useCallback(
    async (task: Task) => {
      const { error } = await rescheduleTask(task.id, getNextWeekDateString());
      if (error) return;
      setToastMessage(t('tasks.replanMovedNextWeek'));
      loadProjectAndTasks({ silent: true });
    },
    [loadProjectAndTasks, t],
  );

  const handleOpenMoveProject = useCallback((task: Task) => {
    setMoveTaskTarget(task);
  }, []);

  const handleConfirmMoveProject = useCallback(
    async (nextProjectId: string | null) => {
      if (!moveTaskTarget) return;
      const { error } = await moveTaskToProject(moveTaskTarget.id, nextProjectId);
      if (error) return;
      const projectName =
        nextProjectId == null
          ? t('projectsUi.looseTitle')
          : allProjects.find((entry) => entry.id === nextProjectId)?.name ?? '';
      setMoveTaskTarget(null);
      setToastMessage(t('tasks.replanMovedProject', { name: projectName }));
      if (nextProjectId && nextProjectId !== projectId) {
        router.replace(`/project/${nextProjectId}` as const);
        return;
      }
      if (nextProjectId === null && !isLoose) {
        router.replace('/project/sin-proyecto');
        return;
      }
      loadProjectAndTasks({ silent: true });
    },
    [allProjects, isLoose, loadProjectAndTasks, moveTaskTarget, projectId, router, t],
  );

  const replanProps = {
    enableReplanSwipe: true,
    onMoveTomorrow: handleMoveTomorrow,
    onMoveNextWeek: handleMoveNextWeek,
    onMoveProject: handleOpenMoveProject,
  };

  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);
  const allDone = completedTasks.length > 0 && incompleteTasks.length === 0;

  const filteredIncompleteTasks = useMemo(() => {
    if (!isLoose) return incompleteTasks;
    return filterLooseTasks(
      incompleteTasks.map((task) => ({
        id: task.id,
        content: task.content,
        created_at: task.created_at,
        scheduled_date: task.scheduled_date,
        life_area_key: task.life_area_key ?? null,
        is_completed: task.is_completed,
        is_priority: task.is_priority,
      })),
      looseFilter,
      { areaRef: areaFilter ?? null },
    ).map((summary) => incompleteTasks.find((task) => task.id === summary.id)!);
  }, [areaFilter, incompleteTasks, isLoose, looseFilter]);

  const filteredCompletedTasks = useMemo(() => {
    let list = isLoose ? filterRetainedLooseCompletedTasks(completedTasks) : completedTasks;
    if (!isLoose || looseFilter !== 'all') return list;
    if (!areaFilter) return list;
    return list.filter((task) => (task.life_area_key ?? null) === areaFilter);
  }, [areaFilter, completedTasks, isLoose, looseFilter]);

  const areaFilterLabel = useMemo(() => {
    if (!isLoose || !areaFilter) return null;
    const getDefaultLabel = (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey);
    const getPresetCustomLabel = makePresetCustomAreaLabelGetter(t);
    return resolveLifeAreaDisplay(
      areaFilter as LifeAreaRef,
      lifeAreasConfig,
      getDefaultLabel,
      getPresetCustomLabel,
    ).name;
  }, [areaFilter, isLoose, lifeAreasConfig, t]);

  const visibleIncompleteTasks = isLoose ? filteredIncompleteTasks : incompleteTasks;
  const visibleCompletedTasks = isLoose ? filteredCompletedTasks : completedTasks;

  const getCategoryColorCallback = useCallback((category: string) => {
    const key = normalizeCategoryKey(category) ?? category.trim().toLowerCase();
    return THEME.colors.category[key as keyof typeof THEME.colors.category] ?? THEME.colors.text.secondary;
  }, []);

  const getLooseProjectInfo = useCallback(
    (task: Task) => {
      if (task.life_area_key) {
        const getDefaultLabel = (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey);
        const display = resolveLifeAreaDisplay(
          task.life_area_key as LifeAreaRef,
          lifeAreasConfig,
          getDefaultLabel,
          makePresetCustomAreaLabelGetter(t),
        );
        return {
          label: display.name,
          color: THEME.colors.calm.lavenderDeep,
          projectId: undefined as string | undefined,
          projectName: undefined as string | undefined,
        };
      }
      return {
        label: t('components.looseTasks'),
        color: THEME.colors.text.secondary,
        projectId: undefined as string | undefined,
        projectName: undefined as string | undefined,
      };
    },
    [lifeAreasConfig, t],
  );

  const projectsMap = useMemo(
    () =>
      Object.fromEntries(
        allProjects.map((entry) => [entry.id, { name: entry.name, color: entry.color }]),
      ),
    [allProjects],
  );

  const showInteractiveToast = useCallback((message: string, _type?: 'success' | 'error' | 'info') => {
    setToastMessage(message);
  }, []);

  const exitLooseSelectMode = useCallback(() => {
    setLooseSelectMode(false);
    setLooseSelectedIds(new Set());
  }, []);

  const toggleLooseTaskSelected = useCallback((taskId: string) => {
    setLooseSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleBulkDeleteLooseTasks = useCallback(() => {
    const ids = [...looseSelectedIds];
    if (ids.length === 0) return;
    Alert.alert(
      t('looseTasks.deleteSelectedTitle'),
      t('looseTasks.deleteSelectedConfirm', { count: ids.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('errors.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { error } = await supabase.from('tasks').delete().in('id', ids);
              if (error) {
                setToastMessage(t('errors.deleteTaskFailed'));
                return;
              }
              exitLooseSelectMode();
              setToastMessage(t('looseTasks.deleteSelectedSuccess', { count: ids.length }));
              await loadProjectAndTasks({ silent: true });
            })();
          },
        },
      ],
    );
  }, [exitLooseSelectMode, loadProjectAndTasks, looseSelectedIds, t]);

  const getProjectInfoForTask = useCallback(
    (task: Task) => {
      if (isLoose) return getLooseProjectInfo(task);
      return {
        label: project?.name ?? '',
        color: project?.color ?? THEME.colors.gradient.blue,
        projectId: projectId ?? undefined,
        projectName: project?.name,
      };
    },
    [getLooseProjectInfo, isLoose, project, projectId],
  );

  const { saving: planEditSaving, savePlan } = useTaskPlanEdit({
    onSaved: (_taskId, payload) => {
      setEditingTask(null);
      setToastMessage(t('hooks.taskUpdated'));
      setTasks((prev) =>
        prev.map((task) =>
          task.id === payload.taskId
            ? {
                ...task,
                content: payload.content,
                scheduled_date: payload.scheduledDate,
                project_id: payload.projectId,
                is_priority: payload.isPriority ?? task.is_priority,
                life_area_key: payload.projectId ? null : (payload.lifeAreaKey ?? null),
              }
            : task,
        ),
      );
      void loadProjectAndTasks({ silent: true });
    },
    onError: (message) => setToastMessage(message),
  });

  const toggleExpansion = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);
  const toggleDetailsExpansion = useCallback((taskId: string) => {
    setExpandedDetailsTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleToggleTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !user) return;
      const newCompleted = !task.is_completed;
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId);
      if (!error) loadProjectAndTasks();
    },
    [tasks, user, loadProjectAndTasks]
  );

  useEffect(() => {
    if (project && !isLoose) {
      setEditProjectName(project.name);
      setEditProjectColor(project.color);
      setEditProjectDueDate(project.dueDate ?? '');
      setEditProjectLifeAreaKey(project.lifeAreaKey);
      setEditProjectNotes(project.notes ?? '');
    }
  }, [project, isLoose]);

  const handleDeleteProject = useCallback(() => {
    if (!projectId || isLoose || !project) return;
    confirmDeleteProject(t, project.name, async () => {
      const result = await deleteProjectById(projectId);
      if (result.ok) {
        setEditingProject(false);
        router.back();
      }
    });
  }, [isLoose, project, projectId, router, t]);

  const handleSaveProjectEdit = useCallback(async () => {
    if (!projectId || isLoose || !editProjectName.trim()) return;
    setSavingProject(true);
    try {
      const dueDate = normalizeDueDateInput(editProjectDueDate);
      const { error } = await updateProjectFields(projectId, {
        name: editProjectName.trim(),
        color: editProjectColor,
        due_date: dueDate,
        life_area_key: editProjectLifeAreaKey,
        notes: editProjectNotes,
      });
      if (!error) {
        setEditingProject(false);
        loadProjectAndTasks();
      }
    } finally {
      setSavingProject(false);
    }
  }, [
    editProjectColor,
    editProjectDueDate,
    editProjectLifeAreaKey,
    editProjectName,
    editProjectNotes,
    isLoose,
    loadProjectAndTasks,
    projectId,
  ]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setMenuOpen(null);
  }, []);

  const handleDeleteTask = useCallback(
    (task: Task) => {
      const taskLabel = task.content.length > 40 ? `${task.content.slice(0, 40)}…` : task.content;
      Alert.alert(
        t('projectDetail.deleteTitle'),
        t('projectDetail.deleteBodyNamed', { task: taskLabel }),
        [
          { text: t('errors.cancel'), style: 'cancel' },
          {
            text: t('errors.delete'),
            style: 'destructive',
            onPress: async () => {
              if (task.subtasks?.length) {
                const ids = task.subtasks.map((s) => s.id);
                await supabase.from('tasks').delete().in('id', ids);
              }
              const { error } = await supabase.from('tasks').delete().eq('id', task.id);
              if (!error) loadProjectAndTasks();
            },
          },
        ],
      );
    },
    [loadProjectAndTasks, t],
  );

  const handleSavePlanEdit = useCallback(
    async (payload: Parameters<typeof savePlan>[0]) => {
      await savePlan(payload);
    },
    [savePlan],
  );

  const handleDeleteEditingTask = useCallback(async () => {
    if (!editingTask) return;
    handleDeleteTask(editingTask);
    setEditingTask(null);
  }, [editingTask, handleDeleteTask]);

  if (!projectId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.errorText}>{t('projectDetail.notFound')}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
        <Text style={styles.loadingText}>{t('projectDetail.loadingProject')}</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.errorText}>{t('projectDetail.projectNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { borderLeftColor: project.color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel={t('projectDetail.back')}>
          <ChevronLeft size={24} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {!isLoose ? `${getProjectEmoji(project.name)} ` : ''}
            {project.name}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {allDone
              ? t('projectDetail.completed', {
                  count: completedTasks.length,
                  tasks:
                    completedTasks.length === 1
                      ? t('projectDetail.taskOne')
                      : t('projectDetail.taskMany'),
                })
              : t('projectDetail.subtitleProgress', {
                  pending: visibleIncompleteTasks.length,
                  total: isLoose ? visibleIncompleteTasks.length + visibleCompletedTasks.length : tasks.length,
                })}
          </Text>
        </View>
        {!isLoose ? (
          <TouchableOpacity
            onPress={() => setEditingProject(true)}
            style={styles.headerEditBtn}
            accessibilityRole="button"
            accessibilityLabel={t('projects.renameProjectA11y', { name: project.name })}
          >
            <Pencil size={20} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              if (looseSelectMode) {
                exitLooseSelectMode();
                return;
              }
              setLooseSelectMode(true);
            }}
            style={styles.headerEditBtn}
            accessibilityRole="button"
            accessibilityLabel={
              looseSelectMode
                ? t('looseTasks.cancelSelectA11y')
                : t('looseTasks.selectModeA11y')
            }
          >
            {looseSelectMode ? (
              <Text style={styles.headerSelectLabel}>{t('looseTasks.cancelSelect')}</Text>
            ) : (
              <CheckSquare size={20} color={THEME.colors.calm.lavenderDeep} />
            )}
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {allDone && (
          <View style={styles.completedBanner}>
            <CheckCircle2 size={28} color={THEME.colors.semantic.success} />
            <Text style={styles.completedBannerText}>{t('projectDetail.completedBanner')}</Text>
            <Text style={styles.completedBannerSub}>{t('projectDetail.completedBannerSub')}</Text>
          </View>
        )}

        {isLoose ? (
          <View style={styles.looseTools}>
            {areaFilterLabel ? (
              <Text style={styles.looseAreaBadge}>
                {t('looseTasks.areaFilter', { area: areaFilterLabel })}
              </Text>
            ) : null}
            <LooseTasksFilterBar value={looseFilter} onChange={setLooseFilter} />
            {visibleIncompleteTasks.length === 0 && incompleteTasks.length > 0 ? (
              <Text style={styles.looseEmptyFilter}>{t('looseTasks.emptyFilter')}</Text>
            ) : null}
            {looseSelectMode ? (
              <View style={styles.looseBulkBar}>
                <Text style={styles.looseBulkCount}>
                  {t('looseTasks.selectedCount', { count: looseSelectedIds.size })}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.looseBulkDeleteBtn,
                    looseSelectedIds.size === 0 && styles.looseBulkDeleteBtnDisabled,
                  ]}
                  onPress={handleBulkDeleteLooseTasks}
                  disabled={looseSelectedIds.size === 0}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('looseTasks.deleteSelectedA11y', {
                    count: looseSelectedIds.size,
                  })}
                >
                  <Trash2 size={16} color={THEME.colors.semantic.danger} />
                  <Text style={styles.looseBulkDeleteText}>
                    {t('looseTasks.deleteSelected', { count: looseSelectedIds.size })}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {!isLoose && user ? (
          <View style={styles.metaSection}>
            <ProjectMetaRow
              taskCount={tasks.length}
              incompleteCount={incompleteTasks.length}
              dueDate={project.dueDate}
              accentColor={project.color}
            />
            <ProjectNotesBlock notes={project.notes} onEdit={() => setEditingProject(true)} />
            <ProjectFocusCta
              userId={user.id}
              projectId={projectId}
              projectName={project.name}
              incompleteCount={incompleteTasks.length}
              onFocused={loadProjectAndTasks}
            />
          </View>
        ) : null}

        {visibleIncompleteTasks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>{t('projectDetail.pendingSection')}</Text>
            {isLoose ? (
              <SemanaInteractiveTaskList
                tasks={tasks}
                visibleTaskIds={visibleIncompleteTasks.map((task) => task.id)}
                projectsMap={projectsMap}
                onTasksChanged={() => void loadProjectAndTasks({ silent: true })}
                showToast={showInteractiveToast}
                resolveProjectInfo={getLooseProjectInfo}
                editProjects={allProjects.map((entry) => ({ id: entry.id, name: entry.name }))}
                disableSwipe
                highlightTaskId={highlightTaskId}
                selectionMode={looseSelectMode}
                selectedTaskIds={looseSelectedIds}
                onToggleSelect={toggleLooseTaskSelected}
              />
            ) : (
              <TaskList
                tasks={tasks}
                incompleteTasks={visibleIncompleteTasks}
                expandedTasks={expandedTasks}
                expandedDetailsTasks={expandedDetailsTasks}
                menuOpen={menuOpen}
                onToggleTask={handleToggleTask}
                onToggleExpansion={toggleExpansion}
                onToggleDetailsExpansion={toggleDetailsExpansion}
                onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                getCategoryColor={getCategoryColorCallback}
                onSubtaskToggle={() => {}}
                getProjectInfo={getProjectInfoForTask}
                hideProjectLabel
                sectionAccentColor={project.color}
                {...replanProps}
              />
            )}
          </>
        )}

        {visibleCompletedTasks.length > 0 && (
          <>
            {isLoose ? (
              <View style={styles.looseRetentionNotice}>
                <Text style={styles.looseRetentionNoticeText}>
                  {t('projectDetail.looseCompletedRetentionNotice', {
                    days: LOOSE_COMPLETED_RETENTION_DAYS,
                  })}
                </Text>
              </View>
            ) : null}
            <Text style={styles.sectionLabel}>
              {t('projectDetail.completedSection', { count: visibleCompletedTasks.length })}
            </Text>
            {isLoose ? (
              <SemanaInteractiveTaskList
                tasks={tasks}
                visibleTaskIds={visibleCompletedTasks.map((task) => task.id)}
                projectsMap={projectsMap}
                onTasksChanged={() => void loadProjectAndTasks({ silent: true })}
                showToast={showInteractiveToast}
                resolveProjectInfo={getLooseProjectInfo}
                editProjects={allProjects.map((entry) => ({ id: entry.id, name: entry.name }))}
                completedOnly
                disableSwipe
                selectionMode={looseSelectMode}
                selectedTaskIds={looseSelectedIds}
                onToggleSelect={toggleLooseTaskSelected}
              />
            ) : (
              <TaskList
                tasks={tasks}
                incompleteTasks={visibleCompletedTasks}
                expandedTasks={expandedTasks}
                expandedDetailsTasks={expandedDetailsTasks}
                menuOpen={menuOpen}
                onToggleTask={handleToggleTask}
                onToggleExpansion={toggleExpansion}
                onToggleDetailsExpansion={toggleDetailsExpansion}
                onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                getCategoryColor={getCategoryColorCallback}
                onSubtaskToggle={() => {}}
                getProjectInfo={getProjectInfoForTask}
                hideProjectLabel
                sectionAccentColor={project.color}
                {...replanProps}
              />
            )}
          </>
        )}

        {tasks.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {isLoose ? t('projectDetail.noLooseTasks') : t('projectDetail.noProjectTasks')}
            </Text>
            <Text style={styles.emptyText}>
              {isLoose ? t('projectDetail.emptyLoose') : t('projectDetail.emptyProject')}
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={openQuickAdd}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={isLoose ? t('projectDetail.goTasksA11y') : t('projectDetail.addTaskA11y')}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyCtaGradient}
              >
                <Plus size={20} color={THEME.colors.onGradient} />
                <Text style={styles.emptyCtaText}>{isLoose ? t('projectDetail.goTasks') : t('projectDetail.addTask')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {tasks.length > 0 ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + THEME.spacing.lg }]}
          onPress={openQuickAdd}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={isLoose ? t('projectDetail.goTasksA11y') : t('projectDetail.addTaskA11y')}
        >
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <Plus size={24} color={THEME.colors.onGradient} />
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      {!isLoose && menuOpen ? (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(null)}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.closeMenuA11y')}
        />
      ) : null}

      {!isLoose && editingTask ? (
        <TaskEditModal
          visible={editingTask != null}
          task={editingTask}
          projects={allProjects}
          userId={user?.id}
          onSavePlan={handleSavePlanEdit}
          onDelete={handleDeleteEditingTask}
          saving={planEditSaving}
          onClose={() => setEditingTask(null)}
        />
      ) : null}

      {!isLoose ? (
        <ProjectEditModal
          visible={editingProject}
          name={editProjectName}
          color={editProjectColor}
          dueDate={editProjectDueDate}
          lifeAreaKey={editProjectLifeAreaKey}
          lifeAreasConfig={lifeAreasConfig}
          onAddCustomArea={() => setShowNewAreaSheet(true)}
          notes={editProjectNotes}
          onNameChange={setEditProjectName}
          onColorChange={setEditProjectColor}
          onDueDateChange={setEditProjectDueDate}
          onNotesChange={setEditProjectNotes}
          onLifeAreaChange={setEditProjectLifeAreaKey}
          onSave={() => void handleSaveProjectEdit()}
          onClose={() => setEditingProject(false)}
          onDelete={handleDeleteProject}
          saving={savingProject}
        />
      ) : null}

      <ProjectQuickAddTaskModal
        visible={quickAddTarget != null}
        target={quickAddTarget}
        userId={user?.id}
        hasCheckInToday={Boolean(hasCheckInToday)}
        onClose={() => setQuickAddTarget(null)}
        onSaved={handleQuickAddSaved}
        onOpenFullCapture={(id) => {
          setQuickAddTarget(null);
          openVaciarCapture({ projectId: id ?? undefined });
        }}
      />

      <TaskMoveProjectModal
        visible={moveTaskTarget != null}
        taskTitle={moveTaskTarget?.content ?? ''}
        currentProjectId={isLoose ? null : projectId ?? null}
        projects={allProjects.map((entry) => ({
          id: entry.id,
          name: entry.name,
          color: entry.color,
        }))}
        onSelect={(nextProjectId) => void handleConfirmMoveProject(nextProjectId)}
        onClose={() => setMoveTaskTarget(null)}
      />

      {toastMessage ? (
        <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
      ) : null}

      <AreaNameEditSheet
        visible={showNewAreaSheet}
        title={t('areasCompact.newArea')}
        initialName=""
        initialEmoji="🌿"
        showEmoji
        onClose={() => setShowNewAreaSheet(false)}
        onSave={async (areaName, emoji) => {
          const result = await addCustomArea(areaName, emoji);
          if (result.ok && result.entry) {
            setEditProjectLifeAreaKey(makeCustomLifeAreaRef(result.entry.id));
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.calm.card,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    borderLeftWidth: 5,
    borderLeftColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.calm.mist,
  },
  backButton: {
    padding: THEME.spacing.xs,
    marginRight: THEME.spacing.xs,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerEditBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...THEME.typography.subheading,
    color: THEME.colors.text.main,
  },
  headerSubtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  metaSection: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
  },
  errorText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    padding: THEME.spacing.md,
  },
  empty: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    maxWidth: 300,
    lineHeight: 22,
  },
  emptyCta: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    minWidth: 200,
    ...THEME.shadows.soft,
  },
  fab: {
    position: 'absolute',
    right: THEME.spacing.md,
    borderRadius: 28,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyCtaText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.semantic.success + '18',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.semantic.success + '40',
  },
  completedBannerText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  completedBannerSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  looseRetentionNotice: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.sm,
  },
  looseRetentionNoticeText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  sectionLabel: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  sectionLabelFirst: {
    marginTop: 0,
  },
  looseTools: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  looseAreaBadge: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  looseEmptyFilter: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  headerSelectLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  looseBulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  looseBulkCount: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  looseBulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.semantic.danger,
    minHeight: THEME.sizes.touchTarget,
  },
  looseBulkDeleteBtnDisabled: {
    opacity: 0.45,
  },
  looseBulkDeleteText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.semantic.danger,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});
