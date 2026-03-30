import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FolderKanban, ChevronRight, ChevronLeft, Calendar, List, CheckCircle2, Plus } from 'lucide-react-native';
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
  const [looseCount, setLooseCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjectsWithStats = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLooseCount(0);
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
        .is('parent_task_id', null);

      let loose = 0;
      if (!tasksError && tasksData) {
        for (const t of tasksData) {
          const pid = t.project_id as string | null;
          if (pid == null) {
            if (!t.is_completed) loose += 1;
            continue;
          }
          if (!byProject[pid]) continue;
          byProject[pid].total += 1;
          if (!t.is_completed) byProject[pid].incomplete += 1;
          if (t.scheduled_date) byProject[pid].withDate += 1;
        }
      }
      setLooseCount(loose);

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
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Mis proyectos</Text>
            <Text style={styles.headerSubtitle}>Tareas y proyectos en un solo lugar</Text>
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
        ) : projects.length === 0 && looseCount === 0 ? (
          <View style={styles.empty}>
            <LinearGradient
              colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.tint.pink.soft]}
              style={styles.emptyIconWrap}
            >
              <FolderKanban size={48} color={THEME.colors.gradient.blue} strokeWidth={1.5} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Aún no tienes proyectos</Text>
            <Text style={styles.emptyText}>
              Crea proyectos desde Tareas: al agregar una tarea elige «Sí» a asignar a proyecto y crea uno nuevo.
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.8}
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
          <>
            <TouchableOpacity
              style={styles.addProjectSection}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Agregar proyecto o tarea, ir a Vaciar"
            >
              <View style={styles.addProjectIconWrap}>
                <Plus size={22} color={THEME.colors.gradient.blue} strokeWidth={2.2} />
              </View>
              <View style={styles.addProjectTextWrap}>
                <Text style={styles.addProjectTitle}>Agregar proyectos o tareas</Text>
                <Text style={styles.addProjectHint}>
                  En Vaciar escribe una tarea y asigna proyecto (o crea uno nuevo) para verlo aquí.
                </Text>
              </View>
              <ChevronRight size={20} color={THEME.colors.gradient.blue} />
            </TouchableOpacity>

            {looseCount > 0 ? (
              <View style={styles.looseSection}>
                {projects.length > 0 && (
                  <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionLabelLine} />
                    <Text style={styles.sectionLabel}>Tareas sueltas</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cardLoose}
                  onPress={() => router.push('/project/sin-proyecto')}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={`Tareas sin proyecto, ${looseCount} pendientes`}
                >
                  <LinearGradient
                    colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.tint.pink.soft]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.cardLooseGradient}
                  />
                  <View style={[styles.colorBarLoose, { backgroundColor: THEME.colors.text.tertiary }]} />
                  <View style={styles.cardLooseIconWrap}>
                    <List size={22} color={THEME.colors.gradient.blue} strokeWidth={1.8} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardLooseTitle} numberOfLines={1}>
                      Tareas sin proyecto
                    </Text>
                    <Text style={styles.cardLooseHint}>
                      No asignadas a ningún proyecto
                    </Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardLooseMeta}>
                        {looseCount} {looseCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={22} color={THEME.colors.text.tertiary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ) : null}
            {projects.length > 0 ? (
              <>
                {looseCount > 0 && (
                  <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionLabelLine} />
                    <Text style={styles.sectionLabel}>Proyectos</Text>
                  </View>
                )}
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.card}
                    onPress={() => router.push(`/project/${project.id}`)}
                    activeOpacity={0.88}
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
                        {project.incompleteCount === 0 && project.taskCount > 0 ? (
                          <View style={styles.cardMetaRow}>
                            <CheckCircle2 size={14} color={THEME.colors.semantic.success} />
                            <Text style={styles.cardMetaTextDone}>
                              Completado · {project.taskCount} {project.taskCount === 1 ? 'tarea' : 'tareas'}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.cardMetaText}>
                            {project.taskCount === 0
                              ? 'Sin tareas'
                              : `${project.incompleteCount} ${project.incompleteCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}`}
                          </Text>
                        )}
                        {project.withDateCount > 0 && (
                          <View style={styles.dateBadge}>
                            <Calendar size={14} color={THEME.colors.text.secondary} strokeWidth={1.8} />
                            <Text style={styles.dateBadgeText}>
                              {project.withDateCount} con fecha
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={22} color={THEME.colors.text.tertiary} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </>
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
    paddingTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
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
    fontSize: 22,
    color: THEME.colors.text.main,
  },
  headerSubtitle: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md + 4,
    paddingBottom: THEME.spacing.xl + THEME.spacing.sm,
  },
  addProjectSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    marginBottom: THEME.spacing.md + 4,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  addProjectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProjectTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  addProjectTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  addProjectHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md + 4,
    overflow: 'hidden',
  },
  emptyTitle: {
    ...THEME.typography.h3,
    fontSize: 22,
    color: THEME.colors.text.main,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...THEME.typography.body,
    fontSize: 15,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: THEME.spacing.sm,
  },
  addButton: {
    marginTop: THEME.spacing.xl + 4,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  addButtonGradient: {
    paddingVertical: THEME.spacing.sm + 6,
    paddingHorizontal: THEME.spacing.xl + 8,
  },
  addButtonText: {
    ...THEME.typography.body,
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  backLink: {
    marginTop: THEME.spacing.md + 4,
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
    marginBottom: THEME.spacing.sm + 4,
    paddingVertical: THEME.spacing.md + 2,
    paddingRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.card,
  },
  looseSection: {
    marginBottom: THEME.spacing.md + 4,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs + 2,
    gap: THEME.spacing.xs,
  },
  sectionLabelLine: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: THEME.colors.gradient.blue,
    opacity: 0.6,
  },
  sectionLabel: {
    ...THEME.typography.small,
    fontSize: 13,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    letterSpacing: 0.3,
  },
  cardLoose: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md + 4,
    paddingRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  cardLooseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  colorBarLoose: {
    width: 4,
    height: '100%',
    minHeight: 56,
    borderTopLeftRadius: THEME.borderRadius.standard,
    borderBottomLeftRadius: THEME.borderRadius.standard,
    marginRight: THEME.spacing.sm,
  },
  cardLooseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.standard + 2,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
    ...THEME.shadows.card,
  },
  cardLooseTitle: {
    ...THEME.typography.body,
    fontSize: 17,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  cardLooseHint: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.tertiary,
    marginTop: 4,
  },
  cardLooseMeta: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  colorBar: {
    width: 5,
    height: '100%',
    minHeight: 48,
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
    fontSize: 17,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: 6,
  },
  cardMetaText: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaTextDone: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.semantic.success,
    fontFamily: THEME.fonts.heading.medium,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
});
