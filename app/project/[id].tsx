import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import type { Task } from '@/components/tasks/TaskCard';
import { TaskList } from '@/components/tasks/TaskList';

export default function ProjectScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [project, setProject] = useState<{ name: string; color: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedDetailsTasks, setExpandedDetailsTasks] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const isLoose = projectId === 'sin-proyecto';

  const loadProjectAndTasks = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isLoose) {
        setProject({ name: 'Tareas sin proyecto', color: THEME.colors.text.tertiary });

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

        const { data: subtasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .not('parent_task_id', 'is', null)
          .order('created_at', { ascending: true });

        const tasksWithSubtasks = (tasksData ?? []).map((task: Task) => ({
          ...task,
          subtasks: (subtasksData ?? []).filter((st: Task) => st.parent_task_id === task.id),
        }));
        setTasks(tasksWithSubtasks);
      } else {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('name, color')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (projectError || !projectData) {
          setProject(null);
          setTasks([]);
          setLoading(false);
          return;
        }
        setProject({ name: projectData.name, color: projectData.color ?? THEME.colors.gradient.blue });

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('project_id', projectId)
          .is('parent_task_id', null)
          .order('is_priority', { ascending: false })
          .order('created_at', { ascending: true });

        if (tasksError) {
          setTasks([]);
          setLoading(false);
          return;
        }

        const { data: subtasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .not('parent_task_id', 'is', null)
          .order('created_at', { ascending: true });

        const tasksWithSubtasks = (tasksData ?? []).map((task: Task) => ({
          ...task,
          subtasks: (subtasksData ?? []).filter((st: Task) => st.parent_task_id === task.id),
        }));
        setTasks(tasksWithSubtasks);
      }
    } catch {
      setProject(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, projectId, isLoose]);

  useEffect(() => {
    loadProjectAndTasks();
  }, [loadProjectAndTasks]);

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

  const handleDeleteTask = useCallback(
    (task: Task) => {
      Alert.alert(
        'Eliminar tarea',
        `¿Eliminar "${task.content.length > 40 ? task.content.slice(0, 40) + '…' : task.content}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
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
    [loadProjectAndTasks]
  );

  if (!projectId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Proyecto no encontrado</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
        <Text style={styles.loadingText}>Cargando proyecto...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.errorText}>No se encontró este proyecto</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { borderLeftColor: project.color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Volver">
          <ChevronLeft size={24} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {allDone
              ? `Proyecto completado ✓ · ${completedTasks.length} ${completedTasks.length === 1 ? 'tarea' : 'tareas'}`
              : `${incompleteTasks.length} de ${tasks.length} pendientes`}
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {allDone && (
          <View style={styles.completedBanner}>
            <CheckCircle2 size={28} color={THEME.colors.semantic.success} />
            <Text style={styles.completedBannerText}>Proyecto completado</Text>
            <Text style={styles.completedBannerSub}>Todas las tareas con palomita ✓</Text>
          </View>
        )}

        {incompleteTasks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>Pendientes</Text>
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
              onEditTask={() => {}}
              onDeleteTask={handleDeleteTask}
              getCategoryColor={getCategoryColorCallback}
              onSubtaskToggle={() => {}}
              getProjectInfo={() => ({ label: project.name, color: project.color })}
              hideProjectLabel={true}
              sectionAccentColor={project.color}
            />
          </>
        )}

        {completedTasks.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Completadas ({completedTasks.length})</Text>
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
              onEditTask={() => {}}
              onDeleteTask={handleDeleteTask}
              getCategoryColor={getCategoryColorCallback}
              onSubtaskToggle={() => {}}
              getProjectInfo={() => ({ label: project.name, color: project.color })}
              hideProjectLabel={true}
              sectionAccentColor={project.color}
            />
          </>
        )}

        {tasks.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aún no hay tareas en este proyecto</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
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
    backgroundColor: THEME.colors.fill[200],
  },
  backButton: {
    padding: THEME.spacing.xs,
    marginRight: THEME.spacing.xs,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...THEME.typography.h3,
    fontSize: 18,
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
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
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
