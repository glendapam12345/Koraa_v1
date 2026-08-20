import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { FolderKanban } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { SavedSummaryEditableTaskRow } from '@/components/frentes/SavedSummaryEditableTaskRow';
import { BrainDumpMoveAreaPicker } from '@/components/frentes/BrainDumpMoveAreaPicker';
import { AreaNameEditSheet } from '@/components/projects/AreaNameEditSheet';
import { useProjectsLibrary } from '@/hooks/useProjectsLibrary';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { supabase } from '@/lib/supabase';
import { computeProjectProgress, formatProjectDueDate } from '@/lib/projectProgress';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  buildSavedSummaryAreaGroups,
  type SavedOrganizedContext,
  type SavedSummaryAreaGroup,
  type SavedSummaryPreviewItem,
} from '@/lib/review/buildBrainDumpSavedSummary';
import { ensureBrainDumpPresetInConfig } from '@/lib/review/brainDumpAreaPreset';
import {
  buildBrainDumpAreaBoardModel,
  columnIdToLifeAreaKey,
} from '@/lib/review/buildBrainDumpAreaBoardModel';
import { saveTaskPlanEdit } from '@/lib/vnext/saveTaskPlanEdit';
import { getDefaultPlanningMeta } from '@/lib/taskPlanningMeta';
import type { LooseTaskSummary } from '@/lib/looseTasks';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';

type BrainDumpSavedSummaryScreenProps = {
  userId: string;
  hasCheckInToday: boolean | null;
  savedContext: SavedOrganizedContext;
  onViewOrganized: () => void;
  onGoToHoy: () => void;
  onGoToCheckIn: () => void;
  onCaptureMore: () => void;
};

function movingItemKeyFor(item: SavedSummaryPreviewItem): string {
  return item.taskId ?? item.captureId ?? item.content.trim();
}

function buildEllieOrganizedMessage(
  groups: SavedSummaryAreaGroup[],
  taskCount: number,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  if (groups.length === 0) {
    return taskCount === 1
      ? t('vaciar.ellieOrganizedFallbackOne')
      : t('vaciar.ellieOrganizedFallback', { count: taskCount });
  }
  if (groups.length === 1) {
    const group = groups[0];
    const area = group.area.name;
    if (group.looseTasks.length >= taskCount) {
      return taskCount === 1
        ? t('vaciar.ellieOrganizedLooseInAreaOne', { area })
        : t('vaciar.ellieOrganizedLooseInArea', { area, count: taskCount });
    }
    return taskCount === 1
      ? t('vaciar.ellieOrganizedOneAreaOne', { area })
      : t('vaciar.ellieOrganizedOneArea', { area, count: taskCount });
  }
  return t('vaciar.ellieOrganizedMulti', { count: taskCount, areas: groups.length });
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

function SummaryProjectRow({
  project,
  isNew,
  locale,
}: {
  project: ProjectLibraryItem;
  isNew: boolean;
  locale: 'es' | 'en';
}) {
  const { t } = useI18n();
  const progress = computeProjectProgress(project.taskCount, project.incompleteCount);
  const dueLabel = formatProjectDueDate(project.dueDate, locale);

  return (
    <TouchableOpacity
      style={styles.projectRow}
      onPress={() => router.push(`/project/${project.id}` as Href)}
      activeOpacity={0.88}
      accessibilityRole="button"
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

      <View style={styles.projectMetaRow}>
        {progress.total > 0 ? (
          <Text style={styles.projectMeta}>
            {t('areasCompact.progressDetail', {
              done: progress.completed,
              total: progress.total,
            })}
          </Text>
        ) : (
          <Text style={styles.projectMeta}>
            {t('areasCompact.taskOpenMany', { count: project.incompleteCount })}
          </Text>
        )}
        {dueLabel ? (
          <Text style={styles.projectDue}>{t('areasCompact.deadline', { date: dueLabel })}</Text>
        ) : null}
        {isNew ? <Text style={styles.newBadge}>{t('vaciar.areaReviewDraftProject')}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function SummaryAreaBlock({
  group,
  areaIndex,
  newProjectIds,
  locale,
  onItemUpdated,
  onRequestMoveArea,
}: {
  group: SavedSummaryAreaGroup;
  areaIndex: number;
  newProjectIds: Set<string>;
  locale: 'es' | 'en';
  onItemUpdated: (item: SavedSummaryPreviewItem) => void;
  onRequestMoveArea: (item: SavedSummaryPreviewItem) => void;
}) {
  const { t } = useI18n();
  const themeKey = group.area.catalogKey ?? 'other';
  const theme = frontThemeForKey(themeKey, areaIndex);

  return (
    <View style={[styles.areaBlock, { borderLeftColor: theme.accent }]}>
      <View style={styles.areaHeader}>
        <Text style={styles.areaEmoji}>{group.area.emoji}</Text>
        <View style={styles.areaHeaderText}>
          <Text style={[styles.areaEyebrow, { color: theme.accent }]}>
            {t('areasCompact.areaLabel')}
          </Text>
          <Text style={styles.areaName}>{group.area.name}</Text>
          <Text style={styles.areaMeta}>
            {t('vaciar.organizedSummaryAreaMeta', {
              projectLabel:
                group.projects.length === 1
                  ? t('vaciar.organizedSummaryProjectOne')
                  : t('vaciar.organizedSummaryProjectMany', {
                      count: group.projects.length,
                    }),
              taskLabel:
                group.looseTasks.length === 1
                  ? t('vaciar.organizedSummaryTaskOne')
                  : t('vaciar.organizedSummaryTaskMany', {
                      count: group.looseTasks.length,
                    }),
            })}
          </Text>
        </View>
      </View>

      {group.projects.length > 0 ? (
        <View style={styles.projectList}>
          {group.projects.map((project) => (
            <SummaryProjectRow
              key={project.id}
              project={project}
              isNew={newProjectIds.has(project.id)}
              locale={locale}
            />
          ))}
        </View>
      ) : null}

      {group.looseTasks.length > 0 ? (
        <View style={styles.looseTaskList}>
          {group.looseTasks.map((task, index) => (
            <SavedSummaryEditableTaskRow
              key={movingItemKeyFor(task)}
              item={task}
              locale={locale}
              onUpdated={(updated) => onItemUpdated(updated)}
              onRequestMoveArea={() => onRequestMoveArea(task)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function BrainDumpSavedSummaryScreen({
  userId,
  hasCheckInToday,
  savedContext,
  onViewOrganized,
  onGoToHoy,
  onGoToCheckIn,
  onCaptureMore,
}: BrainDumpSavedSummaryScreenProps) {
  const { t, locale } = useI18n();
  const { projects, looseCount, loading, reload } = useProjectsLibrary(userId, {
    hasCheckInToday,
  });
  const { config: lifeAreasConfig, loading: lifeAreasLoading, addCustomArea } =
    useUserLifeAreas(userId);
  const [looseTasks, setLooseTasks] = useState<LooseTaskSummary[]>([]);
  const [editableItems, setEditableItems] = useState(savedContext.previewItems);
  const [movingItemKey, setMovingItemKey] = useState<string | null>(null);
  const [pendingMoveItemKey, setPendingMoveItemKey] = useState<string | null>(null);
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [createdAreaName, setCreatedAreaName] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const getDefaultLabel = useCallback(
    (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey),
    [t],
  );

  const getPresetCustomLabel = useCallback(
    (presetCustomId: string) => t(`lifeAreasPreset.${presetCustomId}` as TranslationKey),
    [t],
  );

  const effectiveConfig = useMemo(
    () => ensureBrainDumpPresetInConfig(lifeAreasConfig),
    [lifeAreasConfig],
  );

  const newProjectIds = useMemo(
    () => new Set(savedContext.newProjectIds),
    [savedContext.newProjectIds],
  );

  useEffect(() => {
    setEditableItems(savedContext.previewItems);
  }, [savedContext.previewItems]);

  useEffect(() => {
    reload(true);
  }, [reload]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, content, created_at, scheduled_date, life_area_key, is_completed')
        .eq('user_id', userId)
        .is('project_id', null)
        .is('parent_task_id', null)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      setLooseTasks((data as LooseTaskSummary[]) ?? []);
    })();
  }, [userId]);

  useEffect(() => {
    if (looseTasks.length === 0) return;
    setEditableItems((current) =>
      current.map((item) => {
        if (item.taskId) return item;
        const match = looseTasks.find((task) => task.content.trim() === item.content.trim());
        return match ? { ...item, taskId: match.id } : item;
      }),
    );
  }, [looseTasks]);

  useEffect(() => {
    if (!createdAreaName) return;
    const timer = setTimeout(() => setCreatedAreaName(null), 5000);
    return () => clearTimeout(timer);
  }, [createdAreaName]);

  const effectiveContext = useMemo(
    (): SavedOrganizedContext => ({
      ...savedContext,
      previewItems: editableItems,
      affectedAreaRefs: [
        ...new Set(
          editableItems
            .map((item) => item.lifeAreaKey)
            .filter((ref): ref is LifeAreaRef => ref != null),
        ),
      ],
    }),
    [editableItems, savedContext],
  );

  const areaGroups = useMemo(
    () =>
      buildSavedSummaryAreaGroups(
        projects,
        effectiveConfig,
        getDefaultLabel,
        looseTasks,
        effectiveContext,
        t('lifeAreas.other'),
        getPresetCustomLabel,
      ),
    [
      projects,
      effectiveConfig,
      getDefaultLabel,
      getPresetCustomLabel,
      looseTasks,
      effectiveContext,
      t,
    ],
  );

  const looseLabel = t('projectsUi.looseTitle');
  const looseInAreaLabel = t('vaciar.areaReviewLooseInArea');
  const { columns } = useMemo(
    () =>
      buildBrainDumpAreaBoardModel(
        [],
        effectiveConfig,
        getDefaultLabel,
        looseLabel,
        locale,
        [],
        looseInAreaLabel,
        true,
        getPresetCustomLabel,
      ),
    [effectiveConfig, getDefaultLabel, getPresetCustomLabel, looseLabel, locale, looseInAreaLabel],
  );

  const ellieMessage = useMemo(
    () => buildEllieOrganizedMessage(areaGroups, savedContext.taskCount, t),
    [areaGroups, savedContext.taskCount, t],
  );

  const previewLooseCount = useMemo(
    () => savedContext.previewItems.filter((item) => !item.projectId).length,
    [savedContext.previewItems],
  );

  const movingItem = useMemo(() => {
    if (!movingItemKey) return null;
    return (
      editableItems.find((item) => movingItemKeyFor(item) === movingItemKey) ?? null
    );
  }, [editableItems, movingItemKey]);

  const handleItemUpdated = useCallback((updated: SavedSummaryPreviewItem) => {
    setEditableItems((current) =>
      current.map((item) => {
        const sameTask = updated.taskId && item.taskId === updated.taskId;
        const sameCapture = updated.captureId && item.captureId === updated.captureId;
        const sameContent =
          !updated.taskId &&
          !updated.captureId &&
          item.content.trim() === updated.content.trim();
        if (sameTask || sameCapture || sameContent) return updated;
        return item;
      }),
    );
    setSaveNotice(null);
  }, []);

  const moveItemToArea = useCallback(
    async (item: SavedSummaryPreviewItem, nextRef: LifeAreaRef | null) => {
      if (!item.taskId) return false;
      const updated: SavedSummaryPreviewItem = {
        ...item,
        lifeAreaKey: nextRef,
      };
      const result = await saveTaskPlanEdit({
        taskId: item.taskId,
        content: item.content,
        scheduledDate: item.scheduledDate ?? null,
        projectId: item.projectId,
        effort: null,
        planning: {
          ...getDefaultPlanningMeta(),
          estimatedMinutes: item.estimatedMinutes ?? undefined,
          preferredTime: item.preferredTime ?? undefined,
        },
        isPriority: item.isPriority ?? false,
        lifeAreaKey: nextRef,
      });
      if (!result.ok) {
        setSaveNotice(t('errors.saveTaskFailed'));
        return false;
      }
      handleItemUpdated(updated);
      setSaveNotice(null);
      return true;
    },
    [handleItemUpdated, t],
  );

  const handleMoveArea = useCallback(
    async (targetColumnId: string) => {
      if (!movingItem?.taskId) {
        setMovingItemKey(null);
        return;
      }
      const nextRef = columnIdToLifeAreaKey(targetColumnId);
      const ok = await moveItemToArea(movingItem, nextRef);
      setMovingItemKey(null);
      if (!ok) return;
    },
    [moveItemToArea, movingItem],
  );

  const openAddAreaForMove = useCallback(() => {
    if (!movingItemKey) return;
    setPendingMoveItemKey(movingItemKey);
    setMovingItemKey(null);
    setAddAreaOpen(true);
  }, [movingItemKey]);

  const handleAddArea = useCallback(
    async (name: string, emoji?: string, color?: string) => {
      const result = await addCustomArea(name, emoji ?? '🌿', color);
      if (!result.ok || !result.entry) return;
      setAddAreaOpen(false);
      setCreatedAreaName(result.entry.name);

      const itemKey = pendingMoveItemKey;
      if (itemKey) {
        const item = editableItems.find((entry) => movingItemKeyFor(entry) === itemKey);
        if (item?.taskId) {
          await moveItemToArea(item, makeCustomLifeAreaRef(result.entry.id));
        }
      }
      setPendingMoveItemKey(null);
    },
    [addCustomArea, editableItems, moveItemToArea, pendingMoveItemKey],
  );

  const needsCheckIn = hasCheckInToday === false;
  const isLoading = loading || lifeAreasLoading;

  return (
    <View style={styles.root}>
      <OnboardingEllieCoach
        message={ellieMessage}
        mood="happy"
        size={72}
        withBottomGap={false}
        accessible={false}
      />

      {savedContext.newProjectIds.length > 0 ? (
        <Text style={styles.heroMeta}>
          {t('vaciar.organizedSummaryNewProjects', {
            count: savedContext.newProjectIds.length,
          })}
        </Text>
      ) : null}

      {saveNotice ? <Text style={styles.saveNotice}>{saveNotice}</Text> : null}
      {createdAreaName ? (
        <Text style={styles.createdAreaNotice}>
          {t('vaciar.areaReviewAreaCreated', { name: createdAreaName })}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {areaGroups.length > 0 ? (
            areaGroups.map((group, index) => (
              <SummaryAreaBlock
                key={group.area.ref}
                group={group}
                areaIndex={index}
                newProjectIds={newProjectIds}
                locale={locale}
                onItemUpdated={handleItemUpdated}
                onRequestMoveArea={(item) => setMovingItemKey(movingItemKeyFor(item))}
              />
            ))
          ) : (
            <CalmCard style={styles.emptyCard}>
              <FolderKanban size={28} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.emptyText}>{t('vaciar.organizedSummaryEmpty')}</Text>
            </CalmCard>
          )}

          {looseCount > 0 && previewLooseCount > 0 ? (
            <Text style={styles.globalLoose}>
              {previewLooseCount === 1
                ? t('vaciar.organizedSummaryLooseOne')
                : t('vaciar.organizedSummaryLoose', { count: previewLooseCount })}
            </Text>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <CalmPrimaryButton
          label={t('vaciar.viewOrganizedLink')}
          onPress={onViewOrganized}
          large
        />

        <TouchableOpacity
          onPress={needsCheckIn ? onGoToCheckIn : onGoToHoy}
          style={styles.secondaryLink}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>
            {needsCheckIn ? t('vaciar.savedGoCheckIn') : t('vaciar.savedGoHoySecondary')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCaptureMore}
          style={styles.secondaryLink}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>{t('vaciar.organizedSummaryCaptureMore')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={movingItemKey != null}
        transparent
        animationType="slide"
        onRequestClose={() => setMovingItemKey(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <BrainDumpMoveAreaPicker
              columns={columns}
              currentAreaRef={movingItem?.lifeAreaKey ?? null}
              onMove={(columnId) => void handleMoveArea(columnId)}
              onAddArea={openAddAreaForMove}
              looseLabel={looseLabel}
            />
            <TouchableOpacity
              onPress={() => setMovingItemKey(null)}
              style={styles.modalClose}
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>{t('commonExtra.close')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AreaNameEditSheet
        visible={addAreaOpen}
        title={t('vaciar.areaReviewAddAreaTitle')}
        initialName=""
        initialEmoji="🌿"
        showEmoji
        showColor
        onClose={() => {
          setAddAreaOpen(false);
          setPendingMoveItemKey(null);
        }}
        onSave={handleAddArea}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: THEME.spacing.sm,
  },
  heroMeta: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
  },
  saveNotice: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
    textAlign: 'center',
  },
  createdAreaNotice: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  centered: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaBlock: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 4,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  areaEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  areaHeaderText: {
    flex: 1,
    gap: 2,
  },
  areaEyebrow: {
    ...THEME.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.heading.bold,
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
  projectList: {
    gap: THEME.spacing.xs,
  },
  projectRow: {
    gap: 6,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
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
    flex: 1,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  projectPercent: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  projectMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  projectMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  projectDue: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  newBadge: {
    ...THEME.typography.micro,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
  },
  looseTaskList: {
    gap: THEME.spacing.xs,
    paddingTop: 2,
  },
  globalLoose: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.lg,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
  },
  secondaryLink: {
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: THEME.colors.overlay,
  },
  modalSheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  modalClose: {
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
