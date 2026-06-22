import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  ListTodo,
  Pencil,
  Plus,
} from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/lib/supabase';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  groupProjectsByResolvedLifeArea,
  resolveLifeAreaDisplay,
  type ResolvedLifeArea,
} from '@/lib/lifeAreas/userLifeAreas';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { computeProjectProgress, formatProjectDueDate } from '@/lib/projectProgress';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { AreaNameEditSheet } from '@/components/projects/AreaNameEditSheet';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';
import type { TranslationKey } from '@/lib/i18n';
import { LooseTaskMiniRow } from '@/components/projects/LooseTaskMiniRow';
import {
  groupLooseTasksByArea,
  type LooseTaskSummary,
} from '@/lib/looseTasks';

type AreasCompactPanelProps = {
  userId: string;
  projects: ProjectLibraryItem[];
  looseCount: number;
  loading: boolean;
  onAddTask: (projectId: string | null, lifeAreaRef?: LifeAreaRef) => void;
  onCreateProject?: (areaRef: LifeAreaRef) => void;
  onGoCapture?: () => void;
};

type NextActionMap = Record<string, string>;

type EditTarget =
  | { kind: 'builtin'; key: LifeAreaKey; name: string }
  | { kind: 'custom'; id: string; name: string }
  | { kind: 'new' };

function countLabel(
  count: number,
  oneKey: TranslationKey,
  manyKey: TranslationKey,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): string {
  return t(count === 1 ? oneKey : manyKey, { count });
}

function ProjectProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.max(percent > 0 ? 4 : 0, percent)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function ProjectCard({
  project,
  nextAction,
  locale,
  onAddTask,
}: {
  project: ProjectLibraryItem;
  nextAction: string | null;
  locale: 'es' | 'en';
  onAddTask: (projectId: string | null) => void;
}) {
  const { t } = useI18n();
  const progress = computeProjectProgress(project.taskCount, project.incompleteCount);
  const dueLabel = formatProjectDueDate(project.dueDate, locale);

  return (
    <View style={styles.projectCard}>
      <TouchableOpacity
        style={styles.projectMain}
        onPress={() => router.push(`/project/${project.id}`)}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('areasCompact.projectA11y', {
          name: project.name,
          count: project.incompleteCount,
        })}
      >
        <View style={styles.projectTopRow}>
          <View style={[styles.projectDot, { backgroundColor: project.color }]} />
          <Text style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={[styles.projectPercent, { color: project.color }]}>
            {progress.total > 0
              ? t('areasCompact.progressPercent', { percent: progress.percent })
              : t('areasCompact.noStepsYet')}
          </Text>
        </View>

        <ProjectProgressBar percent={progress.percent} color={project.color} />

        <Text style={styles.projectProgressDetail}>
          {progress.total > 0
            ? t('areasCompact.progressDetail', {
                done: progress.completed,
                total: progress.total,
              })
            : countLabel(
                project.incompleteCount,
                'areasCompact.taskOpenOne',
                'areasCompact.taskOpenMany',
                t,
              )}
        </Text>

        {dueLabel ? (
          <Text style={styles.projectMeta}>{t('areasCompact.deadline', { date: dueLabel })}</Text>
        ) : null}
        {nextAction ? (
          <Text style={styles.projectNext} numberOfLines={1}>
            {t('areasCompact.nextAction', { action: nextAction })}
          </Text>
        ) : null}
      </TouchableOpacity>

      <View style={styles.projectActions}>
        <TouchableOpacity
          style={styles.projectActionBtn}
          onPress={() => router.push(`/project/${project.id}`)}
          activeOpacity={0.85}
        >
          <FolderKanban size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.projectActionText}>{t('areasCompact.openProject')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.projectActionBtn}
          onPress={() => onAddTask(project.id)}
          activeOpacity={0.85}
        >
          <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.projectActionText}>{t('areasCompact.addTaskToProject')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AreaSection({
  area,
  areaIndex,
  projects,
  looseTasks,
  nextActions,
  locale,
  defaultExpanded,
  onAddTask,
  onCreateProject,
  onEditArea,
}: {
  area: ResolvedLifeArea;
  areaIndex: number;
  projects: ProjectLibraryItem[];
  looseTasks: LooseTaskSummary[];
  nextActions: NextActionMap;
  locale: 'es' | 'en';
  defaultExpanded?: boolean;
  onAddTask: (projectId: string | null, lifeAreaRef?: LifeAreaRef) => void;
  onCreateProject?: (areaRef: LifeAreaRef) => void;
  onEditArea: (area: ResolvedLifeArea) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(
    defaultExpanded ?? (projects.length > 0 || looseTasks.length > 0),
  );

  if (projects.length === 0 && looseTasks.length === 0 && !area.isCustom) return null;

  const themeKey = area.catalogKey ?? 'other';
  const theme = frontThemeForKey(themeKey, areaIndex);
  const openTasks = projects.reduce((sum, p) => sum + p.incompleteCount, 0) + looseTasks.length;

  const areaSummary = t('areasCompact.areaSummary', {
    projects: countLabel(
      projects.length,
      'areasCompact.projectOne',
      'areasCompact.projectMany',
      t,
    ),
    tasks: countLabel(openTasks, 'areasCompact.taskOpenOne', 'areasCompact.taskOpenMany', t),
  });

  return (
    <View style={[styles.areaShell, { borderLeftColor: theme.accent }]}>
      <View style={styles.areaHeader}>
        <TouchableOpacity
          style={styles.areaHeaderMain}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <View style={styles.areaHeaderText}>
            <Text style={[styles.areaEyebrow, { color: theme.accent }]}>
              {t('areasCompact.areaLabel')}
            </Text>
            <Text style={styles.areaName}>{area.name}</Text>
            <Text style={styles.areaMeta}>{areaSummary}</Text>
          </View>
          {expanded ? (
            <ChevronDown size={18} color={THEME.colors.text.tertiary} />
          ) : (
            <ChevronRight size={18} color={THEME.colors.text.tertiary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onEditArea(area)}
          hitSlop={8}
          style={styles.editBtn}
          accessibilityRole="button"
          accessibilityLabel={t('areasCompact.renameAreaA11y', { name: area.name })}
        >
          <Pencil size={16} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.areaBody}>
          {projects.length === 0 && looseTasks.length === 0 ? (
            <Text style={styles.emptyArea}>{t('areasCompact.emptyArea')}</Text>
          ) : (
            <View style={styles.projectList}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  nextAction={nextActions[project.id] ?? null}
                  locale={locale}
                  onAddTask={(id) => onAddTask(id)}
                />
              ))}
            </View>
          )}

          {looseTasks.length > 0 ? (
            <View style={styles.looseInAreaBlock}>
              <Text style={styles.looseInAreaLabel}>
                {countLabel(
                  looseTasks.length,
                  'areasCompact.looseInAreaOne',
                  'areasCompact.looseInAreaMany',
                  t,
                )}
              </Text>
              <View style={styles.looseInAreaList}>
                {looseTasks.slice(0, 5).map((task) => (
                  <LooseTaskMiniRow
                    key={task.id}
                    task={task}
                    accentColor={theme.accent}
                    onPress={() =>
                      router.push({
                        pathname: '/project/[id]',
                        params: { id: 'sin-proyecto', area: area.ref, highlight: task.id },
                      } as Href)
                    }
                  />
                ))}
              </View>
              {looseTasks.length > 5 ? (
                <TouchableOpacity
                  style={styles.looseInAreaMore}
                  onPress={() =>
                    router.push({
                      pathname: '/project/[id]',
                      params: { id: 'sin-proyecto', area: area.ref },
                    } as Href)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.looseInAreaMoreText}>
                    {t('areasCompact.viewAreaLooseTasks', { count: looseTasks.length })}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.areaActions}>
            {onCreateProject ? (
              <TouchableOpacity
                style={styles.areaActionPrimary}
                onPress={() => onCreateProject(area.ref)}
                activeOpacity={0.88}
              >
                <FolderKanban size={16} color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.areaActionPrimaryText}>
                  {t('areasCompact.createProjectInArea')}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.areaActionSecondary}
              onPress={() => onAddTask(null, area.ref)}
              activeOpacity={0.88}
            >
              <ListTodo size={16} color={THEME.colors.text.secondary} />
              <Text style={styles.areaActionSecondaryText}>{t('areasCompact.addLooseTask')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function AreasCompactPanel({
  userId,
  projects,
  looseCount,
  loading,
  onAddTask,
  onCreateProject,
  onGoCapture,
}: AreasCompactPanelProps) {
  const { t, locale } = useI18n();
  const [nextActions, setNextActions] = useState<NextActionMap>({});
  const [looseTasks, setLooseTasks] = useState<LooseTaskSummary[]>([]);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const {
    config: lifeAreasConfig,
    loading: lifeAreasLoading,
    renameBuiltinArea,
    addCustomArea,
    renameCustomArea,
  } = useUserLifeAreas(userId);

  const getDefaultLabel = useCallback(
    (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey),
    [t],
  );

  const looseTasksByArea = useMemo(() => groupLooseTasksByArea(looseTasks), [looseTasks]);
  const unassignedLoose = looseTasksByArea.get(null) ?? [];

  const groups = useMemo(() => {
    const withProjects = groupProjectsByResolvedLifeArea(
      projects,
      lifeAreasConfig,
      getDefaultLabel,
      t('lifeAreas.other'),
    );
    const refsWithContent = new Set(withProjects.map((group) => group.area.ref));

    for (const custom of lifeAreasConfig.custom) {
      const ref = makeCustomLifeAreaRef(custom.id);
      if (refsWithContent.has(ref)) continue;
      withProjects.push({
        area: resolveLifeAreaDisplay(ref, lifeAreasConfig, getDefaultLabel),
        projects: [],
      });
      refsWithContent.add(ref);
    }

    for (const [areaRef, areaLoose] of looseTasksByArea.entries()) {
      if (areaRef == null || areaLoose.length === 0) continue;
      const ref = areaRef as LifeAreaRef;
      if (refsWithContent.has(ref)) continue;
      withProjects.push({
        area: resolveLifeAreaDisplay(ref, lifeAreasConfig, getDefaultLabel),
        projects: [],
      });
      refsWithContent.add(ref);
    }

    return withProjects;
  }, [projects, lifeAreasConfig, getDefaultLabel, t, looseTasksByArea]);

  const totalOpenTasks = useMemo(
    () => projects.reduce((sum, p) => sum + p.incompleteCount, 0) + looseCount,
    [projects, looseCount],
  );

  const loadLooseTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, content, created_at, scheduled_date, life_area_key, is_completed')
      .eq('user_id', userId)
      .is('project_id', null)
      .is('parent_task_id', null)
      .eq('is_completed', false)
      .order('created_at', { ascending: false });

    if (error) {
      setLooseTasks([]);
      return;
    }
    setLooseTasks((data as LooseTaskSummary[]) ?? []);
  }, [userId]);

  const loadNextActions = useCallback(async () => {
    if (projects.length === 0) return;
    const ids = projects.map((p) => p.id);
    const { data } = await supabase
      .from('tasks')
      .select('project_id, content')
      .eq('user_id', userId)
      .in('project_id', ids)
      .eq('is_completed', false)
      .is('parent_task_id', null)
      .order('is_priority', { ascending: false })
      .order('created_at', { ascending: true });

    const map: NextActionMap = {};
    for (const row of data ?? []) {
      const pid = row.project_id as string;
      if (!map[pid]) map[pid] = String(row.content);
    }
    setNextActions(map);
  }, [projects, userId]);

  useEffect(() => {
    void loadLooseTasks();
  }, [loadLooseTasks, looseCount]);

  useEffect(() => {
    void loadNextActions();
  }, [loadNextActions]);

  const openEditArea = (area: ResolvedLifeArea) => {
    if (area.isCustom) {
      const id = area.ref.replace('custom:', '');
      setEditTarget({ kind: 'custom', id, name: area.name });
      return;
    }
    if (!area.catalogKey) return;
    setEditTarget({ kind: 'builtin', key: area.catalogKey, name: area.name });
  };

  const handleSaveArea = async (name: string) => {
    if (!editTarget) return;

    if (editTarget.kind === 'new') {
      await addCustomArea(name);
      return;
    }

    if (editTarget.kind === 'custom') {
      await renameCustomArea(editTarget.id, name);
      return;
    }

    await renameBuiltinArea(editTarget.key, name);
  };

  if (loading || lifeAreasLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
      </View>
    );
  }

  if (projects.length === 0 && looseCount === 0 && lifeAreasConfig.custom.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('areasCompact.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('areasCompact.emptyBody')}</Text>
        {onGoCapture ? (
          <TouchableOpacity style={styles.captureCta} onPress={onGoCapture} activeOpacity={0.88}>
            <Text style={styles.captureCtaText}>{t('vaciar.segmentGoCapture')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.topActionLoose}
          onPress={() => router.push('/project/sin-proyecto' as Href)}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('areasCompact.viewLooseTasks')}
        >
          <View style={styles.topActionIconWrap}>
            <ListTodo size={20} color={THEME.colors.calm.lavenderDeep} />
          </View>
          <View style={styles.topActionText}>
            <Text style={styles.topActionTitle}>{t('areasCompact.looseSectionTitle')}</Text>
            <Text style={styles.topActionMeta}>
              {countLabel(
                unassignedLoose.length > 0 ? unassignedLoose.length : looseCount,
                'areasCompact.taskOpenOne',
                'areasCompact.taskOpenMany',
                t,
              )}
            </Text>
          </View>
          <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topActionArea}
          onPress={() => setEditTarget({ kind: 'new' })}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('areasCompact.newAreaA11y')}
        >
          <View style={[styles.topActionIconWrap, styles.topActionIconWrapMuted]}>
            <Plus size={20} color={THEME.colors.calm.lavenderDeep} />
          </View>
          <Text style={styles.topActionTitle}>{t('areasCompact.newArea')}</Text>
        </TouchableOpacity>
      </View>

      <CalmCard style={styles.explainerCard}>
        <Text style={styles.headline}>{t('areasCompact.headline')}</Text>
        <Text style={styles.explainer}>{t('areasCompact.explainer')}</Text>
        <Text style={styles.overviewStats}>
          {t('areasCompact.overviewStats', {
            projects: countLabel(
              projects.length,
              'areasCompact.projectOne',
              'areasCompact.projectMany',
              t,
            ),
            tasks: countLabel(
              totalOpenTasks,
              'areasCompact.taskOpenOne',
              'areasCompact.taskOpenMany',
              t,
            ),
          })}
        </Text>
      </CalmCard>

      {groups.map((group, index) => (
        <AreaSection
          key={group.area.ref}
          area={group.area}
          areaIndex={index}
          projects={group.projects}
          looseTasks={looseTasksByArea.get(group.area.ref) ?? []}
          nextActions={nextActions}
          locale={locale}
          defaultExpanded={index === 0}
          onAddTask={onAddTask}
          onCreateProject={onCreateProject}
          onEditArea={openEditArea}
        />
      ))}

      {unassignedLoose.length > 0 ? (
        <CalmCard style={styles.loosePreviewCard}>
          <Text style={styles.loosePreviewTitle}>{t('areasCompact.loosePreviewTitle')}</Text>
          <View style={styles.loosePreviewList}>
            {unassignedLoose.slice(0, 3).map((task) => (
              <LooseTaskMiniRow
                key={task.id}
                task={task}
                onPress={() =>
                  router.push({
                    pathname: '/project/[id]',
                    params: { id: 'sin-proyecto', highlight: task.id },
                  } as Href)
                }
              />
            ))}
          </View>
          {unassignedLoose.length > 3 ? (
            <TouchableOpacity
              style={styles.looseInAreaMore}
              onPress={() => router.push('/project/sin-proyecto' as Href)}
              activeOpacity={0.85}
            >
              <Text style={styles.looseInAreaMoreText}>
                {t('areasCompact.viewLooseTasks')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </CalmCard>
      ) : null}

      <AreaNameEditSheet
        visible={editTarget !== null}
        title={
          editTarget?.kind === 'new'
            ? t('areasCompact.newArea')
            : t('areasCompact.renameArea')
        }
        initialName={editTarget?.kind === 'new' ? '' : (editTarget?.name ?? '')}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveArea}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.md,
  },
  topActions: {
    gap: THEME.spacing.sm,
  },
  topActionLoose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.blush,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    minHeight: THEME.sizes.touchTarget,
  },
  topActionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  topActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
  },
  topActionIconWrapMuted: {
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  topActionText: {
    flex: 1,
    gap: 2,
  },
  topActionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  topActionMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  explainerCard: {
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  headline: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  explainer: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  overviewStats: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    marginTop: 4,
  },
  centered: {
    paddingVertical: THEME.spacing.xl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
    gap: THEME.spacing.sm,
  },
  emptyTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  emptyBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  captureCta: {
    marginTop: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  captureCtaText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  areaShell: {
    borderLeftWidth: 4,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.mist,
  },
  areaHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  editBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaHeaderText: {
    flex: 1,
    gap: 2,
  },
  areaEyebrow: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  areaName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  areaMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  areaBody: {
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  emptyArea: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  projectList: {
    gap: THEME.spacing.sm,
  },
  projectCard: {
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    overflow: 'hidden',
  },
  projectMain: {
    padding: THEME.spacing.sm,
    gap: 6,
  },
  projectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  projectName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  projectPercent: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    flexShrink: 0,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.mist,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 0,
  },
  projectProgressDetail: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  projectMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  projectNext: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
  },
  projectActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  projectActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    minHeight: 40,
  },
  projectActionText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  areaActions: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  areaActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    minHeight: 44,
  },
  areaActionPrimaryText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  areaActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    minHeight: 40,
  },
  areaActionSecondaryText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  loosePreviewCard: {
    gap: THEME.spacing.sm,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.mist,
  },
  loosePreviewTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
  },
  looseInAreaBlock: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  looseInAreaLabel: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  looseInAreaList: {
    gap: THEME.spacing.xs,
  },
  looseInAreaMore: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
  looseInAreaMoreText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  loosePreviewList: {
    gap: THEME.spacing.xs,
  },
});
