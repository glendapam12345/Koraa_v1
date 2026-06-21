import { View, StyleSheet, RefreshControl, Keyboard, Text } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import { Toast } from '@/components/Toast';
import { VaciarCaptureForm } from '@/components/tasks/VaciarCaptureForm';
import { FrontDetectionScreen } from '@/components/frentes/FrontDetectionScreen';
import { WeeklyPlanReadyScreen } from '@/components/frentes/WeeklyPlanReadyScreen';
import { RealityCheckScreen } from '@/components/vnext/RealityCheckScreen';
import type { RealityCheckInput } from '@/lib/vnext/types';
import {
  buildWeeklyPlanPreview,
  type WeeklyPlanPreview,
} from '@/lib/frentes/buildWeeklyPlanPreview';
import { CaptureSavedNextStep } from '@/components/tasks/CaptureSavedNextStep';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsLibraryPanel } from '@/components/projects/ProjectsLibraryPanel';
import { VaciarTabSegments, type VaciarTabSegment } from '@/components/tasks/VaciarTabSegments';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { useFocusedProject } from '@/hooks/useFocusedProject';
import { FocusedProjectBanner } from '@/components/projects/FocusedProjectBanner';
import { useVaciarHints } from '@/hooks/useVaciarHints';
import { useVaciarTaskSave } from '@/hooks/useVaciarTaskSave';
import { useVaciarBatchSave, type SavedCaptureTask } from '@/hooks/useVaciarBatchSave';
import {
  advancedCaptureOptionsActive,
  buildEnrichedReleaseItems,
  type VaciarAdvancedCaptureOptions,
} from '@/lib/vaciarInboxCapture';
import { buildCaptureFronts, type CaptureFrontsResult } from '@/lib/captureProjectFronts';
import { stripAutoPlanningForDiscovery } from '@/lib/captureFrontDiscovery';
import { buildLiveCapturePreview } from '@/lib/liveCapturePreview';
import { applyAiProjectHints } from '@/lib/taskIntelligentEnrichment';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import type { CaptureHeroLiveState } from '@/components/tasks/CaptureScreenHero';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { getDisplayName } from '@/lib/displayName';
import { fetchUserProjects } from '@/lib/projectDueDateSchema';
import { PROJECT_COLORS } from '@/lib/projectColors';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

type CaptureFlowStep = 'input' | 'preview' | 'reality' | 'weekly' | 'saved';

export default function VaciarScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { suggestion, date: dateParam, projectId: projectIdParam, segment: segmentParam } =
    useLocalSearchParams<{
      suggestion?: string;
      date?: string;
      projectId?: string;
      segment?: string;
    }>();
  const [segment, setSegment] = useState<VaciarTabSegment>('capture');
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
  const [releaseFronts, setReleaseFronts] = useState<CaptureFrontsResult | null>(null);
  const [captureStep, setCaptureStep] = useState<CaptureFlowStep>('input');
  const [previewItems, setPreviewItems] = useState<EnrichedCaptureItem[]>([]);
  const [previewProjects, setPreviewProjects] = useState<
    { id: string; name: string; due_date: string | null }[]
  >([]);
  const [previewFrontDeadlines, setPreviewFrontDeadlines] = useState<Record<string, string | null>>(
    {},
  );
  const [savedCaptureTasks, setSavedCaptureTasks] = useState<SavedCaptureTask[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanPreview | null>(null);
  const [creatingFrontKey, setCreatingFrontKey] = useState<string | null>(null);
  const [, setLiveCaptureState] = useState<CaptureHeroLiveState | null>(null);
  const [captureInputFocused, setCaptureInputFocused] = useState(false);
  const previewGenerationRef = useRef(0);
  const [, setProjectCount] = useState<number | null>(null);
  const [profileFullName, setProfileFullName] = useState<string | undefined>();
  const { user } = useAuth();

  const displayName = useMemo(
    () =>
      getDisplayName(
        { full_name: profileFullName, user_metadata: user?.user_metadata, email: user?.email },
        t('yo.welcomeName'),
      ),
    [profileFullName, user?.user_metadata, user?.email, t],
  );

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data } = await fetchProfilePreferences(user.id);
      setProfileFullName(data?.full_name?.trim() || undefined);
    })();
  }, [user?.id]);

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
          due_date: p.due_date ?? null,
        }));
        const projectsForMatch = projects.map((p) => ({ id: p.id, name: p.name }));
        const live = buildLiveCapturePreview(taskInput, locale, projectsForMatch);
        if (!live || live.items.length === 0) {
          showToast(t('vaciar.releaseEmpty'), 'info');
          return;
        }

        previewGenerationRef.current += 1;
        const refineGeneration = previewGenerationRef.current;
        setPreviewItems(stripAutoPlanningForDiscovery(live.items));
        setPreviewProjects(projects);
        setPreviewFrontDeadlines({});
        setCaptureStep('preview');
        setReleaseFronts(null);
        setIsOrganizing(false);
        requestAnimationFrame(() => {
          screenScrollRef.current?.scrollTo({ y: 0, animated: true });
        });

        setIsRefiningPreview(true);
        void (async () => {
          try {
            const refined = await applyAiProjectHints(
              live.items,
              taskInput,
              locale,
              user.id,
              projectsForMatch,
            );
            if (refineGeneration !== previewGenerationRef.current) return;
            setPreviewItems(stripAutoPlanningForDiscovery(refined));
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

      setPreviewItems(stripAutoPlanningForDiscovery(items));
      setPreviewProjects(projects);
      setPreviewFrontDeadlines({});
      setCaptureStep('preview');
      setReleaseFronts(null);
      requestAnimationFrame(() => {
        screenScrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    } finally {
      setIsOrganizing(false);
    }
  }, [
    assignToProject,
    effortFeel,
    hasSubtasks,
    locale,
    selectedCategory,
    selectedDate,
    selectedProjectId,
    showToast,
    t,
    taskInput,
    user?.id,
  ]);

  const handleConfirmPreview = useCallback(
    async (payload?: {
      items: EnrichedCaptureItem[];
      frontDeadlines: Record<string, string | null>;
      realityCheck?: RealityCheckInput;
    }) => {
      const itemsBase = payload?.items ?? previewItems;
      const frontDeadlines = payload?.frontDeadlines ?? previewFrontDeadlines;
      if (!user?.id || itemsBase.length === 0) return;

      previewGenerationRef.current += 1;
      setIsRefiningPreview(false);
      setIsOrganizing(true);
      try {
        let items = [...itemsBase];
        let projects = [...previewProjects];
        const { fronts } = buildCaptureFronts(items, projects);

        for (const front of fronts) {
          if (!front.suggestedNewProject || front.projectId) continue;
          const captureIds = new Set(front.tasks.map((task) => task.captureId));
          const dueDateRaw = frontDeadlines[front.key] ?? undefined;
          const { data: existingProjects } = await fetchUserProjects(user.id);
          const result = await createProjectForUser({
            userId: user.id,
            name: front.name,
            color: PROJECT_COLORS[0],
            existingNames: (existingProjects ?? []).map((project) => project.name),
            locale,
            dueDateRaw,
          });
          if (!result.ok) continue;

          projects = [
            ...projects,
            {
              id: result.project.id,
              name: result.project.name,
              due_date: result.project.due_date ?? null,
            },
          ];
          items = items.map((item) =>
            captureIds.has(item.id)
              ? {
                  ...item,
                  assignToProject: true,
                  selectedProjectId: result.project.id,
                }
              : item,
          );
        }

        let persistedTasks: SavedCaptureTask[] = [];

        if (items.length === 1 && hasSubtasks) {
          const item = items[0];
          await saveTask(
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
          setSavedCaptureTasks([]);
        } else {
          const saved = await saveBatch(items, { suppressToast: true });
          persistedTasks = saved ?? [];
          setSavedCaptureTasks(persistedTasks);
        }

        setHasTasks(true);
        setPreviewProjects(projects);
        setPreviewFrontDeadlines(frontDeadlines);
        const frontsResult = buildCaptureFronts(items, projects);
        setReleaseFronts(frontsResult);

        const plan = buildWeeklyPlanPreview(
          items,
          projects,
          locale,
          t('projectsUi.looseTitle'),
          payload?.realityCheck,
        );

        const captureToTaskId = new Map(
          (persistedTasks.length > 0
            ? persistedTasks
            : items.map((item) => ({
                captureId: item.id,
                taskId: item.id,
                content: item.content,
                projectId: item.selectedProjectId,
              }))
          ).map((entry) => [entry.captureId, entry.taskId]),
        );

        const dbAssignments = plan.assignments
          .map((entry) => ({
            id: captureToTaskId.get(entry.id) ?? entry.id,
            scheduled_date: entry.scheduled_date,
          }))
          .filter((entry) => entry.id);

        if (dbAssignments.length > 0) {
          await Promise.all(
            dbAssignments.map((entry) =>
              supabase
                .from('tasks')
                .update({ scheduled_date: entry.scheduled_date })
                .eq('id', entry.id),
            ),
          );
        }

        setWeeklyPlan(plan);
        setTaskInput('');
        resetTaskForm();
        setCaptureStep('weekly');
        requestAnimationFrame(() => {
          screenScrollRef.current?.scrollTo({ y: 0, animated: true });
        });
      } finally {
        setIsOrganizing(false);
      }
    },
    [
      hasSubtasks,
      locale,
      previewFrontDeadlines,
      previewItems,
      previewProjects,
      resetTaskForm,
      saveBatch,
      saveTask,
      selectedCategory,
      setHasTasks,
      subtasks,
      t,
      user?.id,
    ],
  );

  const handleReviewConfirm = useCallback(
    (payload: {
      items: EnrichedCaptureItem[];
      frontDeadlines: Record<string, string | null>;
    }) => {
      setPreviewItems(payload.items);
      setPreviewFrontDeadlines(payload.frontDeadlines);
      setCaptureStep('reality');
      requestAnimationFrame(() => {
        screenScrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    },
    [],
  );

  const handleBackFromReality = useCallback(() => {
    setCaptureStep('preview');
  }, []);

  const handleRealityConfirm = useCallback(
    (realityCheck: RealityCheckInput) => {
      void handleConfirmPreview({
        items: previewItems,
        frontDeadlines: previewFrontDeadlines,
        realityCheck,
      });
    },
    [handleConfirmPreview, previewFrontDeadlines, previewItems],
  );

  const handleBackToCapture = useCallback(() => {
    previewGenerationRef.current += 1;
    setCaptureInputFocused(false);
    setCaptureStep('input');
    setPreviewItems([]);
    setPreviewFrontDeadlines({});
    setWeeklyPlan(null);
    setIsRefiningPreview(false);
  }, []);

  const handleCreateProjectFromFront = useCallback(
    async (frontKey: string, projectName: string) => {
      if (!user?.id || !releaseFronts) return;
      const front = releaseFronts.fronts.find((entry) => entry.key === frontKey);
      if (!front) return;

      const captureIds = new Set(front.tasks.map((task) => task.captureId));
      const taskIds = savedCaptureTasks
        .filter((task) => captureIds.has(task.captureId))
        .map((task) => task.taskId);
      if (taskIds.length === 0) {
        showToast(t('errors.updateFailed'), 'error');
        return;
      }

      setCreatingFrontKey(frontKey);
      try {
        const { data: existingProjects } = await fetchUserProjects(user.id);
        const result = await createProjectForUser({
          userId: user.id,
          name: projectName,
          color: PROJECT_COLORS[0],
          existingNames: (existingProjects ?? []).map((project) => project.name),
          locale,
        });
        if (!result.ok) {
          showToast(createProjectErrorMessage(result.reason, locale), 'error');
          return;
        }

        const { error } = await supabase
          .from('tasks')
          .update({ project_id: result.project.id })
          .in('id', taskIds);
        if (error) {
          logger.error('Error asignando tareas al proyecto:', error);
          showToast(t('errors.updateFailed'), 'error');
          return;
        }

        setReleaseFronts((current) => {
          if (!current) return current;
          return {
            ...current,
            fronts: current.fronts.map((entry) =>
              entry.key === frontKey
                ? {
                    ...entry,
                    name: result.project.name,
                    projectId: result.project.id,
                    isExistingProject: true,
                    suggestedNewProject: false,
                  }
                : entry,
            ),
          };
        });
        showToast(t('vaciar.projectCreated', { name: result.project.name }), 'success');
      } finally {
        setCreatingFrontKey(null);
      }
    },
    [locale, releaseFronts, savedCaptureTasks, showToast, t, user?.id],
  );

  // Pre-llenar input si hay sugerencia desde Tips; fecha desde Semana; proyecto desde detalle de proyecto
  useEffect(() => {
    if (suggestion) {
      setTaskInput(suggestion);
    }
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    }
    if (projectIdParam && typeof projectIdParam === 'string' && projectIdParam.length >= 10) {
      setAssignToProject(true);
      setSelectedProjectId(projectIdParam);
      setSegment('capture');
    }
    if (suggestion || dateParam) {
      setSegment('capture');
    }
  }, [suggestion, dateParam, projectIdParam]);

  useEffect(() => {
    if (segmentParam === 'projects') {
      setSegment('projects');
      setProjectsPanelMounted(true);
    } else if (segmentParam === 'capture') {
      setSegment('capture');
    }
  }, [segmentParam]);

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
          scroll
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
          <VaciarTabSegments value={segment} onChange={setSegment} />
        ) : null}

        {!isCaptureSegment ? (
          <ScreenHeader
            title={t('projects.title')}
            subtitle={t('projects.subtitle')}
          />
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
          {user ? (
            <View
              style={[
                styles.segmentPanel,
                isCaptureSegment ? styles.segmentPanelActive : styles.segmentPanelHidden,
                isCaptureSegment && captureStep === 'input' && styles.segmentPanelCapture,
                isCaptureSegment && captureStep === 'input' && captureInputFocused && styles.segmentPanelCaptureFocused,
              ]}
              pointerEvents={isCaptureSegment ? 'auto' : 'none'}
            >
              {captureStep !== 'input' ? (
                <Text style={styles.simpleCaptureTitle}>
                  {captureStep === 'preview'
                    ? t('vaciar.flowStepReview')
                    : captureStep === 'reality'
                      ? t('vnext.flowStepCalibrate')
                      : captureStep === 'weekly'
                        ? t('frentes.flowStepPlan')
                        : t('vaciar.flowStepDone')}
                </Text>
              ) : null}

              {captureStep === 'input' ? (
                <VaciarCaptureForm
                  userId={user.id}
                  parentScrollRef={screenScrollRef}
                  taskInput={taskInput}
                  onTaskInputChange={(value) => {
                    setTaskInput(value);
                    if (releaseFronts) setReleaseFronts(null);
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
                />
              ) : null}

              {captureStep === 'preview' && user ? (
                <FrontDetectionScreen
                  locale={locale}
                  displayName={displayName}
                  userId={user.id}
                  items={previewItems}
                  projects={previewProjects}
                  onItemsChange={setPreviewItems}
                  onProjectsChange={(next) =>
                    setPreviewProjects(
                      next.map((project) => ({
                        id: project.id,
                        name: project.name,
                        due_date: project.due_date ?? null,
                      })),
                    )
                  }
                  onProjectError={(message) => showToast(message, 'error')}
                  onBack={handleBackToCapture}
                  onConfirm={(payload) => handleReviewConfirm(payload)}
                  isSaving={isOrganizing || isSavingBatch}
                  isRefining={isRefiningPreview}
                />
              ) : null}

              {captureStep === 'reality' && user ? (
                <RealityCheckScreen
                  displayName={displayName}
                  items={previewItems}
                  projects={previewProjects}
                  onBack={handleBackFromReality}
                  onContinue={handleRealityConfirm}
                  isSaving={isOrganizing || isSavingBatch}
                />
              ) : null}

              {captureStep === 'weekly' && weeklyPlan && releaseFronts ? (
                <WeeklyPlanReadyScreen
                  days={weeklyPlan.days}
                  fronts={releaseFronts.fronts}
                  movedCount={weeklyPlan.movedCount}
                  freedHours={weeklyPlan.freedHours}
                  focusFrontName={weeklyPlan.focusFrontName}
                  realism={weeklyPlan.realism}
                  onContinue={() => setCaptureStep('saved')}
                />
              ) : null}

              {captureStep === 'saved' && releaseFronts ? (
                <CaptureSavedNextStep
                  fronts={releaseFronts}
                  hasCheckInToday={hasCheckInToday}
                  creatingFrontKey={creatingFrontKey}
                  onCreateProject={(frontKey, projectName) => {
                    void handleCreateProjectFromFront(frontKey, projectName);
                  }}
                  onGoToHoy={() => router.replace('/(tabs)')}
                  onGoToCheckIn={() => router.replace(CHECK_IN_ROUTE)}
                />
              ) : null}
            </View>
          ) : null}

          {projectsPanelMounted ? (
            <View
              style={[
                styles.segmentPanel,
                !isCaptureSegment ? styles.segmentPanelActive : styles.segmentPanelHidden,
              ]}
              pointerEvents={!isCaptureSegment ? 'auto' : 'none'}
            >
              <ProjectsLibraryPanel
                embedded
                areasFirst
                userId={user?.id}
                hasCheckInToday={hasCheckInToday}
                onGoCapture={() => setSegment('capture')}
                onOpenFullCapture={(projectId) => {
                  setSegment('capture');
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
    flex: 1,
  },
  segmentPanelsCapture: {
    flex: 1,
  },
  segmentPanelsCaptureFocused: {
    flex: 1,
    minHeight: 320,
  },
  simpleCaptureTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 28,
  },
  segmentPanel: {
    flex: 1,
  },
  segmentPanelActive: {
    flex: 1,
  },
  segmentPanelCapture: {
    flex: 1,
  },
  segmentPanelCaptureFocused: {
    flex: 1,
    minHeight: 300,
  },
  segmentPanelHidden: {
    flex: 0,
    height: 0,
    overflow: 'hidden',
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
