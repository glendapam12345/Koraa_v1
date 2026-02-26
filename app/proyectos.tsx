import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FolderKanban, ChevronRight, ChevronLeft, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectWithStats extends Project {
  taskCount: number;
  incompleteCount: number;
  withDateCount: number;
}

export default function ProyectosScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjectsWithStats = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (projectsError) {
        setProjects([]);
        return;
      }

      const list = (projectsData || []) as Project[];
      const byProject: Record<string, { total: number; incomplete: number; withDate: number }> = {};
      for (const p of list) {
        byProject[p.id] = { total: 0, incomplete: 0, withDate: 0 };
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('project_id, is_completed, scheduled_date')
        .eq('user_id', user.id)
        .not('project_id', 'is', null);

      if (!tasksError && tasksData) {
        for (const t of tasksData) {
          const pid = t.project_id as string;
          if (!byProject[pid]) continue;
          byProject[pid].total += 1;
          if (!t.is_completed) byProject[pid].incomplete += 1;
          if (t.scheduled_date) byProject[pid].withDate += 1;
        }
      }

      const withStats: ProjectWithStats[] = list.map((p) => ({
        ...p,
        taskCount: byProject[p.id]?.total ?? 0,
        incompleteCount: byProject[p.id]?.incomplete ?? 0,
        withDateCount: byProject[p.id]?.withDate ?? 0,
      }));
      setProjects(withStats);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjectsWithStats();
  }, [loadProjectsWithStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProjectsWithStats();
  }, [loadProjectsWithStats]);

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Inicia sesión para ver tus proyectos</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={THEME.colors.gradientTint.header}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Volver"
          >
            <ChevronLeft size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Mis proyectos</Text>
            <Text style={styles.headerSubtitle}>Tareas organizadas por proyecto</Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.gradient.blue}
          />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            <Text style={styles.loadingText}>Cargando proyectos…</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <FolderKanban size={56} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.emptyTitle}>Aún no tienes proyectos</Text>
            <Text style={styles.emptyText}>
              Crea proyectos al agregar una tarea en Tareas: toca el selector de proyecto y elige «Crear nuevo proyecto».
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Ir a Tareas para agregar"
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>Ir a Tareas</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityLabel="Volver"
            >
              <Text style={styles.backLinkText}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.card}
              onPress={() => router.push(`/project/${project.id}`)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Proyecto ${project.name}, ${project.incompleteCount} tareas pendientes`}
            >
              <View
                style={[styles.colorBar, { backgroundColor: project.color || THEME.colors.gradient.blue }]}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {project.name}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>
                    {project.incompleteCount === 0
                      ? project.taskCount === 0
                        ? 'Sin tareas'
                        : `${project.taskCount} ${project.taskCount === 1 ? 'tarea' : 'tareas'} (todas hechas)`
                      : `${project.incompleteCount} ${project.incompleteCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}`}
                  </Text>
                  {project.withDateCount > 0 && (
                    <View style={styles.dateBadge}>
                      <Calendar size={14} color={THEME.colors.text.secondary} />
                      <Text style={styles.dateBadgeText}>
                        {project.withDateCount} con fecha
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={22} color={THEME.colors.text.tertiary} />
            </TouchableOpacity>
          ))
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
    padding: THEME.spacing.xl,
  },
  headerGradient: {
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
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
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 1.5,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: THEME.spacing.sm,
  },
  addButton: {
    marginTop: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  addButtonGradient: {
    paddingVertical: THEME.spacing.sm + 4,
    paddingHorizontal: THEME.spacing.xl,
  },
  addButtonText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  backLink: {
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
  },
  backLinkText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  colorBar: {
    width: 6,
    height: '100%',
    minHeight: 44,
    borderTopLeftRadius: THEME.borderRadius.standard,
    borderBottomLeftRadius: THEME.borderRadius.standard,
    marginRight: THEME.spacing.sm,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: 4,
  },
  cardMetaText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
});
