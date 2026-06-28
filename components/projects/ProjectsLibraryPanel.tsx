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
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { FolderKanban, ChevronRight, Plus, Heart, CalendarRange } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { useI18n } from '@/contexts/I18nContext';
import { useProjectsLibrary } from '@/hooks/useProjectsLibrary';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { hasPersonalizedLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
import { ProjectLibraryCard } from '@/components/projects/ProjectLibraryCard';
import { ProjectsByAreaSection } from '@/components/projects/ProjectsByAreaSection';
import { AreasCompactPanel } from '@/components/projects/AreasCompactPanel';
import { AdaptiveExperienceProjectsCta } from '@/components/tasks/experience/AdaptiveExperienceProjectsCta';
import { RedistributeWorkloadModal } from '@/components/tasks/RedistributeWorkloadModal';
import type { Task } from '@/hooks/useTasks';
import {
  fetchRedistributeContext,
  type RedistributeCheckInSnapshot,
} from '@/lib/projects/fetchRedistributeContext';
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
  const [redistributeOpen, setRedistributeOpen] = useState(false);
  const [redistributeTasks, setRedistributeTasks] = useState<Task[]>([]);
  const [redistributeCheckIn, setRedistributeCheckIn] = useState<RedistributeCheckInSnapshot>({
    energyLevel: 0,
    availableTime: '',
    emotion: '',
  });
  const projectCardRefs = useRef<Map<string, RNView>>(new Map());
  const lastRefreshSignalRef = useRef(refreshSignal ?? 0);
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

  const { config: lifeAreasConfig, loading: lifeAreasLoading } = useUserLifeAreas(userId);

  const hasOrganizedAreas = useMemo(
    () => hasPersonalizedLifeAreasConfig(lifeAreasConfig),
    [lifeAreasConfig],
  );

  const showOrganizedLibraryEmpty = projects.length === 0 && looseCount === 0 && !hasOrganizedAreas;

  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useFocusEffect(
    useCallback(() => {
      if (embedded) void reloadRef.current(true);
    }, [embedded]),
  );

  useEffect(() => {
    if (!embedded || refreshSignal == null || refreshSignal <= 0) return;
    if (refreshSignal === lastRefreshSignalRef.current) return;
    lastRefreshSignalRef.current = refreshSignal;
    void reloadRef.current(true);
  }, [embedded, refreshSignal]);

  const handleLibraryChanged = useCallback(() => {
    void reloadRef.current(true);
  }, []);

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
    openVaciarCapture();
  }, [embedded, onGoCapture]);

  const openRedistribute = useCallback(async () => {
    if (!userId) return;
    const context = await fetchRedistributeContext(userId);
    setRedistributeTasks(context.tasks);
    setRedistributeCheckIn(context.checkIn);
    setRedistributeOpen(true);
  }, [userId]);

  const handleRedistributeApplied = useCallback(() => {
    setRedistributeOpen(false);
    void reload();
    onTaskSaved?.(t('projects.redistributeApplied'));
  }, [onTaskSaved, reload, t]);

  const redistributeModal =
    userId != null ? (
      <RedistributeWorkloadModal
        visible={redistributeOpen}
        onClose={() => setRedistributeOpen(false)}
        userId={userId}
        tasks={redistributeTasks}
        energyLevel={redistributeCheckIn.energyLevel}
        availableTime={redistributeCheckIn.availableTime}
        emotion={redistributeCheckIn.emotion}
        onApplied={handleRedistributeApplied}
      />
    ) : null;

  const openQuickAdd = useCallback(
    (
      projectId: string | null,
      lifeAreaRef?: LifeAreaRef,
      areaContext?: { label: string; emoji: string },
      initialContent?: string,
    ) => {
      if (projectId == null) {
        setQuickAddTarget({
          mode: 'loose',
          lifeAreaRef,
          areaLabel: areaContext?.label,
          areaEmoji: areaContext?.emoji,
          initialContent,
        });
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

  const openLoosePlanQuickAdd = useCallback(
    (content: string) => {
      openQuickAdd(null, undefined, undefined, content);
    },
    [openQuickAdd],
  );

  const handleQuickAddSaved = useCallback(
    ({ title, projectName, dayLabel }: { title: string; projectName?: string; dayLabel?: string }) => {
      reload(true);
      const message = dayLabel
        ? t('semana.quickAddDaySuccess', { title, day: dayLabel })
        : projectName
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
      loading || lifeAreasLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.loadingText}>{t('projects.loading')}</Text>
        </View>
      ) : showOrganizedLibraryEmpty ? (
        <CalmCard style={[styles.empty, styles.emptyEmbedded]}>
          <LinearGradient
            colors={[THEME.colors.calm.mist, THEME.colors.calm.blush]}
            style={styles.emptyIconWrap}
          >
            <FolderKanban size={48} color={THEME.colors.calm.lavenderDeep} strokeWidth={1.5} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>{t('projects.organizedEmptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('projects.organizedEmptyBody')}</Text>
          <CalmPrimaryButton
            label={t('vaciar.segmentGoCapture')}
            onPress={goCapture}
            large
            accessibilityLabel={t('vaciar.segmentGoCaptureA11y')}
            style={styles.emptyPrimaryCta}
          />
        </CalmCard>
      ) : (
        <>
          {totalIncomplete > 0 ? (
            <CalmCard style={styles.actionsCardCompactOnly}>
              <LibraryActionRow
                icon={
                  <CalendarRange
                    size={22}
                    color={THEME.colors.calm.lavenderDeep}
                    strokeWidth={2.2}
                  />
                }
                title={t('projects.redistributeCta')}
                hint={t('projects.redistributeHint')}
                onPress={() => void openRedistribute()}
                accessibilityLabel={t('hoy.redistributeA11y')}
              />
            </CalmCard>
          ) : null}
          <AreasCompactPanel
            userId={userId}
            projects={sortedProjects}
            looseCount={looseCount}
            loading={false}
            hasCheckInToday={Boolean(hasCheckInToday)}
            onAddTask={openQuickAdd}
            onCreateProject={openCreateProjectModal}
            onGoCapture={onGoCapture ? goCapture : undefined}
            onChanged={handleLibraryChanged}
            onTaskQuickSaved={(message) => onTaskSaved?.(message)}
            onPlanQuickAdd={openLoosePlanQuickAdd}
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
          userId={userId}
          hasCheckInToday={Boolean(hasCheckInToday)}
          onClose={() => setQuickAddTarget(null)}
          onSaved={handleQuickAddSaved}
          onOpenFullCapture={onOpenFullCapture}
        />
        {redistributeModal}
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
      <CalmCard style={[styles.empty, embedded && styles.emptyEmbedded]}>
        <LinearGradient
          colors={[THEME.colors.calm.mist, THEME.colors.calm.blush]}
          style={styles.emptyIconWrap}
        >
          <FolderKanban size={48} color={THEME.colors.calm.lavenderDeep} strokeWidth={1.5} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>{t('projects.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('projects.emptyBody')}</Text>
        <CalmPrimaryButton
          label={t('projects.createProjectCta')}
          onPress={() => setShowCreateModal(true)}
          large
          accessibilityLabel={t('projects.createProjectA11y')}
          style={styles.emptyPrimaryCta}
        />
        <CalmPrimaryButton
          label={embedded ? t('vaciar.segmentGoCapture') : t('projects.goTasks')}
          variant="soft"
          onPress={goCapture}
          accessibilityLabel={
            embedded ? t('vaciar.segmentGoCaptureA11y') : t('projects.goTasksA11y')
          }
          style={styles.emptySecondaryCta}
        />
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
      </CalmCard>
    ) : (
      <>
        {embedded && onGoCapture && !areasFirst ? (
          <AdaptiveExperienceProjectsCta onOpenCapture={onGoCapture} />
        ) : null}

        {!areasFirst && !loading && totalIncomplete > 0 ? (
          <CalmCard style={styles.inventoryBanner}>
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
          </CalmCard>
        ) : null}

        <CalmCard style={[styles.actionsCard, areasFirst && styles.actionsCardCompact]}>
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
          {totalIncomplete > 0 ? (
            <>
              <View style={styles.actionDivider} />
              <LibraryActionRow
                icon={
                  <CalendarRange
                    size={22}
                    color={THEME.colors.calm.lavenderDeep}
                    strokeWidth={2.2}
                  />
                }
                title={t('projects.redistributeCta')}
                hint={areasFirst ? '' : t('projects.redistributeHint')}
                onPress={() => void openRedistribute()}
                accessibilityLabel={t('hoy.redistributeA11y')}
              />
            </>
          ) : null}
          {areasFirst ? (
            <Text style={styles.areasHint}>{t('projects.areasHint')}</Text>
          ) : null}
        </CalmCard>

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
          userId={userId}
          hasCheckInToday={Boolean(hasCheckInToday)}
          onClose={() => setQuickAddTarget(null)}
          onSaved={handleQuickAddSaved}
          onOpenFullCapture={onOpenFullCapture}
        />
        {redistributeModal}
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
        userId={userId}
        hasCheckInToday={Boolean(hasCheckInToday)}
        onClose={() => setQuickAddTarget(null)}
        onSaved={handleQuickAddSaved}
        onOpenFullCapture={onOpenFullCapture}
      />
      {redistributeModal}
    </>
  );
}

const styles = StyleSheet.create({
  embeddedWrap: {
    width: '100%',
    gap: THEME.layout.sectionGapCompact,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  inventoryBanner: {
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
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
    lineHeight: 20,
  },
  inventoryFeelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    minHeight: 36,
  },
  inventoryFeelText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  actionsCard: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[100],
    borderColor: THEME.colors.calm.border,
  },
  actionsCardCompact: {
    paddingVertical: THEME.spacing.sm,
    marginBottom: 0,
  },
  actionsCardCompactOnly: {
    gap: 0,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
  },
  actionsCardLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 16,
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
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionIconCreate: {
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  actionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  actionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  actionHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.colors.calm.border,
    marginVertical: 4,
  },
  areasHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginTop: 4,
  },
  listSection: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  filterPill: {
    ...THEME.surfaces.chip,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  filterPillText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
  filterPillTextActive: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
  },
  empty: {
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.sm,
  },
  emptyEmbedded: {
    paddingVertical: THEME.spacing.lg,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: THEME.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
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
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: THEME.spacing.xs,
  },
  emptyPrimaryCta: {
    marginTop: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  emptySecondaryCta: {
    marginTop: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  backLink: {
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  backLinkText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
});
