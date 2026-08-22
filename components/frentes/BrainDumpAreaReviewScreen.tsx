import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
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
  Alert,
  InteractionManager,
} from 'react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isCustomLifeAreaRef, makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { resolveAreaColumnOrder, reorderAreaColumnInConfig, removeAreaFromUserConfig, type UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
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
  isDraftProjectId,
  mergeBrainDumpProjects,
  toBrainDumpReviewProject,
  type BrainDumpReviewProject,
} from '@/lib/review/brainDumpProjects';
import { deleteProjectById } from '@/lib/deleteProject';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';

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
  onItemsChange: Dispatch<SetStateAction<EnrichedCaptureItem[]>>;
  onBack: () => void;
  onConfirm: (payload: {
    items: EnrichedCaptureItem[];
    draftProjects: BrainDumpReviewProject[];
  }) => void;
  isSaving: boolean;
  isRefining?: boolean;
  onDraggingChange?: (dragging: boolean) => void;
  parentScrollRef?: RefObject<ScrollView | null>;
  parentScrollYRef?: RefObject<number>;
};

type RenameTarget = {
  ref: LifeAreaRef;
  name: string;
  emoji: string;
  color: string;
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
  onDraggingChange,
  parentScrollRef,
  parentScrollYRef,
}: BrainDumpAreaReviewScreenProps) {
  const { t } = useI18n();
  const {
    config: lifeAreasConfig,
    loading: lifeAreasLoading,
    addCustomArea,
    saveConfig,
  } = useUserLifeAreas(userId);

  const presetEnsuredRef = useRef(false);
  const inferenceAppliedRef = useRef(false);

  const [reviewAreaConfig, setReviewAreaConfig] = useState<UserLifeAreasConfig | null>(null);

  const [draftProjects, setDraftProjects] = useState<BrainDumpReviewProject[]>([]);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [createProjectColumn, setCreateProjectColumn] = useState<BrainDumpAreaColumn | null>(null);
  const [pendingAssignTaskId, setPendingAssignTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [pendingMoveTaskIdForNewArea, setPendingMoveTaskIdForNewArea] = useState<string | null>(
    null,
  );
  const [createdAreaName, setCreatedAreaName] = useState<string | null>(null);
  const [removedSavedProjectIds, setRemovedSavedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );

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

  const activeAreaConfig = reviewAreaConfig ?? effectiveConfig;

  const savedProjects = useMemo(
    () =>
      existingProjects
        .filter((project) => !removedSavedProjectIds.has(project.id))
        .map((project) => toBrainDumpReviewProject(project)),
    [existingProjects, removedSavedProjectIds],
  );

  const allProjects = useMemo(
    () => mergeBrainDumpProjects(savedProjects, draftProjects),
    [draftProjects, savedProjects],
  );

  useEffect(() => {
    if (lifeAreasLoading || presetEnsuredRef.current) return;
    const next = ensureBrainDumpPresetInConfig(lifeAreasConfig);
    presetEnsuredRef.current = true;
    setReviewAreaConfig(next);
    if (userId && brainDumpPresetConfigChanged(lifeAreasConfig, next)) {
      void saveConfig(next);
    }
  }, [userId, lifeAreasLoading, lifeAreasConfig, saveConfig]);

  useEffect(() => {
    if (inferenceAppliedRef.current || items.length === 0) return;
    const needsInference = items.some((item) => item.lifeAreaKey == null);
    if (!needsInference) {
      inferenceAppliedRef.current = true;
      return;
    }
    const inferred = applyInferredLifeAreas(items, activeAreaConfig);
    const changed = inferred.some((item, index) => item.lifeAreaKey !== items[index]?.lifeAreaKey);
    inferenceAppliedRef.current = true;
    if (changed) {
      onItemsChange(inferred);
    }
  }, [items, onItemsChange, activeAreaConfig]);

  const looseLabel = t('projectsUi.looseTitle');
  const looseInAreaLabel = t('vaciar.areaReviewLooseInArea');

  const { columns, areas, countsLine } = useMemo(
    () =>
      buildBrainDumpAreaBoardModel(
        items,
        activeAreaConfig,
        getDefaultLabel,
        looseLabel,
        locale,
        allProjects,
        looseInAreaLabel,
        true,
        getPresetCustomLabel,
      ),
    [items, activeAreaConfig, getDefaultLabel, getPresetCustomLabel, looseLabel, locale, allProjects, looseInAreaLabel],
  );

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingTaskId) ?? null,
    [items, editingTaskId],
  );

  const movingItem = useMemo(
    () => items.find((item) => item.id === movingTaskId) ?? null,
    [items, movingTaskId],
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
    (taskId: string, targetColumnId: string, targetProjectId?: string | null) => {
      const lifeAreaKey = columnIdToLifeAreaKey(targetColumnId);
      onItemsChange((prev) =>
        prev.map((item) => {
          if (item.id !== taskId) return item;
          let next = clearProjectIfWrongArea(item, lifeAreaKey);
          if (targetProjectId) {
            next = { ...next, ...assignItemToProject(true, targetProjectId) };
          } else if (targetProjectId === null) {
            next = { ...next, ...assignItemToProject(false, null) };
          }
          return next;
        }),
      );
    },
    [clearProjectIfWrongArea, onItemsChange],
  );

  const openRenameForColumn = useCallback((column: BrainDumpAreaColumn) => {
    if (column.isLoose || !column.ref) return;

    if (isCustomLifeAreaRef(column.ref)) {
      const customId = column.ref.slice('custom:'.length);
      const customEntry = activeAreaConfig.custom.find((entry) => entry.id === customId);
      setRenameTarget({
        ref: column.ref,
        name: column.name,
        emoji: customEntry?.emoji ?? column.emoji,
        color: customEntry?.color ?? column.color,
        isCustom: true,
        customId,
      });
      return;
    }

    setRenameTarget({
      ref: column.ref,
      name: column.name,
      emoji: column.emoji,
      color: column.color,
      isCustom: false,
    });
  }, [activeAreaConfig.custom]);

  const handleRenameSave = useCallback(
    async (name: string, emoji?: string, color?: string) => {
      if (!renameTarget) return false;

      const trimmed = name.trim();
      if (!trimmed) return false;

      let next = activeAreaConfig;
      if (renameTarget.isCustom && renameTarget.customId) {
        next = {
          ...activeAreaConfig,
          custom: activeAreaConfig.custom.map((item) =>
            item.id === renameTarget.customId
              ? {
                  ...item,
                  name: trimmed,
                  emoji: emoji ?? item.emoji,
                  color: color ?? item.color,
                }
              : item,
          ),
        };
      } else if (!renameTarget.isCustom) {
        const labels = { ...activeAreaConfig.labels };
        labels[renameTarget.ref as LifeAreaKey] = trimmed;
        next = { ...activeAreaConfig, labels };
      }

      setReviewAreaConfig(next);

      if (userId) {
        const ok = await saveConfig(next);
        if (!ok) {
          Alert.alert(t('errors.generic'));
          return false;
        }
      }

      return true;
    },
    [activeAreaConfig, renameTarget, saveConfig, t, userId],
  );

  const handleDeleteArea = useCallback(() => {
    if (!renameTarget) return;

    const target = renameTarget;
    setRenameTarget(null);

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
              const areaRef = target.ref;
              const previousConfig = reviewAreaConfig ?? effectiveConfig;
              const next = removeAreaFromUserConfig(previousConfig, areaRef);

              setReviewAreaConfig(next);
              const ok = userId ? await saveConfig(next) : true;
              if (ok) {
                onItemsChange((prev) =>
                  prev.map((item) =>
                    item.lifeAreaKey === areaRef
                      ? clearProjectIfWrongArea(item, null)
                      : item,
                  ),
                );
              } else {
                setReviewAreaConfig(previousConfig);
                Alert.alert(t('areasCompact.deleteAreaFailed'));
              }
            })();
          },
        },
      ],
    );
  }, [
    clearProjectIfWrongArea,
    effectiveConfig,
    onItemsChange,
    renameTarget,
    reviewAreaConfig,
    saveConfig,
    t,
    userId,
  ]);

  const detachProjectFromItems = useCallback(
    (projectId: string) => {
      onItemsChange((prev) =>
        prev.map((item) =>
          item.selectedProjectId === projectId
            ? { ...item, ...assignItemToProject(false, null) }
            : item,
        ),
      );
    },
    [onItemsChange],
  );

  const handleDeleteProject = useCallback(
    (projectId: string, projectName: string) => {
      const isDraft = isDraftProjectId(projectId);
      Alert.alert(
        t('projects.deleteProjectTitle'),
        t('projects.deleteProjectBody', { name: projectName }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('errors.delete'),
            style: 'destructive',
            onPress: () => {
              detachProjectFromItems(projectId);
              if (isDraft) {
                setDraftProjects((current) => current.filter((entry) => entry.id !== projectId));
                return;
              }
              void (async () => {
                const result = await deleteProjectById(projectId);
                if (result.ok) {
                  setRemovedSavedProjectIds((prev) => new Set(prev).add(projectId));
                }
              })();
            },
          },
        ],
      );
    },
    [detachProjectFromItems, t],
  );

  useEffect(() => {
    if (!createdAreaName) return;
    const timer = setTimeout(() => setCreatedAreaName(null), 5000);
    return () => clearTimeout(timer);
  }, [createdAreaName]);

  const handleAddArea = useCallback(
    async (name: string, emoji?: string, color?: string) => {
      const result = await addCustomArea(name, emoji ?? '🌿', color);
      if (result.ok && result.entry) {
        const entry = result.entry;
        setReviewAreaConfig((current) => {
          const base = current ?? activeAreaConfig;
          return { ...base, custom: [...base.custom, entry] };
        });
        setAddAreaOpen(false);
        setCreatedAreaName(result.entry.name);
        const taskIdToMove = pendingMoveTaskIdForNewArea ?? editingTaskId;
        if (taskIdToMove) {
          handleMoveTask(taskIdToMove, makeCustomLifeAreaRef(result.entry.id));
        }
        setPendingMoveTaskIdForNewArea(null);
        setMovingTaskId(null);
        setEditingTaskId(null);
      }
    },
    [activeAreaConfig, addCustomArea, editingTaskId, handleMoveTask, pendingMoveTaskIdForNewArea],
  );

  const openAddAreaForTask = useCallback((taskId: string | null) => {
    setPendingMoveTaskIdForNewArea(taskId);
    setMovingTaskId(null);
    setEditingTaskId(null);
    setAddAreaOpen(true);
  }, []);

  const orderedAreaRefs = useMemo(
    () => resolveAreaColumnOrder(activeAreaConfig),
    [activeAreaConfig],
  );

  const canMoveAreaUp = useCallback(
    (ref: string) => orderedAreaRefs.indexOf(ref as LifeAreaRef) > 0,
    [orderedAreaRefs],
  );

  const canMoveAreaDown = useCallback(
    (ref: string) => {
      const index = orderedAreaRefs.indexOf(ref as LifeAreaRef);
      return index >= 0 && index < orderedAreaRefs.length - 1;
    },
    [orderedAreaRefs],
  );

  const handleMoveAreaColumn = useCallback(
    (ref: string, direction: 'up' | 'down') => {
      const next = reorderAreaColumnInConfig(activeAreaConfig, ref as LifeAreaRef, direction);
      if (next === activeAreaConfig) return;
      setReviewAreaConfig(next);
      if (userId) void saveConfig(next);
    },
    [activeAreaConfig, saveConfig, userId],
  );

  const handleCreateProject = useCallback(
    (payload: { name: string; dueDate: string | null }) => {
      if (!createProjectColumn?.ref) return;
      const areaRef = createProjectColumn.ref;
      const draft = createDraftBrainDumpProject(payload.name, areaRef, payload.dueDate);
      setDraftProjects((current) => [...current, draft]);

      const assignedTaskId = pendingAssignTaskId;
      if (assignedTaskId) {
        onItemsChange((prev) =>
          prev.map((item) =>
            item.id === assignedTaskId
              ? {
                  ...item,
                  lifeAreaKey: areaRef,
                  ...assignItemToProject(true, draft.id),
                }
              : item,
          ),
        );
        setEditingTaskId(assignedTaskId);
      }
      setPendingAssignTaskId(null);
      setCreateProjectColumn(null);
    },
    [createProjectColumn?.ref, onItemsChange, pendingAssignTaskId],
  );

  const openCreateProjectSheet = useCallback((column: BrainDumpAreaColumn) => {
    if (!column.ref) return;
    InteractionManager.runAfterInteractions(() => {
      setCreateProjectColumn(column);
    });
  }, []);

  const handleOpenCreateProject = useCallback(
    (column: BrainDumpAreaColumn) => {
      setPendingAssignTaskId(null);
      setEditingTaskId(null);
      setMovingTaskId(null);
      openCreateProjectSheet(column);
    },
    [openCreateProjectSheet],
  );

  const openCreateProjectForTask = useCallback(() => {
    if (!editingItem?.lifeAreaKey) return;
    const column = columns.find((entry) => entry.ref === editingItem.lifeAreaKey);
    if (!column?.ref) return;
    setPendingAssignTaskId(editingItem.id);
    setEditingTaskId(null);
    setMovingTaskId(null);
    openCreateProjectSheet(column);
  }, [columns, editingItem, openCreateProjectSheet]);

  const handleMoveTaskFromSheet = useCallback(
    (targetColumnId: string) => {
      const taskId = movingTaskId ?? editingTaskId;
      if (!taskId) return;
      handleMoveTask(taskId, targetColumnId);
      setMovingTaskId(null);
      if (editingTaskId === taskId) {
        setEditingTaskId(null);
      }
    },
    [editingTaskId, handleMoveTask, movingTaskId],
  );

  const handleConfirm = useCallback(() => {
    onDraggingChange?.(false);
    onConfirm({
      items,
      draftProjects,
    });
  }, [draftProjects, items, onConfirm, onDraggingChange]);

  const handleTaskChange = useCallback(
    (next: EnrichedCaptureItem) => {
      onItemsChange((prev) => prev.map((item) => (item.id === next.id ? next : item)));
    },
    [onItemsChange],
  );

  const handleDeleteTask = useCallback(() => {
    if (!editingTaskId) return;
    onItemsChange((prev) => prev.filter((item) => item.id !== editingTaskId));
    setEditingTaskId(null);
  }, [editingTaskId, onItemsChange]);

  const handleDeleteTaskById = useCallback(
    (taskId: string) => {
      onItemsChange((prev) => prev.filter((item) => item.id !== taskId));
      if (editingTaskId === taskId) setEditingTaskId(null);
      if (movingTaskId === taskId) setMovingTaskId(null);
    },
    [editingTaskId, movingTaskId, onItemsChange],
  );

  const ellieMessage =
    items.length === 0
      ? t('vaciar.areaReviewEllieEmpty')
      : items.length === 1
        ? t('vaciar.areaReviewEllieOne')
        : t('vaciar.areaReviewEllieMany', { count: items.length });

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

        <View style={styles.ellieHero}>
          <OnboardingEllieCoach
            message={ellieMessage}
            mood="curious"
            size={64}
            withBottomGap={false}
            breathe
            accessible
          />
        </View>

        <Text style={styles.screenTitle}>{t('vaciar.areaReviewTitle')}</Text>
        <Text style={styles.instructionSubtitle}>{t('vaciar.areaReviewSubtitle')}</Text>

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

      {items.length === 0 ? (
        <View style={styles.emptyBoard}>
          <Text style={styles.emptyBoardText}>{t('vaciar.areaReviewEmptyBoard')}</Text>
          <CalmPrimaryButton
            label={t('vaciar.previewBack')}
            variant="soft"
            onPress={onBack}
          />
        </View>
      ) : (
      <BrainDumpAreaDragBoard
        columns={columns}
        areas={areas}
        projects={allProjects}
        onMoveTask={handleMoveTask}
        onPressColumnHeader={openRenameForColumn}
        onPressTask={setEditingTaskId}
        onRequestMoveTask={setMovingTaskId}
        onDeleteTask={handleDeleteTaskById}
        onPressAddProject={handleOpenCreateProject}
        onPressDeleteProject={handleDeleteProject}
        emptyColumnHint={t('vaciar.areaReviewEmptyColumn')}
        renameColumnA11y={t('vaciar.areaReviewRenameColumnA11y')}
        addProjectLabel={t('vaciar.areaReviewAddProject')}
        hideEmptyColumns
        dragHint={t('vaciar.areaReviewDragHint')}
        boardHint={t('vaciar.areaReviewBoardHint')}
        emptyAreaHint={t('vaciar.areaReviewEmptyArea')}
        looseSectionTitle={t('vaciar.areaReviewLooseSectionTitle')}
        areasSectionTitle={t('vaciar.areaReviewAreasSectionTitle')}
        onDraggingChange={onDraggingChange}
        parentScrollRef={parentScrollRef}
        parentScrollYRef={parentScrollYRef}
        betweenSections={
          <TouchableOpacity
            style={styles.addAreaButtonCompact}
            onPress={() => setAddAreaOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.areaReviewAddAreaA11y')}
          >
            <Plus size={16} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.addAreaLabelCompact}>{t('vaciar.areaReviewAddArea')}</Text>
          </TouchableOpacity>
        }
        onMoveAreaColumn={handleMoveAreaColumn}
        canMoveAreaUp={canMoveAreaUp}
        canMoveAreaDown={canMoveAreaDown}
        moveAreaUpA11y={t('vaciar.areaReviewMoveAreaUpA11y')}
        moveAreaDownA11y={t('vaciar.areaReviewMoveAreaDownA11y')}
        reorderAreasLabel={t('vaciar.areaReviewReorderAreas')}
        moveTaskLabel={t('vaciar.areaReviewMoveTask')}
        moveTaskA11y={t('vaciar.areaReviewMoveTaskA11y')}
      />
      )}

      <View style={styles.footer}>
        {items.length > 0 ? (
        <CalmPrimaryButton
          label={t('vaciar.areaReviewConfirm')}
          onPress={handleConfirm}
          loading={isSaving}
          disabled={isSaving}
          accessibilityHint={t('vaciar.areaReviewConfirmHint')}
        />
        ) : null}
      </View>

      <AreaNameEditSheet
        visible={renameTarget != null}
        title={t('vaciar.areaReviewRenameTitle')}
        initialName={renameTarget?.name ?? ''}
        initialEmoji={renameTarget?.emoji ?? '🌿'}
        initialColor={renameTarget?.color}
        showEmoji={renameTarget?.isCustom ?? false}
        showColor={renameTarget?.isCustom ?? false}
        canDelete={Boolean(renameTarget)}
        deleteLabel={t('areasCompact.deleteArea')}
        onDelete={handleDeleteArea}
        onClose={() => setRenameTarget(null)}
        onSave={handleRenameSave}
      />

      <AreaNameEditSheet
        visible={addAreaOpen}
        title={t('vaciar.areaReviewAddAreaTitle')}
        initialName=""
        initialEmoji="🌿"
        showEmoji
        showColor
        onClose={() => {
          setAddAreaOpen(false);
          setPendingMoveTaskIdForNewArea(null);
        }}
        onSave={handleAddArea}
      />

      <BrainDumpCreateProjectSheet
        visible={createProjectColumn != null}
        areaName={createProjectColumn?.name ?? ''}
        areaRef={createProjectColumn?.ref ?? 'other'}
        onClose={() => {
          const taskId = pendingAssignTaskId;
          setCreateProjectColumn(null);
          setPendingAssignTaskId(null);
          if (taskId) setEditingTaskId(taskId);
        }}
        onCreate={handleCreateProject}
      />

      <Modal
        visible={movingItem != null}
        transparent
        animationType="slide"
        onRequestClose={() => setMovingTaskId(null)}
      >
        <KeyboardAvoidingView
          style={styles.taskSheetBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.taskSheetScrim}
            activeOpacity={1}
            onPress={() => setMovingTaskId(null)}
          />
          {movingItem ? (
            <View style={styles.taskSheet}>
              <Text style={styles.moveSheetTitle}>{t('vaciar.areaReviewMoveSheetTitle')}</Text>
              <Text style={styles.moveSheetTaskTitle} numberOfLines={2}>
                {movingItem.content}
              </Text>
              <BrainDumpMoveAreaPicker
                columns={columns}
                currentAreaRef={movingItem.lifeAreaKey ?? null}
                onMove={handleMoveTaskFromSheet}
                onAddArea={() => openAddAreaForTask(movingItem.id)}
                looseLabel={looseLabel}
              />
              <CalmPrimaryButton
                label={t('common.cancel')}
                variant="soft"
                onPress={() => setMovingTaskId(null)}
              />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>

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
              <ScrollView
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.taskSheetScroll}
              >
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
                  onAddArea={() => openAddAreaForTask(editingItem.id)}
                  looseLabel={looseLabel}
                />
                <BrainDumpTaskProjectPicker
                  item={editingItem}
                  projects={allProjects}
                  locale={locale}
                  onChange={handleTaskChange}
                  onRequestCreateProject={openCreateProjectForTask}
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
    gap: THEME.spacing.md,
    alignSelf: 'stretch',
  },
  header: {
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
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
  screenTitle: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 28,
  },
  instructionSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  ellieHero: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  emptyBoard: {
    gap: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.sm,
    alignItems: 'center',
  },
  emptyBoardText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  countsLine: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
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
  addAreaButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
  },
  addAreaLabelCompact: {
    ...THEME.typography.caption,
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
  moveSheetTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  moveSheetTaskTitle: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  taskSheetScroll: {
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.xs,
  },
});
