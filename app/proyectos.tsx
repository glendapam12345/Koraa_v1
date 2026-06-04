import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FolderKanban, ChevronRight, ChevronLeft, Calendar, List, CheckCircle2, Plus, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { useI18n } from '@/contexts/I18nContext';
import { getLocalDateString } from '@/lib/dateLocal';

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
  const { t } = useI18n();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [looseCount, setLooseCount] = useState<number>(0);
  const [totalIncomplete, setTotalIncomplete] = useState(0);
  const [focusIncomplete, setFocusIncomplete] = useState(0);
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjectsWithStats = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLooseCount(0);
      setTotalIncomplete(0);
      setFocusIncomplete(0);
      setHasCheckInToday(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const today = getLocalDateString();
      const { data: checkInData } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      setHasCheckInToday(!!checkInData);

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
        .select('project_id, is_completed, scheduled_date, is_priority')
        .eq('user_id', user.id)
        .is('parent_task_id', null);

      let loose = 0;
      let totalInc = 0;
      let focusInc = 0;
      if (!tasksError && tasksData) {
        for (const task of tasksData) {
          const pid = task.project_id as string | null;
          if (!task.is_completed) {
            totalInc += 1;
            if (task.is_priority) focusInc += 1;
          }
          if (pid == null) {
            if (!task.is_completed) loose += 1;
            continue;
          }
          if (!byProject[pid]) continue;
          byProject[pid].total += 1;
          if (!task.is_completed) byProject[pid].incomplete += 1;
          if (task.scheduled_date) byProject[pid].withDate += 1;
        }
      }
      setLooseCount(loose);
      setTotalIncomplete(totalInc);
      setFocusIncomplete(focusInc);

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
        <Text style={styles.emptyText}>{t('projects.signIn')}</Text>
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
            accessibilityLabel={t('projects.back')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{t('projects.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('projects.subtitle')}</Text>
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
            <Text style={styles.loadingText}>{t('projects.loading')}</Text>
          </View>
        ) : projects.length === 0 && looseCount === 0 ? (
          <View style={styles.empty}>
            <LinearGradient
              colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.tint.pink.soft]}
              style={styles.emptyIconWrap}
            >
              <FolderKanban size={48} color={THEME.colors.gradient.blue} strokeWidth={1.5} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>{t('projects.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('projects.emptyBody')}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('projects.goTasksA11y')}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>{t('projects.goTasks')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityLabel={t('projects.back')}
            >
              <Text style={styles.backLinkText}>{t('projects.back')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {!loading && totalIncomplete > 0 ? (
              <View style={styles.inventoryBanner}>
                <Text style={styles.inventorySummary}>
                  {hasCheckInToday
                    ? focusIncomplete > 0
                      ? t('projects.inventorySummary', { total: totalIncomplete, focus: focusIncomplete })
                      : t('projects.inventoryCheckInNoFocus', { total: totalIncomplete })
                    : t('projects.inventoryNoFocus', { total: totalIncomplete })}
                </Text>
                <Text style={styles.inventorySub}>{t('projects.inventorySub')}</Text>
                {!hasCheckInToday ? (
                  <TouchableOpacity
                    style={styles.inventoryFeelBtn}
                    onPress={() => router.push(CHECK_IN_ROUTE)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('projects.inventoryGoFeelA11y')}
                  >
                    <Heart size={16} color={THEME.colors.gradient.pink} />
                    <Text style={styles.inventoryFeelText}>{t('projects.inventoryGoFeel')}</Text>
                    <ChevronRight size={16} color={THEME.colors.gradient.blue} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.addProjectSection}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={t('projects.addA11y')}
            >
              <View style={styles.addProjectIconWrap}>
                <Plus size={22} color={THEME.colors.gradient.blue} strokeWidth={2.2} />
              </View>
              <View style={styles.addProjectTextWrap}>
                <Text style={styles.addProjectTitle}>{t('projects.addSection')}</Text>
                <Text style={styles.addProjectHint}>{t('projects.addHint')}</Text>
              </View>
              <ChevronRight size={20} color={THEME.colors.gradient.blue} />
            </TouchableOpacity>

            {looseCount > 0 ? (
              <View style={styles.looseSection}>
                {projects.length > 0 && (
                  <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionLabelLine} />
                    <Text style={styles.sectionLabel}>{t('projects.looseSection')}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cardLoose}
                  onPress={() => router.push('/project/sin-proyecto')}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={t('projectsUi.a11yLooseCard', { count: looseCount })}
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
                      {t('projectsUi.looseTitle')}
                    </Text>
                    <Text style={styles.cardLooseHint}>{t('projectsUi.looseHint')}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardLooseMeta}>
                        {looseCount === 1
                          ? t('projectsUi.pendingOne', { count: looseCount })
                          : t('projectsUi.pendingMany', { count: looseCount })}
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
                    <Text style={styles.sectionLabel}>{t('projectsUi.sectionTitle')}</Text>
                  </View>
                )}
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.card}
                    onPress={() => router.push(`/project/${project.id}`)}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={t('projectsUi.a11yProjectCard', {
                      name: project.name,
                      count: project.incompleteCount,
                    })}
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
                              {t('projectsUi.completed', {
                                count: project.taskCount,
                                tasks:
                                  project.taskCount === 1
                                    ? t('components.task')
                                    : t('components.tasks'),
                              })}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.cardMetaText}>
                            {project.taskCount === 0
                              ? t('projectsUi.noTasks')
                              : project.incompleteCount === 1
                                ? t('projectsUi.pendingOne', { count: project.incompleteCount })
                                : t('projectsUi.pendingMany', { count: project.incompleteCount })}
                          </Text>
                        )}
                        {project.withDateCount > 0 && (
                          <View style={styles.dateBadge}>
                            <Calendar size={14} color={THEME.colors.text.secondary} strokeWidth={1.8} />
                            <Text style={styles.dateBadgeText}>
                              {t('projectsUi.withDate', { count: project.withDateCount })}
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
  inventoryBanner: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  inventorySummary: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  inventorySub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    lineHeight: 20,
  },
  inventoryFeelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
  },
  inventoryFeelText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
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
