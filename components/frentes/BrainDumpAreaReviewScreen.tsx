import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { AreaNameEditSheet } from '@/components/projects/AreaNameEditSheet';
import { BrainDumpAreaDragBoard } from '@/components/frentes/BrainDumpAreaDragBoard';
import { BrainDumpCreateProjectSheet } from '@/components/frentes/BrainDumpCreateProjectSheet';
import { BrainDumpMoveAreaPicker } from '@/components/frentes/BrainDumpMoveAreaPicker';
import { BrainDumpTaskProjectPicker } from '@/components/frentes/BrainDumpTaskProjectPicker';
import { ReviewPreviewTaskRow } from '@/components/frentes/ReviewPreviewTaskRow';
import {
  buildBrainDumpAreaBoardModel,
  columnIdToLifeAreaKey,
  type BrainDumpAreaColumn,
} from '@/lib/review/buildBrainDumpAreaBoardModel';
import {
  brainDumpPresetConfigChanged,
  ensureBrainDumpPresetInConfig,
} from '@/lib/review/brainDumpAreaPreset';
import { applyInferredLifeAreas } from '@/lib/review/inferCaptureItemLifeArea';
import {
  assignItemToProject,
  createDraftBrainDumpProject,
  mergeBrainDumpProjects,
  toBrainDumpReviewProject,
  type BrainDumpReviewProject,
} from '@/lib/review/brainDumpProjects';

type BrainDumpAreaReviewScreenProps = {
  locale: AppLocale;
  userId?: string;
  items: EnrichedCaptureItem[];
  existingProjects?: {
    id: string;
    name: string;
    due_date?: string | null;
    color?: string | null;
    life_area_key?: string | null;
  }[];
  onItemsChange: (items: EnrichedCaptureItem[]) => void;
  onBack: () => void;
  onConfirm: (payload: {
    items: EnrichedCaptureItem[];
    draftProjects: BrainDumpReviewProject[];
  }) => void;
  isSaving: boolean;
  isRefining?: boolean;
};

type RenameTarget = {
  ref: LifeAreaRef;
  name: string;
  emoji: string;
  isCustom: boolean;
  customId?: string;
};

export function BrainDumpAreaReviewScreen({
  locale,
  userId,
  items,
  existingProjects = [],
  onItemsChange,
  onBack,
  onConfirm,
  isSaving,
  isRefining = false,
}: BrainDumpAreaReviewScreenProps) {
  const { t } = useI18n();
  const {
    config: lifeAreasConfig,
    loading: lifeAreasLoading,
    renameBuiltinArea,
    renameCustomArea,
    addCustomArea,
    saveConfig,
  } = useUserLifeAreas(userId);

  const presetEnsuredRef = useRef(false);
  const inferenceAppliedRef = useRef(false);

  const [draftProjects, setDraftProjects] = useState<BrainDumpReviewProject[]>([]);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [createProjectColumn, setCreateProjectColumn] = useState<BrainDumpAreaColumn | null>(null);
  const [pendingAssignTaskId, setPendingAssignTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createdAreaName, setCreatedAreaName] = useState<string | null>(null);

  const getDefaultLabel = useCallback(
    (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey),
    [t],
  );

  const effectiveConfig = useMemo(
    () => ensureBrainDumpPresetInConfig(lifeAreasConfig),
    [lifeAreasConfig],
  );

  const savedProjects = useMemo(
    () => existingProjects.map((project) => toBrainDumpReviewProject(project)),
    [existingProjects],
  );

  const allProjects = useMemo(
    () => mergeBrainDumpProjects(savedProjects, draftProjects),
    [draftProjects, savedProjects],
  );

  useEffect(() => {
    if (!userId || lifeAreasLoading || presetEnsuredRef.current) return;
    if (!brainDumpPresetConfigChanged(lifeAreasConfig, effectiveConfig)) {
      presetEnsuredRef.current = true;
      return;
    }
    presetEnsuredRef.current = true;
    void saveConfig(effectiveConfig);
  }, [userId, lifeAreasLoading, lifeAreasConfig, effectiveConfig, saveConfig]);

  useEffect(() => {
    if (inferenceAppliedRef.current || items.length === 0) return;
    const needsInference = items.some((item) => item.lifeAreaKey == null);
    if (!needsInference) {
      inferenceAppliedRef.current = true;
      return;
    }
    inferenceAppliedRef.current = true;
    onItemsChange(applyInferredLifeAreas(items));
  }, [items, onItemsChange]);

  const looseLabel = t('projectsUi.looseTitle');
  const looseInAreaLabel = t('vaciar.areaReviewLooseInArea');

  const { columns, areas, countsLine } = useMemo(
    () =>
      buildBrainDumpAreaBoardModel(
        items,
        effectiveConfig,
        getDefaultLabel,
        looseLabel,
        locale,
        allProjects,
        looseInAreaLabel,
      ),
    [items, effectiveConfig, getDefaultLabel, looseLabel, locale, allProjects, looseInAreaLabel],
  );

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingTaskId) ?? null,
    [items, editingTaskId],
  );

  const clearProjectIfWrongArea = useCallback(
    (item: EnrichedCaptureItem, lifeAreaKey: LifeAreaRef | null): EnrichedCaptureItem => {
      if (!item.selectedProjectId || !lifeAreaKey) {
        return {
          ...item,
          lifeAreaKey,
          ...assignItemToProject(false, null),
        };
      }
      const project = allProjects.find((entry) => entry.id === item.selectedProjectId);
      if (project && project.lifeAreaKey !== lifeAreaKey) {
        return {
          ...item,
          lifeAreaKey,
          ...assignItemToProject(false, null),
        };
      }
      return { ...item, lifeAreaKey };
    },
    [allProjects],
  );

  const handleMoveTask = useCallback(
    (taskId: string, targetColumnId: string) => {
      const lifeAreaKey = columnIdToLifeAreaKey(targetColumnId);
      onItemsChange(
        items.map((item) => {
          if (item.id !== taskId) return item;
          return clearProjectIfWrongArea(item, lifeAreaKey);
        }),
      );
    },
    [clearProjectIfWrongArea, items, onItemsChange],
  );

  const openRenameForColumn = useCallback((column: BrainDumpAreaColumn) => {
    if (column.isLoose || !column.ref) return;

    if (isCustomLifeAreaRef(column.ref)) {
      const customId = column.ref.slice('custom:'.length);
      setRenameTarget({
        ref: column.ref,
        name: column.name,
        emoji: column.emoji,
        isCustom: true,
        customId,
      });
      return;
    }

    setRenameTarget({
      ref: column.ref,
      name: column.name,
      emoji: column.emoji,
      isCustom: false,
    });
  }, []);

  const handleRenameSave = useCallback(
    async (name: string, emoji?: string) => {
      if (!renameTarget) return;
      if (renameTarget.isCustom && renameTarget.customId) {
        await renameCustomArea(renameTarget.customId, name, emoji);
      } else if (!renameTarget.isCustom) {
        await renameBuiltinArea(renameTarget.ref as LifeAreaKey, name);
      }
    },
    [renameTarget, renameBuiltinArea, renameCustomArea],
  );

  useEffect(() => {
    if (!createdAreaName) return;
    const timer = setTimeout(() => setCreatedAreaName(null), 5000);
    return () => clearTimeout(timer);
  }, [createdAreaName]);

  const handleAddArea = useCallback(
    async (name: string, emoji?: string) => {
      const result = await addCustomArea(name, emoji ?? '🌿');
      if (result.ok && result.entry) {
        setAddAreaOpen(false);
        setCreatedAreaName(result.entry.name);
      }
    },
    [addCustomArea],
  );

  const handleCreateProject = useCallback(
    (payload: { name: string; dueDate: string | null }) => {
      if (!createProjectColumn?.ref) return;
      const draft = createDraftBrainDumpProject(
        payload.name,
        createProjectColumn.ref,
        payload.dueDate,
      );
      setDraftProjects((current) => [...current, draft]);

      if (pendingAssignTaskId) {
        onItemsChange(
          items.map((item) =>
            item.id === pendingAssignTaskId
              ? { ...item, ...assignItemToProject(true, draft.id) }
              : item,
          ),
        );
        setPendingAssignTaskId(null);
      }
    },
    [createProjectColumn?.ref, items, onItemsChange, pendingAssignTaskId],
  );

  const handleOpenCreateProject = useCallback((column: BrainDumpAreaColumn) => {
    setPendingAssignTaskId(null);
    setCreateProjectColumn(column);
  }, []);

  const handleRequestCreateFromTask = useCallback(() => {
    if (!editingItem?.lifeAreaKey) return;
    const column = columns.find((entry) => entry.ref === editingItem.lifeAreaKey);
    if (!column) return;
    setPendingAssignTaskId(editingItem.id);
    setCreateProjectColumn(column);
  }, [columns, editingItem]);

  const handleMoveTaskFromSheet = useCallback(
    (targetColumnId: string) => {
      if (!editingTaskId) return;
      handleMoveTask(editingTaskId, targetColumnId);
    },
    [editingTaskId, handleMoveTask],
  );

  const handleConfirm = useCallback(() => {
    onConfirm({
      items,
      draftProjects,
    });
  }, [draftProjects, items, onConfirm]);

  const handleTaskChange = useCallback(
    (next: EnrichedCaptureItem) => {
      onItemsChange(items.map((item) => (item.id === next.id ? next : item)));
    },
    [items, onItemsChange],
  );

  const handleDeleteTask = useCallback(() => {
    if (!editingTaskId) return;
    onItemsChange(items.filter((item) => item.id !== editingTaskId));
    setEditingTaskId(null);
  }, [editingTaskId, items, onItemsChange]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.previewBackA11y')}
        >
          <ChevronLeft size={22} color={THEME.colors.text.main} />
          <Text style={styles.backLabel}>{t('vaciar.previewBack')}</Text>
        </TouchableOpacity>

        <Text style={styles.lead}>{t('vaciar.areaReviewSubtitle')}</Text>

        {countsLine ? (
          <Text style={styles.countsLine} numberOfLines={2}>
            {countsLine}
          </Text>
        ) : null}

        {isRefining ? (
          <View style={styles.refiningRow}>
            <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.refiningText}>{t('vaciar.previewRefining')}</Text>
          </View>
        ) : null}

        {createdAreaName ? (
          <Text style={styles.createdAreaBanner}>
            {t('vaciar.areaReviewAreaCreated', { name: createdAreaName })}
          </Text>
        ) : null}
      </View>

      <BrainDumpAreaDragBoard
        columns={columns}
        areas={areas}
        onMoveTask={handleMoveTask}
        onPressColumnHeader={openRenameForColumn}
        onPressTask={setEditingTaskId}
        onPressAddProject={handleOpenCreateProject}
        emptyColumnHint={t('vaciar.areaReviewEmptyColumn')}
        renameColumnA11y={t('vaciar.areaReviewRenameColumnA11y')}
        addProjectLabel={t('vaciar.areaReviewAddProject')}
        hideEmptyColumns
        dragHint={t('vaciar.areaReviewDragHint')}
        boardHint={t('vaciar.areaReviewDragTip')}
        looseSectionTitle={t('vaciar.areaReviewLooseSectionTitle')}
        areasSectionTitle={t('vaciar.areaReviewAreasSectionTitle')}
        areasFooter={
          <TouchableOpacity
            style={styles.addAreaButton}
            onPress={() => setAddAreaOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.areaReviewAddAreaA11y')}
          >
            <Plus size={18} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.addAreaLabel}>{t('vaciar.areaReviewAddArea')}</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.footer}>
        <CalmPrimaryButton
          label={t('vaciar.areaReviewConfirm')}
          onPress={handleConfirm}
          loading={isSaving}
          disabled={isSaving || items.length === 0}
        />
      </View>

      <AreaNameEditSheet
        visible={renameTarget != null}
        title={t('vaciar.areaReviewRenameTitle')}
        initialName={renameTarget?.name ?? ''}
        initialEmoji={renameTarget?.emoji ?? '🌿'}
        showEmoji={renameTarget?.isCustom ?? false}
        onClose={() => setRenameTarget(null)}
        onSave={handleRenameSave}
      />

      <AreaNameEditSheet
        visible={addAreaOpen}
        title={t('vaciar.areaReviewAddAreaTitle')}
        initialName=""
        initialEmoji="🌿"
        showEmoji
        onClose={() => setAddAreaOpen(false)}
        onSave={handleAddArea}
      />

      <BrainDumpCreateProjectSheet
        visible={createProjectColumn != null}
        areaName={createProjectColumn?.name ?? ''}
        areaRef={createProjectColumn?.ref ?? 'other'}
        onClose={() => {
          setCreateProjectColumn(null);
          setPendingAssignTaskId(null);
        }}
        onCreate={handleCreateProject}
      />

      <Modal
        visible={editingItem != null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingTaskId(null)}
      >
        <KeyboardAvoidingView
          style={styles.taskSheetBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.taskSheetScrim}
            activeOpacity={1}
            onPress={() => setEditingTaskId(null)}
          />
          {editingItem ? (
            <View style={styles.taskSheet}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <ReviewPreviewTaskRow
                  item={editingItem}
                  locale={locale}
                  compact={false}
                  onChange={handleTaskChange}
                  onDelete={handleDeleteTask}
                />
                <BrainDumpMoveAreaPicker
                  columns={columns}
                  currentAreaRef={editingItem.lifeAreaKey ?? null}
                  onMove={handleMoveTaskFromSheet}
                />
                <BrainDumpTaskProjectPicker
                  item={editingItem}
                  projects={allProjects}
                  locale={locale}
                  onChange={handleTaskChange}
                  onRequestCreateProject={handleRequestCreateFromTask}
                />
              </ScrollView>
              <CalmPrimaryButton
                label={t('vaciar.previewDoneEdit')}
                variant="soft"
                onPress={() => setEditingTaskId(null)}
              />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.sm,
  },
  header: {
    gap: THEME.spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    minHeight: THEME.sizes.touchTarget,
  },
  backLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  lead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    fontFamily: THEME.fonts.heading.medium,
  },
  countsLine: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  refiningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  refiningText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  createdAreaBanner: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
    backgroundColor: THEME.colors.calm.mist,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.standard,
  },
  footer: {
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
  },
  addAreaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
  },
  addAreaLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  taskSheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  taskSheetScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  taskSheet: {
    maxHeight: '78%',
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
});
