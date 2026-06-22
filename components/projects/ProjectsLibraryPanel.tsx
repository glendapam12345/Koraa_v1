import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { ScrollView as ScrollViewType, View as RNView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { FolderKanban, ChevronRight, Plus, Heart } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { useI18n } from '@/contexts/I18nContext';
import { useProjectsLibrary } from '@/hooks/useProjectsLibrary';
import { ProjectLibraryCard } from '@/components/projects/ProjectLibraryCard';
import { ProjectsByAreaSection } from '@/components/projects/ProjectsByAreaSection';
import { AreasCompactPanel } from '@/components/projects/AreasCompactPanel';
import { AdaptiveExperienceProjectsCta } from '@/components/tasks/experience/AdaptiveExperienceProjectsCta';
import { ProjectCreateModal } from '@/components/projects/ProjectCreateModal';
import {
  ProjectQuickAddTaskModal,
  type ProjectQuickAddTarget,
} from '@/components/projects/ProjectQuickAddTaskModal';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { scrollChildIntoView } from '@/lib/scrollChildIntoView';

type ProjectsLibraryPanelProps = {
  userId: string | undefined;
  embedded?: boolean;
  /** Vista simplificada en tab Tareas → Áreas (sin banners ni filtros extra). */
  areasFirst?: boolean;
  /** Evita query duplicada de check-in cuando el padre ya la tiene (p. ej. tab Tareas). */
  hasCheckInToday?: boolean | null;
  /** Incrementar para forzar recarga (p. ej. tras brain dump). */
  refreshSignal?: number;
  /** Abrir con este proyecto expandido (p. ej. enlace desde Hoy). */
  expandProjectId?: string | null;
  parentScrollRef?: RefObject<ScrollViewType | null>;
  scrollContentRef?: RefObject<RNView | null>;
  onGoCapture?: () => void;
  /** Abre captura completa (categoría, pasos…) con proyecto preseleccionado. */
  onOpenFullCapture?: (projectId: string | null) => void;
  onProjectCreated?: (name: string) => void;
  onTaskSaved?: (message: string) => void;
};

type LibraryActionRowProps = {
  icon: ReactNode;
  title: string;
  hint: string;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'create' | 'task';
};

function LibraryActionRow({
  icon,
  title,
  hint,
  onPress,
  accessibilityLabel,
  variant = 'task',
}: LibraryActionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, variant === 'create' && styles.actionRowCreate]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.actionIcon, variant === 'create' && styles.actionIconCreate]}>{icon}</View>
      <View style={styles.actionTextWrap}>
        <Text style={styles.actionTitle}>{title}</Text>
        {hint ? <Text style={styles.actionHint}>{hint}</Text> : null}
      </View>
      <ChevronRight size={20} color={THEME.colors.calm.lavenderDeep} />
    </TouchableOpacity>
  );
}

export function ProjectsLibraryPanel({
  userId,
  embedded = false,
  areasFirst = false,
  hasCheckInToday: externalCheckInToday,
  expandProjectId = null,
  parentScrollRef,
  scrollContentRef,
  onGoCapture,
  onOpenFullCapture,
  onProjectCreated,
  onTaskSaved,
  refreshSignal,
}: ProjectsLibraryPanelProps) {
  const { t } = useI18n();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProjectAreaKey, setCreateProjectAreaKey] = useState<LifeAreaRef | undefined>(
    undefined,
  );
  const [quickAddTarget, setQuickAddTarget] = useState<ProjectQuickAddTarget | null>(null);
  const [projectFilter, setProjectFilter] = useState<'all' | 'withDate' | 'noDate'>('all');
  const projectCardRefs = useRef<Map<string, RNView>>(new Map());
  const {
    projects,
    looseCount,
    totalIncomplete,
    focusIncomplete,
    hasCheckInToday,
    loading,
    refreshing,
    refresh,
    reload,
  } = useProjectsLibrary(userId, { hasCheckInToday: externalCheckInToday });

  useFocusEffect(
    useCallback(() => {
      if (embedded) reload(true);
    }, [embedded, reload]),
  );

  useEffect(() => {
    if (embedded && refreshSignal != null && refreshSignal > 0) {
      void reload(true);
    }
  }, [embedded, refreshSignal, reload]);

  const filteredProjects = useMemo(() => {
    if (projectFilter === 'withDate') {
      return projects.filter((project) => Boolean(project.dueDate));
    }
    if (projectFilter === 'noDate') {
      return projects.filter((project) => !project.dueDate);
    }
    return projects;
  }, [projectFilter, projects]);

  const sortedProjects = useMemo(
    () =>
      [...filteredProjects].sort((a, b) => {
        if (b.incompleteCount !== a.incompleteCount) {
          return b.incompleteCount - a.incompleteCount;
        }
        return a.name.localeCompare(b.name);
      }),
    [filteredProjects],
  );

  const goCapture = useCallback(() => {
    if (embedded && onGoCapture) {
      onGoCapture();
      return;
    }
    router.push('/(tabs)/vaciar');
  }, [embedded, onGoCapture]);

  const openQuickAdd = useCallback(
    (projectId: string | null, lifeAreaRef?: LifeAreaRef) => {
      if (projectId == null) {
        setQuickAddTarget({ mode: 'loose', lifeAreaRef });
        return;
      }
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      setQuickAddTarget({
        mode: 'project',
        id: project.id,
        name: project.name,
        color: project.color,
      });
    },
    [projects],
  );

  const handleQuickAddSaved = useCallback(
    ({ title, projectName }: { title: string; projectName?: string }) => {
      reload(true);
      const message = projectName
        ? t('projects.quickAddSuccess', { title, name: projectName })
        : t('projects.quickAddSuccessLoose', { title });
      onTaskSaved?.(message);
    },
    [onTaskSaved, reload, t],
  );

  const openCreateProjectModal = useCallback((areaRef?: LifeAreaRef) => {
    setCreateProjectAreaKey(areaRef);
    setShowCreateModal(true);
  }, []);

  const scrollToExpandedProject = useCallback(() => {
    if (!expandProjectId || !parentScrollRef || !scrollContentRef) return;
    const target = projectCardRefs.current.get(expandProjectId);
    if (!target) return;
    scrollChildIntoView(parentScrollRef, scrollContentRef, target, THEME.spacing.md);
  }, [expandProjectId, parentScrollRef, scrollContentRef]);

  useEffect(() => {
    if (!areasFirst || !expandProjectId || loading) return;
    scrollToExpandedProject();
    const retrySoon = setTimeout(scrollToExpandedProject, 150);
    const retryAfterExpand = setTimeout(scrollToExpandedProject, 450);
    return () => {
      clearTimeout(retrySoon);
      clearTimeout(retryAfterExpand);
    };
  }, [areasFirst, expandProjectId, loading, sortedProjects, scrollToExpandedProject]);

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('projects.signIn')}</Text>
      </View>
    );
  }

  if (areasFirst) {
    const organizedContent =
      loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.loadingText}>{t('projects.loading')}</Text>
        </View>
      ) : projects.length === 0 && looseCount === 0 ? (
        <View style={[styles.empty, styles.emptyEmbedded]}>
          <LinearGradient
            colors={[THEME.colors.calm.mist, THEME.colors.calm.blush]}
            style={styles.emptyIconWrap}
          >
            <FolderKanban size={48} color={THEME.colors.calm.lavenderDeep} strokeWidth={1.5} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>{t('projects.organizedEmptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('projects.organizedEmptyBody')}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={goCapture}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.segmentGoCaptureA11y')}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonText}>{t('vaciar.segmentGoCapture')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <AreasCompactPanel
            userId={userId}
            projects={sortedProjects}
            looseCount={looseCount}
            loading={false}
            onAddTask={openQuickAdd}
            onCreateProject={openCreateProjectModal}
            onGoCapture={onGoCapture ? goCapture : undefined}
          />
        </>
      );

    return (
      <View style={styles.embeddedWrap}>
        {organizedContent}
        <ProjectCreateModal
          visible={showCreateModal}
          userId={userId}
          initialLifeAreaKey={createProjectAreaKey}
          onClose={() => {
            setShowCreateModal(false);
            setCreateProjectAreaKey(undefined);
          }}
          onCreated={(project) => {
            void reload();
            onProjectCreated?.(project.name);
          }}
          existingNames={projects.map((p) => p.name)}
        />
        <ProjectQuickAddTaskModal
          visible={quickAddTarget != null}
          target={quickAddTarget}
          hasCheckInToday={Boolean(hasCheckInToday)}
          onClose={() => setQuickAddTarget(null)}
          onSaved={handleQuickAddSaved}
          onOpenFullCapture={onOpenFullCapture}
        />
      </View>
    );
  }

  const body =
    loading ? (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.loadingText}>{t('projects.loading')}</Text>
      </View>
    ) : projects.length === 0 && looseCount === 0 && !areasFirst ? (
      <View style={[styles.empty, embedded && styles.emptyEmbedded]}>
        <LinearGradient
          colors={[THEME.colors.calm.mist, THEME.colors.calm.blush]}
          style={styles.emptyIconWrap}
        >
          <FolderKanban size={48} color={THEME.colors.calm.lavenderDeep} strokeWidth={1.5} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>{t('projects.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('projects.emptyBody')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('projects.createProjectA11y')}
        >
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>{t('projects.createProjectCta')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryEmptyBtn}
          onPress={goCapture}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            embedded ? t('vaciar.segmentGoCaptureA11y') : t('projects.goTasksA11y')
          }
        >
          <Text style={styles.secondaryEmptyBtnText}>
            {embedded ? t('vaciar.segmentGoCapture') : t('projects.goTasks')}
          </Text>
        </TouchableOpacity>
        {!embedded ? (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel={t('projects.back')}
          >
            <Text style={styles.backLinkText}>{t('projects.back')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ) : (
      <>
        {embedded && onGoCapture && !areasFirst ? (
          <AdaptiveExperienceProjectsCta onOpenCapture={onGoCapture} />
        ) : null}

        {!areasFirst && !loading && totalIncomplete > 0 ? (
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
                <ChevronRight size={16} color={THEME.colors.calm.lavenderDeep} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.actionsCard, areasFirst && styles.actionsCardCompact]}>
          {!areasFirst ? (
            <Text style={styles.actionsCardLabel}>{t('projects.libraryActionsTitle')}</Text>
          ) : null}
          <LibraryActionRow
            variant="create"
            icon={<Plus size={22} color={THEME.colors.calm.lavenderDeep} strokeWidth={2.2} />}
            title={t('projects.createProjectCta')}
            hint={areasFirst ? '' : t('projects.createProjectHint')}
            onPress={() => openCreateProjectModal()}
            accessibilityLabel={t('projects.createProjectA11y')}
          />
          <View style={styles.actionDivider} />
          <LibraryActionRow
            icon={<Plus size={22} color={THEME.colors.gradient.pink} strokeWidth={2.2} />}
            title={t('projects.addTaskCta')}
            hint={areasFirst ? '' : t('projects.addHint')}
            onPress={() => openQuickAdd(null)}
            accessibilityLabel={t('projects.addA11y')}
          />
          {areasFirst ? (
            <Text style={styles.areasHint}>{t('projects.areasHint')}</Text>
          ) : null}
        </View>

        {looseCount > 0 ? (
          <View style={styles.listSection}>
            <Text style={styles.sectionLabel}>{t('projects.looseSection')}</Text>
            <ProjectLibraryCard
              mode="loose"
              looseCount={looseCount}
              userId={userId}
              onAddTask={openQuickAdd}
            />
          </View>
        ) : null}

        {projects.length > 0 || areasFirst ? (
          <View style={styles.listSection}>
            {!areasFirst ? (
              <View style={styles.filterRow}>
                {(['all', 'withDate', 'noDate'] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterPill,
                      projectFilter === filter && styles.filterPillActive,
                    ]}
                    onPress={() => setProjectFilter(filter)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected: projectFilter === filter }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        projectFilter === filter && styles.filterPillTextActive,
                      ]}
                    >
                      {t(`projects.filter.${filter}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {!areasFirst && looseCount > 0 ? (
              <Text style={styles.sectionLabel}>{t('projectsUi.sectionTitle')}</Text>
            ) : null}
            {areasFirst || projectFilter === 'all' ? (
              <ProjectsByAreaSection
                projects={filteredProjects}
                userId={userId}
                onAddTask={openQuickAdd}
                onCreateProjectInArea={(areaKey) => openCreateProjectModal(areaKey)}
                onEditAreas={goCapture}
                hideExplainer={areasFirst}
                showAllAreas={areasFirst}
              />
            ) : (
              filteredProjects.map((project) => (
                <ProjectLibraryCard
                  key={project.id}
                  mode="project"
                  project={project}
                  userId={userId}
                  onAddTask={openQuickAdd}
                />
              ))
            )}
          </View>
        ) : null}
      </>
    );

  if (embedded) {
    return (
      <View style={styles.embeddedWrap}>
        {body}
        <ProjectCreateModal
          visible={showCreateModal}
          userId={userId}
          initialLifeAreaKey={createProjectAreaKey}
          onClose={() => {
            setShowCreateModal(false);
            setCreateProjectAreaKey(undefined);
          }}
          onCreated={(project) => {
            void reload();
            onProjectCreated?.(project.name);
          }}
          existingNames={projects.map((p) => p.name)}
        />
        <ProjectQuickAddTaskModal
          visible={quickAddTarget != null}
          target={quickAddTarget}
          hasCheckInToday={Boolean(hasCheckInToday)}
          onClose={() => setQuickAddTarget(null)}
          onSaved={handleQuickAddSaved}
          onOpenFullCapture={onOpenFullCapture}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={THEME.colors.calm.lavenderDeep}
          />
        }
      >
        {body}
      </ScrollView>
      <ProjectCreateModal
        visible={showCreateModal}
        userId={userId}
        initialLifeAreaKey={createProjectAreaKey}
        onClose={() => {
          setShowCreateModal(false);
          setCreateProjectAreaKey(undefined);
        }}
        onCreated={(project) => {
          void reload();
          onProjectCreated?.(project.name);
        }}
        existingNames={projects.map((p) => p.name)}
      />
      <ProjectQuickAddTaskModal
        visible={quickAddTarget != null}
        target={quickAddTarget}
        hasCheckInToday={Boolean(hasCheckInToday)}
        onClose={() => setQuickAddTarget(null)}
        onSaved={handleQuickAddSaved}
        onOpenFullCapture={onOpenFullCapture}
      />
    </>
  );
}

const styles = StyleSheet.create({
  embeddedWrap: {
    width: '100%',
    gap: THEME.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  inventoryBanner: {
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
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
    borderTopColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  inventoryFeelText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  actionsCard: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  actionsCardCompact: {
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  actionsCardLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  actionRowCreate: {
    paddingVertical: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCreate: {
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  actionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  actionHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  actionDivider: {
    height: 1,
    backgroundColor: THEME.colors.calm.border,
    marginVertical: 2,
  },
  areasHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
  listSection: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  filterPill: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  filterPillText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
  filterPillTextActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyEmbedded: {
    ...THEME.surfaces.elevated,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    overflow: 'hidden',
  },
  emptyTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
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
    marginTop: THEME.spacing.lg,
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
  secondaryEmptyBtn: {
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
  },
  secondaryEmptyBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  backLink: {
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
  },
  backLinkText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  organizedCaptureLink: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  organizedCaptureText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
});
