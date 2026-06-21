import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, CheckCircle2, Plus, Pencil } from 'lucide-react-native';
import type { Task } from '@/components/tasks/TaskCard';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { ProjectEditModal } from '@/components/projects/ProjectEditModal';
import { ProjectMetaRow } from '@/components/projects/ProjectMetaRow';
import { ProjectFocusCta } from '@/components/projects/ProjectFocusCta';
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
  type LifeAreaKey,
} from '@/lib/lifeAreas/lifeAreaCatalog';

export default function ProjectScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const [project, setProject] = useState<{
    name: string;
    color: string;
    dueDate: string | null;
    lifeAreaKey: LifeAreaKey;
  } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedDetailsTasks, setExpandedDetailsTasks] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editingProject, setEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectColor, setEditProjectColor] = useState<string>(THEME.colors.gradient.blue);
  const [editProjectDueDate, setEditProjectDueDate] = useState('');
  const [editProjectLifeAreaKey, setEditProjectLifeAreaKey] = useState<LifeAreaKey>('other');
  const [savingProject, setSavingProject] = useState(false);
  const [quickAddTarget, setQuickAddTarget] = useState<ProjectQuickAddTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [moveTaskTarget, setMoveTaskTarget] = useState<Task | null>(null);
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
        setProject({ name: t('projectDetail.looseName'), color: THEME.colors.text.tertiary, dueDate: null, lifeAreaKey: 'personal' });

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
      setQuickAddTarget({ mode: 'loose' });
      return;
    }
    if (!project || !projectId) return;
    setQuickAddTarget({
      mode: 'project',
      id: projectId,
      name: project.name,
      color: project.color,
    });
  }, [isLoose, project, projectId]);

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

  const getCategoryColorCallback = useCallback((category: string) => {
    const key = category.toLowerCase();
    return THEME.colors.category[key as keyof typeof THEME.colors.category] ?? THEME.colors.text.secondary;
  }, []);

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
      const { error } = await supabase
        .from('projects')
        .update({
          name: editProjectName.trim(),
          color: editProjectColor,
          due_date: dueDate,
          life_area_key: editProjectLifeAreaKey,
        })
        .eq('id', projectId);
      if (!error) {
        setEditingProject(false);
        loadProjectAndTasks();
      }
    } finally {
      setSavingProject(false);
    }
  }, [editProjectColor, editProjectDueDate, editProjectLifeAreaKey, editProjectName, isLoose, loadProjectAndTasks, projectId]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setEditContent(task.content);
    setMenuOpen(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingTask || !editContent.trim()) return;
    const { error } = await supabase
      .from('tasks')
      .update({ content: editContent.trim() })
      .eq('id', editingTask.id);
    if (!error) {
      setEditingTask(null);
      loadProjectAndTasks();
    }
  }, [editContent, editingTask, loadProjectAndTasks]);

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
        ]
      );
    },
    [loadProjectAndTasks, t]
  );

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
                  pending: incompleteTasks.length,
                  total: tasks.length,
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
        ) : null}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {allDone && (
          <View style={styles.completedBanner}>
            <CheckCircle2 size={28} color={THEME.colors.semantic.success} />
            <Text style={styles.completedBannerText}>{t('projectDetail.completedBanner')}</Text>
            <Text style={styles.completedBannerSub}>{t('projectDetail.completedBannerSub')}</Text>
          </View>
        )}

        {!isLoose && user ? (
          <View style={styles.metaSection}>
            <ProjectMetaRow
              taskCount={tasks.length}
              incompleteCount={incompleteTasks.length}
              dueDate={project.dueDate}
              accentColor={project.color}
            />
            <ProjectFocusCta
              userId={user.id}
              projectId={projectId}
              projectName={project.name}
              incompleteCount={incompleteTasks.length}
              onFocused={loadProjectAndTasks}
            />
          </View>
        ) : null}

        {incompleteTasks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>{t('projectDetail.pendingSection')}</Text>
            <TaskList
              tasks={tasks}
              incompleteTasks={incompleteTasks}
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
              getProjectInfo={() => ({ label: project.name, color: project.color })}
              hideProjectLabel={true}
              sectionAccentColor={project.color}
              {...replanProps}
            />
          </>
        )}

        {completedTasks.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              {t('projectDetail.completedSection', { count: completedTasks.length })}
            </Text>
            <TaskList
              tasks={tasks}
              incompleteTasks={completedTasks}
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
              getProjectInfo={() => ({ label: project.name, color: project.color })}
              hideProjectLabel={true}
              sectionAccentColor={project.color}
              {...replanProps}
            />
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

      <TaskEditModal
        visible={editingTask != null}
        content={editContent}
        onContentChange={setEditContent}
        onSave={() => void handleSaveEdit()}
        onClose={() => setEditingTask(null)}
      />

      {!isLoose ? (
        <ProjectEditModal
          visible={editingProject}
          name={editProjectName}
          color={editProjectColor}
          dueDate={editProjectDueDate}
          lifeAreaKey={editProjectLifeAreaKey}
          onNameChange={setEditProjectName}
          onColorChange={setEditProjectColor}
          onDueDateChange={setEditProjectDueDate}
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
        hasCheckInToday={Boolean(hasCheckInToday)}
        onClose={() => setQuickAddTarget(null)}
        onSaved={handleQuickAddSaved}
        onOpenFullCapture={(id) => {
          setQuickAddTarget(null);
          router.push({
            pathname: '/(tabs)/vaciar',
            params: id ? { projectId: id, segment: 'capture' } : { segment: 'capture' },
          });
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
});
