import { View, StyleSheet, RefreshControl, Keyboard, Text } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import { Toast } from '@/components/Toast';
import { VaciarCaptureForm } from '@/components/tasks/VaciarCaptureForm';
import { BrainDumpAreaReviewScreen } from '@/components/frentes/BrainDumpAreaReviewScreen';
import { BrainDumpSavedSummaryScreen } from '@/components/frentes/BrainDumpSavedSummaryScreen';
import type { BrainDumpReviewProject } from '@/lib/review/brainDumpProjects';
import { isDraftProjectId } from '@/lib/review/brainDumpProjects';
import type { SavedOrganizedContext } from '@/lib/review/buildBrainDumpSavedSummary';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsLibraryPanel } from '@/components/projects/ProjectsLibraryPanel';
import { VaciarTabSegments, type VaciarTabSegment } from '@/components/tasks/VaciarTabSegments';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { useFocusedProject } from '@/hooks/useFocusedProject';
import { FocusedProjectBanner } from '@/components/projects/FocusedProjectBanner';
import { useVaciarHints } from '@/hooks/useVaciarHints';
import { useVaciarTaskSave } from '@/hooks/useVaciarTaskSave';
import { useVaciarBatchSave } from '@/hooks/useVaciarBatchSave';
import {
  advancedCaptureOptionsActive,
  buildEnrichedReleaseItems,
  type VaciarAdvancedCaptureOptions,
} from '@/lib/vaciarInboxCapture';
import { sanitizeCaptureItemsForSave } from '@/lib/review/sanitizeCaptureItemsForSave';
import { stripAutoPlanningForDiscovery } from '@/lib/captureFrontDiscovery';
import { mergeCaptureReviewEdits } from '@/lib/review/mergeCaptureReviewEdits';
import { buildLiveCapturePreview } from '@/lib/liveCapturePreview';
import { applyAiProjectHints } from '@/lib/taskIntelligentEnrichment';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import type { CaptureHeroLiveState } from '@/components/tasks/CaptureScreenHero';
import { fetchUserProjects } from '@/lib/projectDueDateSchema';
import { PROJECT_COLORS } from '@/lib/projectColors';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';
import { applyInferredLifeAreas } from '@/lib/review/inferCaptureItemLifeArea';
import { ensureBrainDumpPresetInConfig } from '@/lib/review/brainDumpAreaPreset';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { logger } from '@/lib/logger';

type CaptureFlowStep = 'input' | 'preview' | 'organized';

export default function VaciarScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const {
    suggestion,
    date: dateParam,
    projectId: projectIdParam,
    segment: segmentParam,
    fresh: freshParam,
  } = useLocalSearchParams<{
    suggestion?: string;
    date?: string;
    projectId?: string;
    segment?: string;
    fresh?: string;
  }>();
  const [segment, setSegment] = useState<VaciarTabSegment>(() =>
    segmentParam === 'projects' ? 'projects' : 'capture',
  );
  const [projectsPanelMounted, setProjectsPanelMounted] = useState(
    () => segmentParam === 'projects',
  );
  const [taskInput, setTaskInput] = useState('');
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [assignToProject, setAssignToProject] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('otros');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [effortFeel, setEffortFeel] = useState<TaskEffort | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isRefiningPreview, setIsRefiningPreview] = useState(false);
  const [captureStep, setCaptureStep] = useState<CaptureFlowStep>('input');
  const [previewItems, setPreviewItems] = useState<EnrichedCaptureItem[]>([]);
  const [previewProjects, setPreviewProjects] = useState<
    {
      id: string;
      name: string;
      due_date: string | null;
      color?: string | null;
      life_area_key?: string | null;
    }[]
  >([]);
  const [organizedRefreshSignal, setOrganizedRefreshSignal] = useState(0);
  const [, setLiveCaptureState] = useState<CaptureHeroLiveState | null>(null);
  const [captureInputFocused, setCaptureInputFocused] = useState(false);
  const [savedOrganizedContext, setSavedOrganizedContext] =
    useState<SavedOrganizedContext | null>(null);
  const [captureReviewDragging, setCaptureReviewDragging] = useState(false);

  useEffect(() => {
    setCaptureReviewDragging(false);
  }, [segment, captureStep]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setCaptureReviewDragging(false);
      };
    }, []),
  );

  const previewGenerationRef = useRef(0);
  const confirmInFlightRef = useRef(false);

  const handleSegmentChange = useCallback(
    (next: VaciarTabSegment) => {
      setCaptureReviewDragging(false);
      setCaptureInputFocused(false);
      if (next === 'projects') {
        setProjectsPanelMounted(true);
        setOrganizedRefreshSignal((n) => n + 1);
        if (captureStep !== 'input') {
          setCaptureStep('input');
          setSavedOrganizedContext(null);
          previewGenerationRef.current += 1;
          setPreviewItems([]);
          setIsRefiningPreview(false);
        }
      }
      setSegment(next);
      router.setParams({ segment: next, fresh: undefined });
    },
    [captureStep, router],
  );

  const [, setProjectCount] = useState<number | null>(null);
  const { user } = useAuth();
  const { config: lifeAreasConfig } = useUserLifeAreas(user?.id);
  const effectiveLifeAreasConfig = useMemo(
    () => ensureBrainDumpPresetInConfig(lifeAreasConfig),
    [lifeAreasConfig],
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const { hasCheckInToday, refresh: refreshCheckInToday } = useHasCheckInToday(user?.id);
  const { focusedProject, refresh: refreshFocusedProject, clearFocus } = useFocusedProject(user?.id);
  const { setHasTasks, loadHintState, dictateHintDismissed, dismissDictateHint } =
    useVaciarHints(user?.id);

  const resetTaskForm = useCallback(() => {
    setTaskInput('');
    setHasSubtasks(false);
    setSubtasks(['']);
    setEffortFeel(null);
  }, []);

  const handleTaskSaved = useCallback(
    async (_payload: { savedTitle: string }) => {
      setHasTasks(true);
      resetTaskForm();
      setAssignToProject(false);
      setSelectedProjectId(null);
      setSelectedCategory('otros');
      setSelectedDate(null);
    },
    [resetTaskForm, setHasTasks],
  );

  const { isSaving, saveTask } = useVaciarTaskSave({
    hasCheckInToday,
    showToast,
    onSaved: handleTaskSaved,
  });

  const handleBatchSaved = useCallback(async () => {
    await handleTaskSaved({ savedTitle: '' });
  }, [handleTaskSaved]);

  const { isSavingBatch, saveBatch } = useVaciarBatchSave({
    hasCheckInToday,
    showToast,
    onSaved: handleBatchSaved,
  });

  const handleRelease = useCallback(async () => {
    if (isOrganizing || isSaving || isSavingBatch) return;
    Keyboard.dismiss();
    const advanced: VaciarAdvancedCaptureOptions = {
      assignToProject,
      selectedCategory,
      selectedProjectId,
      selectedDate,
      effortFeel,
    };
    const useAdvanced =
      advancedCaptureOptionsActive(advanced) || assignToProject || hasSubtasks;

    if (!user?.id) return;

    setIsOrganizing(true);
    try {
      if (!useAdvanced) {
        const { data } = await fetchUserProjects(user.id);
        const projects = (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color ?? undefined,
          due_date: p.due_date ?? null,
          life_area_key: p.life_area_key ?? null,
        }));
        const projectsForMatch = projects.map((p) => ({ id: p.id, name: p.name }));
        const live = buildLiveCapturePreview(taskInput, locale, projectsForMatch, {
          lifeAreasConfig: effectiveLifeAreasConfig,
        });
        if (!live || live.items.length === 0) {
          showToast(t('vaciar.releaseEmpty'), 'info');
          return;
        }

        previewGenerationRef.current += 1;
        const refineGeneration = previewGenerationRef.current;
        setPreviewItems(
          applyInferredLifeAreas(
            stripAutoPlanningForDiscovery(live.items),
            effectiveLifeAreasConfig,
          ),
        );
        setPreviewProjects(projects);
        setSegment('capture');
        setCaptureStep('preview');
        setIsOrganizing(false);
        router.setParams({ segment: 'capture', fresh: undefined });
        requestAnimationFrame(() => {
          screenScrollRef.current?.scrollTo({ y: 0, animated: true });
        });

        setIsRefiningPreview(true);
        void (async () => {
          try {
            const { items: refined, usedLocalFallback } = await applyAiProjectHints(
              live.items,
              taskInput,
              locale,
              user.id,
              projectsForMatch,
            );
            if (refineGeneration !== previewGenerationRef.current) return;
            if (usedLocalFallback) {
              showToast(t('vaciarExtra.aiLocalFallback'), 'info');
            }
            setPreviewItems((current) => {
              const stripped = stripAutoPlanningForDiscovery(refined);
              const merged = mergeCaptureReviewEdits(current, stripped);
              return applyInferredLifeAreas(merged, effectiveLifeAreasConfig);
            });
          } catch (error) {
            logger.warn('vaciar.previewAiRefine', error);
          } finally {
            if (refineGeneration === previewGenerationRef.current) {
              setIsRefiningPreview(false);
            }
          }
        })();
        return;
      }

      try {
        const { items, projects } = await buildEnrichedReleaseItems(
          taskInput,
          locale,
          user.id,
          advanced,
        );
        if (items.length === 0) {
          showToast(t('vaciar.releaseEmpty'), 'info');
          return;
        }

        previewGenerationRef.current += 1;

        setPreviewItems(
          applyInferredLifeAreas(
            stripAutoPlanningForDiscovery(items),
            effectiveLifeAreasConfig,
          ),
        );
        setPreviewProjects(projects);
        setSegment('capture');
        setCaptureStep('preview');
        router.setParams({ segment: 'capture', fresh: undefined });
        requestAnimationFrame(() => {
          screenScrollRef.current?.scrollTo({ y: 0, animated: true });
        });
      } catch (error) {
        logger.error('vaciar.advancedRelease', error);
        showToast(t('errors.saveTaskFailed'), 'error');
      }
    } finally {
      setIsOrganizing(false);
    }
  }, [
    assignToProject,
    effortFeel,
    effectiveLifeAreasConfig,
    hasSubtasks,
    isOrganizing,
    isSaving,
    isSavingBatch,
    locale,
    selectedCategory,
    selectedDate,
    selectedProjectId,
    showToast,
    t,
    taskInput,
    user?.id,
  ]);

  const handleViewOrganized = useCallback(() => {
    setProjectsPanelMounted(true);
    setSegment('projects');
    router.setParams({ segment: 'projects', fresh: undefined });
    setCaptureStep('input');
    setSavedOrganizedContext(null);
    previewGenerationRef.current += 1;
    setPreviewItems([]);
    setIsRefiningPreview(false);
    setOrganizedRefreshSignal((n) => n + 1);
    requestAnimationFrame(() => {
      screenScrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [router]);

  const handleCaptureMore = useCallback(() => {
    setCaptureStep('input');
    setSavedOrganizedContext(null);
    previewGenerationRef.current += 1;
    setPreviewItems([]);
    setIsRefiningPreview(false);
    requestAnimationFrame(() => {
      screenScrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  const showOrganizedSummary = useCallback(
    (
      items: EnrichedCaptureItem[],
      taskCount: number,
      draftIdMap: Map<string, string>,
    ) => {
      const affectedAreaRefs = [
        ...new Set(
          items
            .map((item) => item.lifeAreaKey)
            .filter((ref): ref is LifeAreaRef => ref != null),
        ),
      ];

      setSavedOrganizedContext({
        taskCount,
        newProjectIds: [...draftIdMap.values()],
        affectedAreaRefs,
        previewItems: items.map((item) => ({
          content: item.content,
          lifeAreaKey: item.lifeAreaKey ?? null,
          projectId: item.assignToProject ? item.selectedProjectId : null,
          scheduledDate: item.selectedDate,
          estimatedMinutes: item.estimatedMinutes ?? null,
        })),
      });
      setOrganizedRefreshSignal((n) => n + 1);
      setCaptureStep('organized');
      requestAnimationFrame(() => {
        screenScrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    },
    [],
  );

  const handleConfirmPreview = useCallback(
    async (payload?: {
      items: EnrichedCaptureItem[];
      draftProjects?: BrainDumpReviewProject[];
    }) => {
      const itemsBase = payload?.items ?? previewItems;
      const draftProjects = payload?.draftProjects ?? [];
      if (!user?.id || itemsBase.length === 0) return;
      if (confirmInFlightRef.current || isOrganizing || isSaving || isSavingBatch) {
        return;
      }

      confirmInFlightRef.current = true;
      previewGenerationRef.current += 1;
      setIsRefiningPreview(false);
      setCaptureReviewDragging(false);
      setIsOrganizing(true);
      try {
        let items = sanitizeCaptureItemsForSave([...itemsBase]);
        let projects = [...previewProjects];
        const draftIdMap = new Map<string, string>();

        if (draftProjects.some((project) => project.isDraft)) {
          const { data: existingProjects } = await fetchUserProjects(user.id);
          const existingNames = (existingProjects ?? []).map((project) => project.name);

          for (const draft of draftProjects) {
            if (!draft.isDraft) continue;
            const result = await createProjectForUser({
              userId: user.id,
              name: draft.name,
              color: draft.color ?? PROJECT_COLORS[0],
              dueDateRaw: draft.due_date ?? undefined,
              lifeAreaKey: draft.lifeAreaKey,
              notes: draft.notes,
              existingNames,
              locale,
            });
            if (!result.ok) {
              showToast(createProjectErrorMessage(result.reason, locale), 'error');
              return;
            }

            draftIdMap.set(draft.id, result.project.id);
            projects = [
              ...projects,
              {
                id: result.project.id,
                name: result.project.name,
                color: result.project.color,
                due_date: result.project.due_date ?? null,
                life_area_key: draft.lifeAreaKey,
              },
            ];
          }

          items = items.map((item) => {
            if (!item.selectedProjectId || !isDraftProjectId(item.selectedProjectId)) return item;
            const resolvedId = draftIdMap.get(item.selectedProjectId);
            if (!resolvedId) {
              return { ...item, assignToProject: false, selectedProjectId: null };
            }
            return {
              ...item,
              selectedProjectId: resolvedId,
              assignToProject: true,
            };
          });
        }

        items = sanitizeCaptureItemsForSave(items);

        if (items.length === 1 && hasSubtasks) {
          const item = items[0];
          const saved = await saveTask(
            {
              content: item.content,
              hasSubtasks: true,
              subtasks,
              assignToProject: item.assignToProject,
              selectedCategory: item.selectedCategory || selectedCategory,
              selectedProjectId: item.selectedProjectId,
              selectedDate: item.selectedDate,
            },
            { effortFeel: item.effortFeel, reliefCapture: true, suppressToast: true },
          );
          if (!saved) return;
        } else {
          const saved = await saveBatch(items, { suppressToast: true });
          if (!saved || saved.length === 0) return;
        }

        setHasTasks(true);
        setPreviewProjects(projects);
        setTaskInput('');
        resetTaskForm();
        showOrganizedSummary(items, itemsBase.length, draftIdMap);
      } finally {
        confirmInFlightRef.current = false;
        setIsOrganizing(false);
      }
    },
    [
      hasSubtasks,
      isOrganizing,
      isSaving,
      isSavingBatch,
      locale,
      previewItems,
      previewProjects,
      resetTaskForm,
      saveBatch,
      saveTask,
      selectedCategory,
      setHasTasks,
      showOrganizedSummary,
      showToast,
      subtasks,
      user?.id,
    ],
  );

  const handleReviewConfirm = useCallback(
    (payload: {
      items: EnrichedCaptureItem[];
      draftProjects: BrainDumpReviewProject[];
    }) => {
      setPreviewItems(payload.items);
      void handleConfirmPreview({
        items: payload.items,
        draftProjects: payload.draftProjects,
      });
    },
    [handleConfirmPreview],
  );

  const resetCaptureFlow = useCallback(() => {
    previewGenerationRef.current += 1;
    setCaptureInputFocused(false);
    setCaptureReviewDragging(false);
    setCaptureStep('input');
    setPreviewItems([]);
    setIsRefiningPreview(false);
    setSavedOrganizedContext(null);
    setIsOrganizing(false);
  }, []);

  const handleBackToCapture = useCallback(() => {
    resetCaptureFlow();
  }, [resetCaptureFlow]);

  // Pre-llenar input si hay sugerencia desde Tips; fecha desde Semana; proyecto desde detalle de proyecto
  useEffect(() => {
    if (suggestion) {
      setTaskInput(suggestion);
      setSegment('capture');
    }
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
      if (segmentParam !== 'projects') {
        setSegment('capture');
      }
    }
    if (projectIdParam && typeof projectIdParam === 'string' && projectIdParam.length >= 10) {
      if (segmentParam === 'projects') {
        setSegment('projects');
        setProjectsPanelMounted(true);
      } else {
        setAssignToProject(true);
        setSelectedProjectId(projectIdParam);
        setSegment('capture');
      }
    }
  }, [suggestion, dateParam, projectIdParam, segmentParam]);

  useEffect(() => {
    if (segmentParam === 'projects') {
      setSegment('projects');
      setProjectsPanelMounted(true);
      return;
    }
    if (segmentParam === 'capture') {
      setSegment('capture');
    }
  }, [segmentParam]);

  useFocusEffect(
    useCallback(() => {
      if (freshParam !== '1') return;
      setSegment('capture');
      resetCaptureFlow();
      router.setParams({ segment: 'capture', fresh: undefined });
    }, [freshParam, resetCaptureFlow, router]),
  );

  useEffect(() => {
    if (segment === 'projects') setProjectsPanelMounted(true);
  }, [segment]);

  useEffect(() => {
    void refreshCheckInToday();
    void loadHintState();
  }, [refreshCheckInToday, loadHintState]);

  const loadProjectCount = useCallback(async () => {
    if (!user) {
      setProjectCount(null);
      return;
    }
    const { count, error } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (!error && count != null) setProjectCount(count);
    else setProjectCount(0);
  }, [user]);

  // Recargar banner y conteo de proyectos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      void refreshCheckInToday();
      void loadHintState();
      void loadProjectCount();
      void refreshFocusedProject();
    }, [loadProjectCount, refreshCheckInToday, loadHintState, refreshFocusedProject]),
  );

  const addSubtask = () => {
    if (subtasks.length >= 20) {
      showToast(t('vaciar.maxSubtasks'), 'error');
      return;
    }
    setSubtasks([...subtasks, '']);
  };

  const removeSubtask = (index: number) => {
    if (subtasks.length > 1) {
      setSubtasks(subtasks.filter((_, i) => i !== index));
    }
  };

  const isCaptureSegment = segment === 'capture';
  const hasTaskText = Boolean(taskInput.trim());
  const saveBlocked =
    !hasTaskText ||
    isSaving ||
    isSavingBatch ||
    (assignToProject && !selectedProjectId);
  const screenScrollRef = useRef<ScrollView>(null);
  const screenContentRef = useRef<View>(null);
  const captureScrollYRef = useRef(0);
  const handleCaptureScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    captureScrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshCheckInToday(),
        loadHintState(),
        refreshFocusedProject(),
      ]);
      const { syncAll } = await import('@/lib/offlineStorage');
      await syncAll();
    } catch (error) {
      logger.error('Error al refrescar:', error);
      showToast(t('errors.updateFailed'), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage(null)}
        />
      )}

      <View style={styles.screenBody}>
        <CalmScreen
          ref={screenScrollRef}
          scrollContentRef={screenContentRef}
          scroll
          scrollEnabled={
            !(isCaptureSegment && captureStep === 'preview' && captureReviewDragging)
          }
          onScroll={isCaptureSegment ? handleCaptureScroll : undefined}
          topInset={isCaptureSegment ? 'md' : 'lg'}
          gap={isCaptureSegment ? THEME.spacing.sm : THEME.layout.tabSectionGap}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={isCaptureSegment}
          refreshControl={
            !isCaptureSegment ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={THEME.colors.calm.lavenderDeep}
              />
            ) : undefined
          }
        >
        {user && !(isCaptureSegment && captureInputFocused) ? (
          <VaciarTabSegments value={segment} onChange={handleSegmentChange} />
        ) : null}

        {user && focusedProject && !isCaptureSegment ? (
          <FocusedProjectBanner
            project={focusedProject}
            onClearFocus={() => void clearFocus()}
          />
        ) : null}

        <View
          style={[
            styles.segmentPanels,
            isCaptureSegment && captureStep === 'input' && styles.segmentPanelsCapture,
            isCaptureSegment && captureStep === 'input' && captureInputFocused && styles.segmentPanelsCaptureFocused,
          ]}
        >
          {user && isCaptureSegment ? (
            <View
              style={[
                styles.segmentPanel,
                isCaptureSegment && captureStep === 'input' && styles.segmentPanelCapture,
                isCaptureSegment && captureStep === 'input' && captureInputFocused && styles.segmentPanelCaptureFocused,
              ]}
            >
              {isCaptureSegment && captureStep === 'organized' ? (
                <Text style={styles.simpleCaptureTitle}>{t('vaciar.flowStepDone')}</Text>
              ) : null}

              {isCaptureSegment && captureStep === 'input' ? (
                <VaciarCaptureForm
                  userId={user.id}
                  parentScrollRef={screenScrollRef}
                  taskInput={taskInput}
                  onTaskInputChange={(value) => {
                    setTaskInput(value);
                    if (captureStep !== 'input') setCaptureStep('input');
                  }}
                  assignToProject={assignToProject}
                  onAssignToProjectChange={(value) => {
                    setAssignToProject(value);
                    if (!value) setSelectedProjectId(null);
                  }}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedProjectId={selectedProjectId}
                  onProjectChange={setSelectedProjectId}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  hasSubtasks={hasSubtasks}
                  onHasSubtasksChange={setHasSubtasks}
                  subtasks={subtasks}
                  onSubtasksChange={setSubtasks}
                  onAddSubtask={addSubtask}
                  onRemoveSubtask={removeSubtask}
                  isSaving={isSaving || isSavingBatch || isOrganizing}
                  saveBlocked={saveBlocked}
                  onSave={() => void handleRelease()}
                  onProjectError={(message) => showToast(message, 'error')}
                  onProjectCreated={(name) =>
                    showToast(t('vaciar.projectCreated', { name }), 'success')
                  }
                  onVoiceNotice={(message) => showToast(message, 'info')}
                  dictateHintDismissed={dictateHintDismissed}
                  onDismissDictateHint={() => void dismissDictateHint()}
                  effortFeel={effortFeel}
                  onEffortChange={setEffortFeel}
                  onLiveStateChange={setLiveCaptureState}
                  onInputFocusChange={setCaptureInputFocused}
                  inputFocused={captureInputFocused}
                  brainDumpOnly
                />
              ) : null}

              {isCaptureSegment && captureStep === 'preview' && user ? (
                <BrainDumpAreaReviewScreen
                  locale={locale}
                  userId={user.id}
                  items={previewItems}
                  existingProjects={previewProjects}
                  onItemsChange={setPreviewItems}
                  onBack={handleBackToCapture}
                  onConfirm={(payload) => handleReviewConfirm(payload)}
                  isSaving={isOrganizing || isSavingBatch}
                  isRefining={isRefiningPreview}
                  onDraggingChange={setCaptureReviewDragging}
                  parentScrollRef={screenScrollRef}
                  parentScrollYRef={captureScrollYRef}
                />
              ) : null}

              {isCaptureSegment && captureStep === 'organized' && user && savedOrganizedContext ? (
                <BrainDumpSavedSummaryScreen
                  userId={user.id}
                  hasCheckInToday={hasCheckInToday}
                  savedContext={savedOrganizedContext}
                  onViewOrganized={handleViewOrganized}
                  onGoToHoy={() => router.replace('/(tabs)')}
                  onGoToCheckIn={() => router.replace(CHECK_IN_ROUTE)}
                  onCaptureMore={handleCaptureMore}
                />
              ) : null}
            </View>
          ) : null}

          {user && projectsPanelMounted && !isCaptureSegment ? (
            <View style={styles.segmentPanel}>
              <ProjectsLibraryPanel
                embedded
                areasFirst
                refreshSignal={organizedRefreshSignal}
                userId={user?.id}
                hasCheckInToday={hasCheckInToday}
                expandProjectId={
                  segmentParam === 'projects' && typeof projectIdParam === 'string'
                    ? projectIdParam
                    : null
                }
                parentScrollRef={screenScrollRef}
                scrollContentRef={screenContentRef}
                onGoCapture={() => {
                  setSegment('capture');
                  router.setParams({ segment: 'capture', fresh: undefined });
                  resetCaptureFlow();
                }}
                onOpenFullCapture={(projectId) => {
                  setSegment('capture');
                  router.setParams({ segment: 'capture', fresh: undefined });
                  resetCaptureFlow();
                  if (projectId) {
                    setAssignToProject(true);
                    setSelectedProjectId(projectId);
                  } else {
                    setAssignToProject(false);
                    setSelectedProjectId(null);
                  }
                }}
                onTaskSaved={(message) => showToast(message, 'success')}
                onProjectCreated={(name) => showToast(t('vaciar.projectCreated', { name }), 'success')}
              />
            </View>
          ) : null}
        </View>
        </CalmScreen>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  screenBody: {
    flex: 1,
  },
  segmentPanels: {
    alignSelf: 'stretch',
  },
  segmentPanelsCapture: {
    alignSelf: 'stretch',
  },
  segmentPanelsCaptureFocused: {
    alignSelf: 'stretch',
    minHeight: 320,
  },
  simpleCaptureTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 28,
  },
  segmentPanel: {
    alignSelf: 'stretch',
  },
  segmentPanelCapture: {
    alignSelf: 'stretch',
  },
  segmentPanelCaptureFocused: {
    alignSelf: 'stretch',
    minHeight: 300,
  },
  valueProp: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 20,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  organizePanelWrap: {
    marginBottom: THEME.spacing.md,
  },
  organizePanelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    ...THEME.surfaces.panel,
  },
  organizePanelToggleText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  organizePanelCollapsedHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
    lineHeight: 18,
  },
  organizePanelContent: {
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  optionalHintCard: {
    ...THEME.surfaces.elevated,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  optionalHintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  optionalHintTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  optionalHintBodyWrap: {
    marginTop: THEME.spacing.sm,
  },
  optionalHintBody: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  optionalHintBodySecond: {
    marginTop: THEME.spacing.xs,
  },
  optionalHintDismissBtn: {
    alignSelf: 'flex-end',
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
  },
  optionalHintDismissText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  optionalHintCollapsedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  optionalHintCollapsedLine: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  optionalHintDismissTextCompact: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  sectionHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  quickCaptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    ...THEME.surfaces.chip,
    flexShrink: 1,
  },
  priorityChipActive: {
    borderColor: THEME.colors.gradient.pink,
    backgroundColor: THEME.colors.tint.pink.soft,
  },
  priorityChipText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  priorityChipTextActive: {
    color: THEME.colors.gradient.pink,
  },
  optionalExtrasCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
  },
  optionalExtrasCardExpanded: {
    ...THEME.surfaces.panel,
  },
  optionalExtrasIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  optionalExtrasIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalExtrasTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionalExtrasTitle: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  optionalExtrasSub: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: 2,
    lineHeight: 17,
  },
  quickCaptureHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    marginBottom: THEME.spacing.md,
  },
  assignSection: {
    marginBottom: THEME.spacing.md,
  },
  assignQuestion: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  assignButtonsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  assignButton: {
    flex: 1,
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 2,
    ...THEME.surfaces.chip,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  assignButtonYes: {
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  assignButtonYesSelected: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  assignButtonNo: {
    ...THEME.surfaces.chip,
    borderWidth: 2,
  },
  assignButtonNoSelected: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  assignButtonText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  assignButtonTextSelectedYes: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  categorySection: {
    marginBottom: THEME.spacing.md,
  },
  categorySectionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  categoryChipsWrap: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs + 2,
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.pill,
  },
  categoryChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  categoryChipTextSelected: {
    color: THEME.colors.onGradient,
  },
  projectBlock: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  opcionesSection: {
    marginBottom: THEME.spacing.md,
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
  },
  opcionesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  opcionesHeaderText: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  opcionesHeaderHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    marginTop: 2,
  },
  opcionesContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
  },
  inputContainer: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    minHeight: 120,
  },
  inputCompact: {
    minHeight: 80,
  },
  recentContainer: {
    marginTop: THEME.spacing.lg,
  },
  recentTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  recentItem: {
    ...THEME.surfaces.muted,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  recentText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  priorityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
  },
  priorityToggleActive: {
    backgroundColor: THEME.colors.gradient.pink + '12',
    borderColor: THEME.colors.gradient.pink + '40',
  },
  priorityToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  priorityToggleTextActive: {
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtasksToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
  },
  subtasksToggleActive: {
    backgroundColor: THEME.colors.gradient.blue + '12',
    borderColor: THEME.colors.gradient.blue + '40',
  },
  subtasksToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  subtasksToggleTextActive: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtasksContainer: {
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  subtasksLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  subtaskInputContainer: {
    flex: 1,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
  },
  subtaskInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  removeSubtaskButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.standard,
  },
  addSubtaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  addSubtaskText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  checkInLinkWrap: {
    alignSelf: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  checkInLink: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  dictateHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xs,
  },
  dictateHintText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  suggestionsContainer: {
    gap: THEME.spacing.xs,
  },
  suggestionsTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    ...THEME.surfaces.chip,
  },
  suggestionText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
  },
  flowGuide: {
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  flowGuideText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  flowGuideAccent: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
  },
  projectsLink: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  projectsLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
});
