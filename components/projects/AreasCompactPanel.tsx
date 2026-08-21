import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FolderKanban,
  ListTodo,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/lib/supabase';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  groupProjectsByResolvedLifeArea,
  resolveLifeAreaDisplay,
  resolveAreaColumnOrder,
  resolveAreasPanelColumnOrder,
  removeAreaFromUserConfig,
  createCustomLifeArea,
  hasPersonalizedLifeAreasConfig,
  type ResolvedLifeArea,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import { confirmDeleteProject, deleteProjectById } from '@/lib/deleteProject';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { computeProjectProgress, formatProjectDueDate } from '@/lib/projectProgress';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { AreaNameEditSheet } from '@/components/projects/AreaNameEditSheet';
import { frontThemeForKey, type FrontTheme } from '@/lib/frentes/frontTheme';
import type { TranslationKey } from '@/lib/i18n';
import { LooseTaskMiniRow } from '@/components/projects/LooseTaskMiniRow';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import type { Task } from '@/components/tasks/TaskCard';
import { useTaskPlanEdit } from '@/hooks/useTaskPlanEdit';
import { logger } from '@/lib/logger';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import {
  filterOverdueTasks,
  groupLooseTasksByArea,
  isOverdueScheduledTask,
  looseSummaryToTask,
  type LooseTaskSummary,
} from '@/lib/looseTasks';
import { purgeExpiredLooseCompletedTasks } from '@/lib/purgeExpiredLooseCompletedTasks';
import { AreasQuickAddBar } from '@/components/projects/AreasQuickAddBar';
import { AreasPlannerDragBoard } from '@/components/projects/AreasPlannerDragBoard';
import {
  buildAreaPlannerColumns,
  countOrganizableLooseTasks,
} from '@/lib/projects/buildAreaPlannerColumns';
import type { LifeArea } from '@/lib/lifeAreas/types';
import {
  AreasMoveToAreaSheet,
  type AreasMoveTarget,
} from '@/components/projects/AreasMoveToAreaSheet';
import { moveLooseTaskToArea } from '@/lib/moveLooseTaskToArea';

type AreasCompactPanelProps = {
  userId: string;
  projects: ProjectLibraryItem[];
  looseCount: number;
  loading: boolean;
  hasCheckInToday?: boolean;
  onAddTask: (
    projectId: string | null,
    lifeAreaRef?: LifeAreaRef,
    areaContext?: { label: string; emoji: string },
  ) => void;
  onCreateProject?: (areaRef: LifeAreaRef) => void;
  onGoCapture?: () => void;
  onChanged?: () => void;
  onTaskQuickSaved?: (message: string) => void;
  onPlanQuickAdd?: (content: string) => void;
};

type NextActionMap = Record<string, string>;

type EditTarget =
  | { kind: 'builtin'; key: LifeAreaKey; name: string }
  | { kind: 'custom'; id: string; name: string; emoji: string; color: string }
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
  compact = false,
  areaTheme,
  onAddTask,
  onDeleteProject,
}: {
  project: ProjectLibraryItem;
  nextAction: string | null;
  locale: 'es' | 'en';
  compact?: boolean;
  areaTheme?: Pick<FrontTheme, 'bg' | 'border' | 'accent'>;
  onAddTask: (projectId: string | null) => void;
  onDeleteProject: (project: ProjectLibraryItem) => void;
}) {
  const { t } = useI18n();
  const progress = computeProjectProgress(project.taskCount, project.incompleteCount);
  const dueLabel = formatProjectDueDate(project.dueDate, locale);

  return (
    <View
      style={[
        styles.projectCard,
        compact && styles.projectCardCompact,
        areaTheme && compact
          ? {
              backgroundColor: areaTheme.bg,
              borderColor: areaTheme.border,
              borderWidth: 1,
              borderLeftWidth: 3,
              borderLeftColor: areaTheme.accent,
            }
          : null,
      ]}
    >
      <TouchableOpacity
        style={[styles.projectMain, compact && styles.projectMainCompact]}
        onPress={() => router.push(`/project/${project.id}`)}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('areasCompact.projectA11y', {
          name: project.name,
          count: project.incompleteCount,
        })}
      >
        <View style={styles.projectTopBlock}>
          <View style={styles.projectTitleRow}>
            <View style={[styles.projectDot, { backgroundColor: project.color }]} />
            <Text style={[styles.projectName, compact && styles.projectNameCompact]} numberOfLines={compact ? 2 : undefined}>
              {project.name}
            </Text>
            {!compact ? (
              <ChevronRight size={16} color={THEME.colors.text.tertiary} />
            ) : null}
          </View>
          {!compact ? (
            <Text style={[styles.projectPercent, { color: project.color }]}>
              {progress.total > 0
                ? t('areasCompact.progressPercent', { percent: progress.percent })
                : t('areasCompact.noStepsYet')}
            </Text>
          ) : null}
        </View>

        {!compact ? (
          <>
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
          </>
        ) : (
          <Text style={[styles.projectProgressDetail, compact && styles.projectProgressDetailCompact]} numberOfLines={1}>
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
        )}
      </TouchableOpacity>

      {compact ? (
        <View style={styles.projectCompactActions}>
          <TouchableOpacity
            style={styles.projectCompactAddBtn}
            onPress={() => onAddTask(project.id)}
            hitSlop={8}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('areasCompact.addTaskToProject')}
          >
            <Plus size={16} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.projectCompactOpenBtn}
            onPress={() => router.push(`/project/${project.id}`)}
            hitSlop={8}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('areasCompact.openProject')}
          >
            <ChevronRight size={16} color={THEME.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {!compact ? (
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
          <TouchableOpacity
            style={styles.projectActionBtn}
            onPress={() => onDeleteProject(project)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('projects.deleteProjectA11y', { name: project.name })}
          >
            <Trash2 size={14} color={THEME.colors.semantic.danger} />
            <Text style={[styles.projectActionText, styles.projectActionDanger]}>
              {t('projects.deleteProject')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function ManageAreaRow({
  area,
  onEdit,
  onDelete,
}: {
  area: ResolvedLifeArea;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.manageRow}>
      <View style={[styles.manageDot, { backgroundColor: area.color }]} />
      <View style={styles.manageRowBody}>
        <Text style={styles.manageRowName}>
          {area.isCustom ? `${area.emoji} ` : ''}
          {area.name}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onEdit}
        hitSlop={8}
        style={styles.manageIconBtn}
        accessibilityRole="button"
        accessibilityLabel={t('areasCompact.renameAreaA11y', { name: area.name })}
      >
        <Pencil size={16} color={THEME.colors.calm.lavenderDeep} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={8}
        style={styles.manageIconBtn}
        accessibilityRole="button"
        accessibilityLabel={t('areasCompact.deleteArea')}
      >
        <Trash2 size={16} color={THEME.colors.semantic.danger} />
      </TouchableOpacity>
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
  onDeleteProject,
  onEditLooseTask,
  onDeleteLooseTask,
  onMoveLooseTask,
}: {
  area: ResolvedLifeArea;
  areaIndex: number;
  projects: ProjectLibraryItem[];
  looseTasks: LooseTaskSummary[];
  nextActions: NextActionMap;
  locale: 'es' | 'en';
  defaultExpanded?: boolean;
  onAddTask: (
    projectId: string | null,
    lifeAreaRef?: LifeAreaRef,
    areaContext?: { label: string; emoji: string },
  ) => void;
  onCreateProject?: (areaRef: LifeAreaRef) => void;
  onDeleteProject: (project: ProjectLibraryItem) => void;
  onEditLooseTask: (task: LooseTaskSummary) => void;
  onDeleteLooseTask: (task: LooseTaskSummary) => void;
  onMoveLooseTask?: (task: LooseTaskSummary) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  const themeKey = area.catalogKey ?? 'other';
  const theme = area.isCustom
    ? {
        accent: area.color,
        bg: `${area.color}22`,
        border: `${area.color}88`,
        taskBg: `${area.color}14`,
      }
    : frontThemeForKey(themeKey, areaIndex);
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
    <View style={[styles.areaShell, { borderLeftColor: theme.accent, borderColor: theme.border }]}>
      <TouchableOpacity
        style={[styles.areaHeaderMain, { backgroundColor: theme.bg }]}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[styles.areaColorDot, { backgroundColor: theme.accent }]} />
        <View style={styles.areaHeaderText}>
          <Text style={styles.areaName}>
            {area.isCustom ? `${area.emoji} ` : ''}
            {area.name}
          </Text>
          <Text style={styles.areaMeta}>{areaSummary}</Text>
        </View>
        {expanded ? (
          <ChevronDown size={18} color={THEME.colors.text.tertiary} />
        ) : (
          <ChevronRight size={18} color={THEME.colors.text.tertiary} />
        )}
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.areaBody}>
          {projects.length === 0 && looseTasks.length === 0 ? (
            <Text style={styles.emptyArea}>{t('areasCompact.emptyAreaShort')}</Text>
          ) : projects.length > 0 ? (
            <View style={styles.projectList}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  nextAction={nextActions[project.id] ?? null}
                  locale={locale}
                  compact
                  areaTheme={theme}
                  onAddTask={(id) => onAddTask(id)}
                  onDeleteProject={onDeleteProject}
                />
              ))}
            </View>
          ) : null}

          {looseTasks.length > 0 ? (
            <View
              style={[
                styles.looseInAreaBlock,
                projects.length > 0 && styles.looseInAreaBlockSeparated,
              ]}
            >
              <View style={styles.looseInAreaList}>
                {looseTasks.map((task) => (
                  <LooseTaskMiniRow
                    key={task.id}
                    task={task}
                    accentColor={theme.accent}
                    backgroundColor={theme.taskBg}
                    borderColor={theme.border}
                    onEdit={() => onEditLooseTask(task)}
                    onDelete={() => onDeleteLooseTask(task)}
                    onMoveRequest={
                      onMoveLooseTask ? () => onMoveLooseTask(task) : undefined
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.areaActionsCompact}>
            {onCreateProject ? (
              <TouchableOpacity
                style={styles.areaActionLink}
                onPress={() => onCreateProject(area.ref)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={t('areasCompact.addProject')}
              >
                <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.areaActionLinkText}>{t('areasCompact.addProject')}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.areaActionLink}
              onPress={() => onAddTask(null, area.ref, { label: area.name, emoji: area.emoji })}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={t('areasCompact.addStepShort')}
            >
              <ListTodo size={14} color={THEME.colors.text.secondary} />
              <Text style={[styles.areaActionLinkText, styles.areaActionLinkMuted]}>
                {t('areasCompact.addStepShort')}
              </Text>
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
  hasCheckInToday = false,
  onAddTask,
  onCreateProject,
  onGoCapture,
  onChanged,
  onTaskQuickSaved,
  onPlanQuickAdd,
}: AreasCompactPanelProps) {
  const { t, locale } = useI18n();
  const [nextActions, setNextActions] = useState<NextActionMap>({});
  const [looseTasks, setLooseTasks] = useState<LooseTaskSummary[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<LooseTaskSummary[]>([]);
  const [looseTasksLoadFailed, setLooseTasksLoadFailed] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [moveTargetForNewArea, setMoveTargetForNewArea] = useState<AreasMoveTarget | null>(null);
  const [looseMoveTarget, setLooseMoveTarget] = useState<AreasMoveTarget | null>(null);
  const [editingLooseTask, setEditingLooseTask] = useState<Task | null>(null);
  const [manageMode, setManageMode] = useState(false);
  const [organizeDragMode, setOrganizeDragMode] = useState(false);
  const [showEmptyAreas, setShowEmptyAreas] = useState(false);
  const [showOverdueList, setShowOverdueList] = useState(true);
  const [draftConfig, setDraftConfig] = useState<UserLifeAreasConfig | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const {
    config: lifeAreasConfig,
    loading: lifeAreasLoading,
    renameBuiltinArea,
    addCustomArea,
    renameCustomArea,
    removeArea,
    saveConfig,
  } = useUserLifeAreas(userId);

  const activeConfig = manageMode && draftConfig ? draftConfig : lifeAreasConfig;

  const getDefaultLabel = useCallback(
    (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey),
    [t],
  );

  const getPresetCustomLabel = useCallback(
    (presetCustomId: string) => t(`lifeAreasPreset.${presetCustomId}` as TranslationKey),
    [t],
  );

  /** Las atrasadas viven en su sección; no se repiten dentro de cada área. */
  const looseTasksForAreas = useMemo(
    () => looseTasks.filter((task) => !isOverdueScheduledTask(task)),
    [looseTasks],
  );

  const looseTasksByArea = useMemo(
    () => groupLooseTasksByArea(looseTasksForAreas),
    [looseTasksForAreas],
  );

  const allGroups = useMemo(() => {
    const withProjects = groupProjectsByResolvedLifeArea(
      projects,
      activeConfig,
      getDefaultLabel,
      t('lifeAreas.other'),
    );
    const projectsByRef = new Map(
      withProjects.map((group) => [group.area.ref, group.projects] as const),
    );

    const orderedRefs = resolveAreasPanelColumnOrder(activeConfig);

    return orderedRefs.map((ref, index) => ({
      area: resolveLifeAreaDisplay(ref, activeConfig, getDefaultLabel, getPresetCustomLabel),
      areaIndex: index,
      projects: projectsByRef.get(ref) ?? [],
      looseTasks: [
        ...(looseTasksByArea.get(ref) ?? []),
        ...(ref === 'other' ? (looseTasksByArea.get(null) ?? []) : []),
      ],
    }));
  }, [projects, activeConfig, getDefaultLabel, getPresetCustomLabel, t, looseTasksByArea]);

  const activeGroups = useMemo(
    () => allGroups.filter((group) => group.projects.length > 0 || group.looseTasks.length > 0),
    [allGroups],
  );

  const emptyAreaCount = allGroups.length - activeGroups.length;
  const displayGroups = showEmptyAreas ? allGroups : activeGroups;

  const organizableLooseCount = useMemo(
    () => countOrganizableLooseTasks(allGroups),
    [allGroups],
  );

  const plannerColumns = useMemo(
    () => (organizeDragMode ? buildAreaPlannerColumns(allGroups) : []),
    [allGroups, organizeDragMode],
  );

  const plannerAreas = useMemo<LifeArea[]>(
    () =>
      allGroups.map((group) => ({
        id: group.area.ref,
        name: group.area.name,
        emoji: group.area.emoji,
        color: group.area.color,
      })),
    [allGroups],
  );

  const looseTaskById = useMemo(
    () => new Map(looseTasks.map((task) => [task.id, task] as const)),
    [looseTasks],
  );

  const manageAreaList = useMemo(() => {
    return resolveAreaColumnOrder(activeConfig).map((ref) =>
      resolveLifeAreaDisplay(ref, activeConfig, getDefaultLabel, getPresetCustomLabel),
    );
  }, [activeConfig, getDefaultLabel, getPresetCustomLabel]);

  const totalOpenTasks = useMemo(() => {
    const projectTasks = projects.reduce((sum, project) => sum + project.incompleteCount, 0);
    const looseOpen = looseTasksLoadFailed ? looseCount : looseTasks.length;
    return projectTasks + looseOpen;
  }, [projects, looseCount, looseTasks.length, looseTasksLoadFailed]);

  const loadLooseTasks = useCallback(async () => {
    try {
      await purgeExpiredLooseCompletedTasks(userId);
      const today = getLocalDateString();

      const [looseResult, overdueResult] = await Promise.all([
        supabase
          .from('tasks')
          .select(
            'id, content, created_at, scheduled_date, life_area_key, is_completed, is_priority, project_id',
          )
          .eq('user_id', userId)
          .is('project_id', null)
          .is('parent_task_id', null)
          .eq('is_completed', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select(
            'id, content, created_at, scheduled_date, life_area_key, is_completed, is_priority, project_id',
          )
          .eq('user_id', userId)
          .is('parent_task_id', null)
          .eq('is_completed', false)
          .not('scheduled_date', 'is', null)
          .lt('scheduled_date', today)
          .order('scheduled_date', { ascending: true }),
      ]);

      if (looseResult.error) {
        logger.error('Error cargando tareas sueltas:', looseResult.error);
        setLooseTasksLoadFailed(true);
      } else {
        setLooseTasksLoadFailed(false);
        setLooseTasks((looseResult.data as LooseTaskSummary[]) ?? []);
      }

      if (overdueResult.error) {
        logger.error('Error cargando tareas atrasadas:', overdueResult.error);
        // Fallback: solo de sueltas si esa query sí respondió
        if (!looseResult.error) {
          setOverdueTasks(
            filterOverdueTasks((looseResult.data as LooseTaskSummary[]) ?? [], today),
          );
        }
      } else {
        setOverdueTasks(
          filterOverdueTasks((overdueResult.data as LooseTaskSummary[]) ?? [], today),
        );
      }
    } catch (error) {
      logger.error('Error inesperado cargando tareas de Áreas:', error);
      setLooseTasksLoadFailed(true);
    }
  }, [userId]);

  const performDeleteLooseTask = useCallback(
    async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        logger.error('Error eliminando tarea suelta:', error);
        Alert.alert(t('errors.deleteTaskFailed'));
        return false;
      }
      if (editingLooseTask?.id === taskId) {
        setEditingLooseTask(null);
      }
      setLooseTasks((current) => current.filter((task) => task.id !== taskId));
      setOverdueTasks((current) => current.filter((task) => task.id !== taskId));
      await loadLooseTasks();
      onChanged?.();
      return true;
    },
    [editingLooseTask?.id, loadLooseTasks, onChanged, t],
  );

  const editProjects = useMemo(
    () => projects.map((project) => ({ id: project.id, name: project.name })),
    [projects],
  );

  const { saving: planEditSaving, savePlan } = useTaskPlanEdit({
    onSaved: (taskId, payload) => {
      setEditingLooseTask(null);
      const patchSummary = (task: LooseTaskSummary): LooseTaskSummary => ({
        ...task,
        content: payload.content,
        life_area_key: payload.lifeAreaKey ?? task.life_area_key ?? null,
        project_id: payload.projectId ?? task.project_id ?? null,
        scheduled_date: payload.scheduledDate,
      });

      if (payload.projectId) {
        setLooseTasks((current) => current.filter((task) => task.id !== taskId));
      } else {
        setLooseTasks((current) =>
          current.map((task) => (task.id === taskId ? patchSummary(task) : task)),
        );
      }
      setOverdueTasks((current) => {
        const next = current
          .map((task) => (task.id === taskId ? patchSummary(task) : task))
          .filter((task) => isOverdueScheduledTask(task));
        return filterOverdueTasks(next);
      });
      void loadLooseTasks();
      onChanged?.();
    },
    onError: () => {
      Alert.alert(t('errors.saveTaskFailed'));
    },
  });

  const handleEditLooseTask = useCallback((summary: LooseTaskSummary) => {
    setEditingLooseTask(looseSummaryToTask(summary));
  }, []);

  const handleRequestMoveLooseTask = useCallback((summary: LooseTaskSummary) => {
    setLooseMoveTarget({
      kind: 'loose',
      taskId: summary.id,
      title: summary.content,
      currentAreaRef: (summary.life_area_key as LifeAreaRef | null) ?? null,
    });
  }, []);

  const handleDeleteLooseTask = useCallback(
    (summary: LooseTaskSummary) => {
      const taskLabel =
        summary.content.length > 40 ? `${summary.content.slice(0, 40)}…` : summary.content;
      Alert.alert(t('hoy.deleteTaskTitle'), t('hoy.deleteTaskConfirm', { task: taskLabel }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('errors.delete'),
          style: 'destructive',
          onPress: () => {
            void performDeleteLooseTask(summary.id);
          },
        },
      ]);
    },
    [performDeleteLooseTask, t],
  );

  const handleDeleteEditingLooseTask = useCallback(async () => {
    if (!editingLooseTask) return;
    await performDeleteLooseTask(editingLooseTask.id);
  }, [editingLooseTask, performDeleteLooseTask]);

  const handleMoveLooseTask = useCallback(
    (taskId: string, targetAreaRef: LifeAreaRef) => {
      let previousAreaRef: LifeAreaRef | null | undefined;
      const normalizeAreaRef = (ref: LifeAreaRef | null | undefined) => ref ?? 'other';

      setLooseTasks((current) => {
        const existing = current.find((task) => task.id === taskId);
        previousAreaRef = (existing?.life_area_key as LifeAreaRef | null) ?? null;
        if (normalizeAreaRef(previousAreaRef) === normalizeAreaRef(targetAreaRef)) return current;
        return current.map((task) =>
          task.id === taskId ? { ...task, life_area_key: targetAreaRef } : task,
        );
      });

      setOverdueTasks((current) => {
        const existing = current.find((task) => task.id === taskId);
        if (!existing) return current;
        if (normalizeAreaRef((existing.life_area_key as LifeAreaRef | null) ?? null) === normalizeAreaRef(targetAreaRef)) {
          return current;
        }
        return current.map((task) =>
          task.id === taskId ? { ...task, life_area_key: targetAreaRef } : task,
        );
      });

      if (normalizeAreaRef(previousAreaRef) === normalizeAreaRef(targetAreaRef)) return;

      void moveLooseTaskToArea(taskId, targetAreaRef).then((result) => {
        if (!result.ok) {
          setLooseTasks((current) =>
            current.map((task) =>
              task.id === taskId ? { ...task, life_area_key: previousAreaRef ?? null } : task,
            ),
          );
          setOverdueTasks((current) =>
            current.map((task) =>
              task.id === taskId ? { ...task, life_area_key: previousAreaRef ?? null } : task,
            ),
          );
          Alert.alert(
            result.reason === 'schema_missing'
              ? t('errors.lifeAreaMoveUnavailable')
              : t('errors.saveTaskFailed'),
          );
          return;
        }
        onTaskQuickSaved?.(t('areasCompact.looseDragMoved'));
        onChanged?.();
      });
    },
    [onChanged, onTaskQuickSaved, t],
  );

  const handleQuickAddSaved = useCallback(
    (title: string) => {
      void loadLooseTasks();
      onChanged?.();
      onTaskQuickSaved?.(t('projects.quickAddSuccessLoose', { title }));
    },
    [loadLooseTasks, onChanged, onTaskQuickSaved, t],
  );

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
    if (!userId) return;
    void loadLooseTasks();
  }, [userId, loadLooseTasks, looseCount]);

  useEffect(() => {
    void loadNextActions();
  }, [loadNextActions]);

  const openEditArea = (area: ResolvedLifeArea) => {
    if (area.isCustom) {
      const id = area.ref.replace('custom:', '');
      setEditTarget({ kind: 'custom', id, name: area.name, emoji: area.emoji, color: area.color });
      return;
    }
    if (!area.catalogKey) return;
    setEditTarget({ kind: 'builtin', key: area.catalogKey, name: area.name });
  };

  const handleSaveArea = async (name: string, emoji?: string, color?: string) => {
    if (!editTarget) return false;

    if (manageMode && draftConfig) {
      let next = draftConfig;
      if (editTarget.kind === 'new') {
        const entry = createCustomLifeArea(name, emoji ?? '🌿', color);
        next = { ...draftConfig, custom: [...draftConfig.custom, entry] };
      } else if (editTarget.kind === 'custom') {
        next = {
          ...draftConfig,
          custom: draftConfig.custom.map((item) =>
            item.id === editTarget.id
              ? {
                  ...item,
                  name: name.trim(),
                  emoji: emoji ?? item.emoji,
                  color: color ?? item.color,
                }
              : item,
          ),
        };
      } else {
        const labels = { ...draftConfig.labels };
        const trimmed = name.trim();
        if (trimmed) labels[editTarget.key] = trimmed;
        else delete labels[editTarget.key];
        next = { ...draftConfig, labels };
      }
      setDraftConfig(next);
      return;
    }

    if (editTarget.kind === 'new') {
      const result = await addCustomArea(name, emoji ?? '🌿', color);
      if (result.ok && result.entry) {
        onChanged?.();
        if (moveTargetForNewArea?.kind === 'loose') {
          const areaRef = makeCustomLifeAreaRef(result.entry.id);
          void handleMoveLooseTask(moveTargetForNewArea.taskId, areaRef);
          setMoveTargetForNewArea(null);
        }
        return;
      }
      Alert.alert(t('errors.saveTaskFailed'));
      return false;
    }

    if (editTarget.kind === 'custom') {
      const ok = await renameCustomArea(editTarget.id, name, emoji, color);
      if (ok) {
        onChanged?.();
        return;
      }
      Alert.alert(t('errors.saveTaskFailed'));
      return false;
    }

    const ok = await renameBuiltinArea(editTarget.key, name);
    if (ok) {
      onChanged?.();
      return;
    }
    Alert.alert(t('errors.saveTaskFailed'));
    return false;
  };

  const confirmRemoveArea = useCallback(
    (area: ResolvedLifeArea) => {
      Alert.alert(
        t('areasCompact.deleteAreaTitle'),
        t('areasCompact.deleteAreaBody', { name: area.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('errors.delete'),
            style: 'destructive',
            onPress: () => {
              if (manageMode && draftConfig) {
                setDraftConfig(removeAreaFromUserConfig(draftConfig, area.ref));
                return;
              }
              void (async () => {
                const ok = await removeArea(area.ref);
                if (ok) {
                  void loadLooseTasks();
                  onChanged?.();
                } else {
                  Alert.alert(t('areasCompact.deleteAreaFailed'));
                }
              })();
            },
          },
        ],
      );
    },
    [draftConfig, loadLooseTasks, manageMode, onChanged, removeArea, t],
  );

  const handleDeleteArea = () => {
    if (!editTarget || editTarget.kind === 'new') return;

    const target = editTarget;
    const areaRef: LifeAreaRef =
      target.kind === 'custom' ? makeCustomLifeAreaRef(target.id) : target.key;
    setEditTarget(null);

    Alert.alert(
      t('areasCompact.deleteAreaTitle'),
      t('areasCompact.deleteAreaBody', { name: target.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('errors.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (manageMode && draftConfig) {
                setDraftConfig(removeAreaFromUserConfig(draftConfig, areaRef));
                return;
              }
              const ok = await removeArea(areaRef);
              if (ok) {
                void loadLooseTasks();
                onChanged?.();
              } else {
                Alert.alert(t('areasCompact.deleteAreaFailed'));
              }
            })();
          },
        },
      ],
    );
  };

  const startManageMode = useCallback(() => {
    setOrganizeDragMode(false);
    setDraftConfig(lifeAreasConfig);
    setManageMode(true);
  }, [lifeAreasConfig]);

  const cancelManageMode = useCallback(() => {
    setManageMode(false);
    setDraftConfig(null);
  }, []);

  const confirmManageMode = useCallback(async () => {
    if (!draftConfig || savingDraft) return;
    setSavingDraft(true);
    try {
      const ok = await saveConfig(draftConfig);
      if (!ok) {
        Alert.alert(t('areasCompact.manageSaveFailed'));
        return;
      }
      setManageMode(false);
      setDraftConfig(null);
      void loadLooseTasks();
      onChanged?.();
      Alert.alert(t('areasCompact.manageSavedTitle'), t('areasCompact.manageSavedBody'));
    } finally {
      setSavingDraft(false);
    }
  }, [draftConfig, loadLooseTasks, onChanged, saveConfig, savingDraft, t]);

  const handleDeleteProject = useCallback(
    (project: ProjectLibraryItem) => {
      confirmDeleteProject(t, project.name, async () => {
        const result = await deleteProjectById(project.id);
        if (result.ok) {
          onChanged?.();
          return;
        }
        Alert.alert(t('errors.saveTaskFailed'));
      });
    },
    [onChanged, t],
  );

  if (loading || lifeAreasLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
      </View>
    );
  }

  if (projects.length === 0 && looseCount === 0 && !hasPersonalizedLifeAreasConfig(lifeAreasConfig)) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('areasCompact.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('areasCompact.emptyBody')}</Text>
        {onGoCapture ? (
          <CalmPrimaryButton
            label={t('vaciar.segmentGoCapture')}
            onPress={onGoCapture}
            style={styles.captureCtaBtn}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CalmCard style={styles.overviewCard}>
        <View style={styles.chrome}>
          <View style={styles.chromeText}>
            <Text style={styles.chromeTitle}>{t('areasCompact.headlineShort')}</Text>
            <Text style={styles.chromeMeta}>
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
          </View>
          <View style={styles.chromeActions}>
            {!manageMode && organizableLooseCount > 0 ? (
              <TouchableOpacity
                style={[styles.chromeIconBtn, organizeDragMode && styles.chromeIconBtnActive]}
                onPress={() => setOrganizeDragMode((current) => !current)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('areasCompact.organizeToggle')}
                accessibilityState={{ selected: organizeDragMode }}
              >
                <GripVertical size={16} color={THEME.colors.calm.lavenderDeep} />
              </TouchableOpacity>
            ) : null}
            {!manageMode ? (
              <TouchableOpacity
                style={styles.chromeIconBtn}
                onPress={startManageMode}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('areasCompact.manageAreasA11y')}
              >
                <Pencil size={16} color={THEME.colors.calm.lavenderDeep} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </CalmCard>

      <AreasQuickAddBar
        compact
        hasCheckInToday={hasCheckInToday}
        onOpenPlan={onPlanQuickAdd}
        onSaved={(title) => {
          handleQuickAddSaved(title);
        }}
        onError={() => Alert.alert(t('errors.saveTaskFailed'))}
      />

      {looseTasksLoadFailed ? (
        <CalmCard style={styles.loadErrorBanner}>
          <TouchableOpacity
            onPress={() => void loadLooseTasks()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('areasCompact.looseTasksRetryA11y')}
          >
            <Text style={styles.loadErrorText}>{t('areasCompact.looseTasksLoadFailed')}</Text>
            <Text style={styles.loadErrorRetry}>{t('errors.refreshFailed')}</Text>
          </TouchableOpacity>
        </CalmCard>
      ) : null}

      {!manageMode && !organizeDragMode && overdueTasks.length > 0 ? (
        <CalmCard style={styles.overdueCard}>
          <TouchableOpacity
            style={styles.overdueHeader}
            onPress={() => setShowOverdueList((current) => !current)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ expanded: showOverdueList }}
            accessibilityLabel={
              showOverdueList
                ? t('areasCompact.overdueHideA11y')
                : t('areasCompact.overdueShowA11y', { count: overdueTasks.length })
            }
          >
            <View style={styles.overdueTitleRow}>
              {showOverdueList ? (
                <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} strokeWidth={2.2} />
              ) : (
                <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} strokeWidth={2.2} />
              )}
              <Clock size={18} color={THEME.colors.calm.lavenderDeep} strokeWidth={2.2} />
              <Text style={styles.overdueTitle}>{t('areasCompact.overdueSectionTitle')}</Text>
            </View>
            <View style={styles.overdueHeaderMeta}>
              <Text style={styles.overdueCount}>
                {countLabel(
                  overdueTasks.length,
                  'areasCompact.overdueOne',
                  'areasCompact.overdueMany',
                  t,
                )}
              </Text>
              <Text style={styles.overdueToggleText}>
                {showOverdueList
                  ? t('areasCompact.overdueHide')
                  : t('areasCompact.overdueShow')}
              </Text>
            </View>
          </TouchableOpacity>
          {showOverdueList ? (
            <>
              <Text style={styles.overdueHint}>{t('areasCompact.overdueSectionHint')}</Text>
              <View style={styles.overdueList}>
                {overdueTasks.map((task) => {
                  const dateLabel =
                    formatProjectDueDate(normalizeScheduledDate(task.scheduled_date), locale) ??
                    normalizeScheduledDate(task.scheduled_date) ??
                    '';
                  return (
                    <LooseTaskMiniRow
                      key={task.id}
                      task={task}
                      metaLabel={t('areasCompact.overdueMeta', { date: dateLabel })}
                      accentColor={THEME.colors.calm.lavenderDeep}
                      backgroundColor={THEME.colors.fill[100]}
                      onEdit={() => handleEditLooseTask(task)}
                      onDelete={() => handleDeleteLooseTask(task)}
                      onMoveRequest={
                        task.project_id ? undefined : () => handleRequestMoveLooseTask(task)
                      }
                    />
                  );
                })}
              </View>
            </>
          ) : null}
        </CalmCard>
      ) : null}

      {manageMode ? (
        <CalmCard style={styles.manageCard}>
          <Text style={styles.manageTitle}>{t('areasCompact.manageTitle')}</Text>
          <Text style={styles.manageHint}>{t('areasCompact.manageHint')}</Text>
          <TouchableOpacity
            style={styles.manageAddAreaBtn}
            onPress={() => setEditTarget({ kind: 'new' })}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('areasCompact.newAreaA11y')}
          >
            <Plus size={16} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.manageAddAreaText}>{t('areasCompact.newArea')}</Text>
          </TouchableOpacity>
          <View style={styles.manageList}>
            {manageAreaList.map((area) => (
              <ManageAreaRow
                key={area.ref}
                area={area}
                onEdit={() => openEditArea(area)}
                onDelete={() => confirmRemoveArea(area)}
              />
            ))}
          </View>
          <View style={styles.manageFooter}>
            <TouchableOpacity
              onPress={cancelManageMode}
              style={styles.manageCancelBtn}
              accessibilityRole="button"
            >
              <Text style={styles.manageCancelText}>{t('areasCompact.manageCancel')}</Text>
            </TouchableOpacity>
            <CalmPrimaryButton
              label={t('areasCompact.manageDone')}
              onPress={() => void confirmManageMode()}
              loading={savingDraft}
              disabled={savingDraft}
            />
          </View>
        </CalmCard>
      ) : (
        <>
          {allGroups.length > 0 && emptyAreaCount > 0 && !organizeDragMode ? (
            <TouchableOpacity
              style={styles.emptyAreasToggle}
              onPress={() => setShowEmptyAreas((current) => !current)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                showEmptyAreas
                  ? t('areasCompact.hideEmptyAreasA11y')
                  : t('areasCompact.showEmptyAreasA11y', { count: emptyAreaCount })
              }
            >
              <Text style={styles.emptyAreasToggleText}>
                {showEmptyAreas
                  ? t('areasCompact.hideEmptyAreas')
                  : t('areasCompact.showEmptyAreas', { count: emptyAreaCount })}
              </Text>
            </TouchableOpacity>
          ) : null}

          {organizeDragMode ? (
            <CalmCard style={styles.organizeCard}>
              <Text style={styles.organizeTitle}>{t('areasCompact.organizeDragTitle')}</Text>
              <Text style={styles.organizeHint}>{t('areasCompact.organizeDragHint')}</Text>
              <AreasPlannerDragBoard
                columns={plannerColumns}
                areas={plannerAreas}
                onMoveTask={(taskId, _sourceColumnId, targetColumnId) =>
                  handleMoveLooseTask(taskId, targetColumnId as LifeAreaRef)
                }
                onRequestMoveSheet={(taskId) => {
                  const task = looseTaskById.get(taskId);
                  if (task) handleRequestMoveLooseTask(task);
                }}
                onPressTask={(taskId) => {
                  const task = looseTaskById.get(taskId);
                  if (task) handleEditLooseTask(task);
                }}
                onDeleteTask={(taskId) => {
                  const task = looseTaskById.get(taskId);
                  if (task) handleDeleteLooseTask(task);
                }}
                emptyColumnHint={t('areasCompact.looseDragDropHere')}
                moveA11yLabel={(title) => t('areasCompact.moveTaskA11y', { task: title })}
                deleteA11yLabel={(title) => t('looseTasks.deleteTaskA11y', { task: title })}
              />
            </CalmCard>
          ) : (
            displayGroups.map((group) => (
              <AreaSection
                key={group.area.ref}
                area={group.area}
                areaIndex={group.areaIndex}
                projects={group.projects}
                looseTasks={group.looseTasks}
                nextActions={nextActions}
                locale={locale}
                defaultExpanded={group.projects.length > 0 || group.looseTasks.length > 0}
                onAddTask={onAddTask}
                onCreateProject={onCreateProject}
                onDeleteProject={handleDeleteProject}
                onEditLooseTask={handleEditLooseTask}
                onDeleteLooseTask={handleDeleteLooseTask}
                onMoveLooseTask={handleRequestMoveLooseTask}
              />
            ))
          )}
        </>
      )}

      <TaskEditModal
        visible={editingLooseTask != null}
        task={editingLooseTask}
        projects={editProjects}
        userId={userId}
        saving={planEditSaving}
        onSavePlan={(payload) => void savePlan(payload)}
        onDelete={() => void handleDeleteEditingLooseTask()}
        onClose={() => setEditingLooseTask(null)}
      />

      <AreasMoveToAreaSheet
        visible={looseMoveTarget != null}
        target={looseMoveTarget}
        areas={allGroups.map((group) => group.area)}
        onClose={() => setLooseMoveTarget(null)}
        onSelectArea={(areaRef) => {
          if (!looseMoveTarget || looseMoveTarget.kind !== 'loose') return;
          void handleMoveLooseTask(looseMoveTarget.taskId, areaRef);
        }}
        onAddArea={
          looseMoveTarget
            ? () => {
                setMoveTargetForNewArea(looseMoveTarget);
                setLooseMoveTarget(null);
                setEditTarget({ kind: 'new' });
              }
            : undefined
        }
      />

      <AreaNameEditSheet
        visible={editTarget !== null}
        title={
          editTarget?.kind === 'new'
            ? t('areasCompact.newArea')
            : t('areasCompact.renameArea')
        }
        initialName={editTarget?.kind === 'new' ? '' : (editTarget?.name ?? '')}
        initialEmoji={
          editTarget?.kind === 'custom'
            ? editTarget.emoji
            : editTarget?.kind === 'new'
              ? '🌿'
              : undefined
        }
        initialColor={
          editTarget?.kind === 'custom'
            ? editTarget.color
            : undefined
        }
        showEmoji={editTarget?.kind === 'new' || editTarget?.kind === 'custom'}
        showColor={editTarget?.kind === 'new' || editTarget?.kind === 'custom'}
        canDelete={editTarget?.kind !== 'new' && editTarget?.kind !== undefined}
        deleteLabel={t('areasCompact.deleteArea')}
        onDelete={handleDeleteArea}
        onClose={() => {
          setEditTarget(null);
          setMoveTargetForNewArea(null);
        }}
        onSave={handleSaveArea}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.layout.sectionGapCompact,
  },
  overviewCard: {
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  chrome: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  chromeText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  chromeTitle: {
    ...THEME.typography.sectionTitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    fontSize: 22,
    lineHeight: 28,
  },
  chromeMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  chromeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  chromeIconBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  chromeIconBtnActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  emptyAreasToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minHeight: 32,
    justifyContent: 'center',
  },
  overdueCard: {
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.calm.lavenderDeep,
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  overdueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexShrink: 1,
    minWidth: 0,
  },
  overdueTitle: {
    ...THEME.typography.sectionTitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    fontSize: 18,
    lineHeight: 24,
  },
  overdueHeaderMeta: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  overdueCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  overdueToggleText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  overdueHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  overdueList: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  emptyAreasToggleText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
  manageAddAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 36,
    maxWidth: '100%',
  },
  manageAddAreaText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    flexShrink: 1,
    lineHeight: 18,
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
  captureCtaBtn: {
    marginTop: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  areaShell: {
    borderLeftWidth: 3,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  areaHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  areaColorDot: {
    width: THEME.spacing.xs,
    height: THEME.spacing.xs,
    borderRadius: THEME.spacing.xs / 2,
    flexShrink: 0,
  },
  areaHeaderText: {
    flex: 1,
    flexShrink: 1,
    gap: 4,
    minWidth: 0,
  },
  areaName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
    flexShrink: 1,
  },
  areaMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    flexShrink: 1,
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
  projectCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    backgroundColor: THEME.colors.calm.mist,
  },
  projectMain: {
    flex: 1,
    minWidth: 0,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  projectMainCompact: {
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
    gap: 2,
    justifyContent: 'center',
  },
  projectTopBlock: {
    gap: 2,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  projectDot: {
    width: THEME.spacing.xs,
    height: THEME.spacing.xs,
    borderRadius: THEME.spacing.xs / 2,
    flexShrink: 0,
  },
  projectName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
    flexShrink: 1,
    lineHeight: 22,
  },
  projectNameCompact: {
    minWidth: 0,
  },
  projectCompactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: THEME.spacing.xs,
    flexShrink: 0,
  },
  projectCompactAddBtn: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    flexShrink: 0,
  },
  projectCompactOpenBtn: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  projectPercent: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    alignSelf: 'flex-start',
    paddingLeft: 18,
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: THEME.borderRadius.pill,
    minWidth: 0,
  },
  projectProgressDetail: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    flexShrink: 1,
  },
  projectProgressDetailCompact: {
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    paddingLeft: THEME.spacing.sm,
  },
  projectMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    flexShrink: 1,
  },
  projectNext: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 18,
    flexShrink: 1,
  },
  projectActions: {
    flexDirection: 'column',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  projectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  projectActionText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
    flexShrink: 1,
    lineHeight: 18,
  },
  projectActionDanger: {
    color: THEME.colors.semantic.danger,
  },
  areaActionsCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  areaActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.xs,
    minHeight: 36,
  },
  areaActionLinkText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
  areaActionLinkMuted: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  looseInAreaBlock: {
    gap: THEME.spacing.xs,
  },
  looseInAreaBlockSeparated: {
    marginTop: THEME.spacing.xs,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  looseInAreaList: {
    gap: THEME.spacing.xs,
  },
  manageCard: {
    gap: THEME.spacing.sm,
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.mist,
  },
  manageTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  manageHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  manageList: {
    gap: THEME.spacing.xs,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  manageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  manageRowBody: {
    flex: 1,
    minWidth: 0,
  },
  manageRowName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
    flexShrink: 1,
  },
  manageIconBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  manageCancelBtn: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  manageCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  loadErrorBanner: {
    gap: 4,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.blush,
    borderColor: THEME.colors.semantic.danger,
  },
  loadErrorText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  loadErrorRetry: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  organizeCard: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
  },
  organizeTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  organizeHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
