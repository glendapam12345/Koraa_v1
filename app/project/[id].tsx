import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft } from 'lucide-react-native';
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

  const loadProjectAndTasks = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
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
    } catch {
      setProject(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    loadProjectAndTasks();
  }, [loadProjectAndTasks]);

  const incompleteTasks = tasks.filter((t) => !t.is_completed);
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
          <Text style={styles.headerTitle}>Proyecto: {project.name}</Text>
          <Text style={styles.headerSubtitle}>
            {incompleteTasks.length} {incompleteTasks.length === 1 ? 'tarea' : 'tareas'} pendientes
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {incompleteTasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay tareas pendientes en este proyecto</Text>
          </View>
        ) : (
          <TaskList
            tasks={tasks}
            incompleteTasks={incompleteTasks}
            expandedTasks={expandedTasks}
            expandedDetailsTasks={expandedDetailsTasks}
            menuOpen={menuOpen}
            onToggleTask={async () => {}}
            onToggleExpansion={toggleExpansion}
            onToggleDetailsExpansion={toggleDetailsExpansion}
            onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
            onEditTask={() => {}}
            onDeleteTask={() => {}}
            getCategoryColor={getCategoryColorCallback}
            onSubtaskToggle={() => {}}
            getProjectInfo={() => ({ label: `Proyecto: ${project.name}`, color: project.color })}
            hideProjectLabel={true}
            sectionAccentColor={project.color}
          />
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
});
