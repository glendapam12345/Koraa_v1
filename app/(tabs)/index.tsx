import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useTasks } from '@/hooks/useTasks';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useProgress } from '@/hooks/useProgress';
import { normalizeCategoryKey } from '@/lib/i18n/categoryLabels';
import { getCatalog } from '@/lib/i18n';
import { HoyScreenHeader } from '@/components/hoy/HoyScreenHeader';
import { HoyTasksSection } from '@/components/hoy/HoyTasksSection';
import type { Task } from '@/components/tasks/TaskCard';
import { useRecheckCheckIn } from '@/contexts/RecheckCheckInContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { HoyScreenOverlays } from '@/components/hoy/HoyScreenOverlays';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { useHoyScreenLayout } from '@/hooks/useHoyScreenLayout';
import { useStreak } from '@/hooks/today/useStreak';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import { getTodayPriorityStats } from '@/lib/priorityProgress';
import { useHoyDeleteTask } from '@/hooks/useHoyTaskActions';
import { useTaskPlanEdit } from '@/hooks/useTaskPlanEdit';
import { useHoyPrioritization } from '@/hooks/useHoyPrioritization';
import { useKoraaDailyBrief } from '@/hooks/useKoraaDailyBrief';
import { useHoyTaskExpansion } from '@/hooks/useHoyTaskExpansion';
import { useHoyProjectsMap } from '@/hooks/useHoyProjectsMap';
import { useHoyScreenBootstrap } from '@/hooks/useHoyScreenBootstrap';
import type { TaskCompletedPayload } from '@/hooks/useTaskActions';
import { CareModeGuideSheet } from '@/components/hoy/CareModeGuideSheet';
import { CareModeSheet } from '@/components/hoy/CareModeSheet';
import { useCrisisMode } from '@/hooks/useCrisisMode';
import { useFocusedProject } from '@/hooks/useFocusedProject';
import { subscribeHoyRefresh } from '@/lib/hoyRefreshBridge';
import { TabScreenErrorBoundary } from '@/components/TabScreenErrorBoundary';
import { track } from '@/lib/analytics';
import {
  hasCompletedFirstSessionMicroStep,
  markFirstSessionMicroStepCompleted,
  shouldHighlightFirstSessionMicroStep,
} from '@/lib/firstSessionMicroStep';
import { getHoyPriorityPlanTasks } from '@/lib/hoyFocusTasks';

function TodayScreen() {
  const { t, locale } = useI18n();
  const [showQuickOnboarding, setShowQuickOnboarding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [showConfetti, setShowConfetti] = useState(false);
  const { openRecheck, recheckSource } = useLocalSearchParams<{
    openRecheck?: string;
    recheckSource?: string;
  }>();
  const [careModeSheet, setCareModeSheet] = useState<'activate' | 'deactivate' | null>(null);
  const [careModeGuideOpen, setCareModeGuideOpen] = useState(false);
  const [careModeBusy, setCareModeBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingTasksRef = useRef<boolean>(false);
  const firstDayValueTrackedRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const { user } = useAuth();
  const { openRecheck: openCheckInModal } = useRecheckCheckIn();
  const { crisisModeActive, dismissCrisisMode, activateCrisisMode, lastSession } = useCrisisMode();
  const {
    todayMood,
    energyLevel,
    time,
    focusLevel,
    returnMemory,
    loading: checkInLoading,
    loadTodayCheckIn,
  } = useCheckIn(showToast);

  const {
    tasks,
    loadingTasks,
    loadTasks,
    setTasks,
  } = useTasks(todayMood, showToast);

  const {
    focusedProject,
    refresh: refreshFocusedProject,
    clearFocus: clearFocusedProject,
  } = useFocusedProject(user?.id);

  useFocusEffect(
    useCallback(() => {
      const handle = InteractionManager.runAfterInteractions(() => {
        void refreshFocusedProject();
        void loadTasks({ silent: true });
        void loadTodayCheckIn();
      });
      return () => handle.cancel();
    }, [loadTasks, loadTodayCheckIn, refreshFocusedProject]),
  );

  useEffect(() => {
    return subscribeHoyRefresh(() => {
      void loadTasks({ silent: true });
      void loadTodayCheckIn();
      void refreshFocusedProject();
    });
  }, [loadTasks, loadTodayCheckIn, refreshFocusedProject]);

  const loading = checkInLoading || loadingTasks;
  /** Ellie solo habla cuando check-in y tareas ya están; si no, dice dump y luego se reescribe. */
  const [hoyReady, setHoyReady] = useState(false);
  useEffect(() => {
    if (!loading) {
      setHoyReady(true);
      return;
    }
    const failSafe = setTimeout(() => setHoyReady(true), 2500);
    return () => clearTimeout(failSafe);
  }, [loading]);

  const taskExpansion = useHoyTaskExpansion();
  const {
    expandedTasks,
    expandedDetailsTasks,
    menuOpen,
    closeMenu,
    toggleMenu,
    editingTask,
    toggleDetailsExpansion,
    toggleTaskExpansion,
    handleEditTask,
    closeEditTask,
  } = taskExpansion;

  const { handleDeleteTask } = useHoyDeleteTask({
    t,
    showToast,
    setTasks,
    setMenuOpen: taskExpansion.setMenuOpen,
  });

  const { projectsMap, reloadProjects } = useHoyProjectsMap(user?.id);

  const editProjects = useMemo(
    () => Object.entries(projectsMap).map(([id, meta]) => ({ id, name: meta.name })),
    [projectsMap],
  );

  const { saving: planEditSaving, savePlan } = useTaskPlanEdit({
    onError: (message) => showToast(message, 'error'),
    onSaved: (taskId, payload) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                content: payload.content,
                scheduled_date: payload.scheduledDate,
                project_id: payload.projectId,
                is_priority: payload.isPriority ?? task.is_priority,
                life_area_key:
                  payload.projectId != null
                    ? null
                    : (payload.lifeAreaKey ?? task.life_area_key ?? null),
                perceivedEffort: payload.effort ?? task.perceivedEffort,
              }
            : task,
        ),
      );
      closeEditTask();
      showToast(t('hooks.taskUpdated'), 'success');
      void loadTasks({ silent: true });
    },
  });

  const handleSavePlanEdit = useCallback(
    async (payload: Parameters<typeof savePlan>[0]) => {
      await savePlan(payload);
    },
    [savePlan],
  );

  const handleDeleteEditingTask = useCallback(async () => {
    if (!editingTask) return;
    await handleDeleteTask(editingTask);
    closeEditTask();
  }, [closeEditTask, editingTask, handleDeleteTask]);

  const { currentStreak, usedGrace, loadStreak } = useStreak(user?.id);
  const {
    hoyLiteLayout,
    hoyLiteCompactLayout,
    hoyRestOfDayExpanded,
    setShowSecondaryModules,
    handleShowMoreForHoy,
    handleOptOutHoyLite,
    checkInReplanCoachLine,
    patternHoyCoachLine,
    patternHoyMode,
    firstDayClose,
    enableTomorrowReminder,
  } = useHoyScreenLayout({
    userId: user?.id,
    loading,
    todayMood,
    showToast,
    loadTodayCheckIn,
    loadTasks,
    scrollRef,
  });

  const { incompleteTasks } = useProgress(tasks, loading);

  const todayEmotionLabel = useMemo(() => {
    if (!todayMood) return '';
    const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
    return emotions[todayMood.toLowerCase()] ?? todayMood;
  }, [locale, todayMood]);

  const incompleteTasksForToday = useMemo(() => {
    const today = getLocalDateString();
    return incompleteTasks.filter((task) => {
      const date = normalizeScheduledDate((task as Task).scheduled_date);
      return !date || date === today;
    });
  }, [incompleteTasks]);

  const [firstSessionMicroDone, setFirstSessionMicroDone] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setFirstSessionMicroDone(false);
      return;
    }
    let cancelled = false;
    void hasCompletedFirstSessionMicroStep(user.id).then((done) => {
      if (!cancelled) setFirstSessionMicroDone(done);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const hasFocusTaskForMicro = useMemo(
    () => getHoyPriorityPlanTasks(incompleteTasksForToday).some((task) => !task.is_completed),
    [incompleteTasksForToday],
  );

  const firstSessionMicroStep = shouldHighlightFirstSessionMicroStep({
    isLiteDay: hoyLiteLayout === true,
    hasCheckIn: Boolean(todayMood),
    hasFocusTask: hasFocusTaskForMicro,
    alreadyCompleted: firstSessionMicroDone,
    crisisMode: crisisModeActive,
  });

  useEffect(() => {
    if (!firstSessionMicroStep || firstDayValueTrackedRef.current) return;
    firstDayValueTrackedRef.current = true;
    void track('first_day_value_shown', { has_step: true });
  }, [firstSessionMicroStep]);

  const todayPriorityStats = useMemo(() => getTodayPriorityStats(tasks), [tasks]);

  const openQuickRecheck = useCallback(() => {
    openCheckInModal('hoy');
  }, [openCheckInModal]);

  const handleTaskCompleted = useCallback(
    (payload: TaskCompletedPayload) => {
      const allTasksComplete = tasks.length > 0 && tasks.every((task) => task.is_completed);

      if (payload.allPrioritiesDoneToday) {
        if (!allTasksComplete) {
          setShowConfetti(true);
          if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
          confettiTimeoutRef.current = setTimeout(() => {
            setShowConfetti(false);
            confettiTimeoutRef.current = null;
          }, 3500);
        }
      } else if (payload.isFirstPriorityToday && hoyLiteLayout === true && user?.id && !firstSessionMicroDone) {
        void markFirstSessionMicroStepCompleted(user.id);
        setFirstSessionMicroDone(true);
        void track('first_session_micro_step_completed', { source: 'hoy' });
      }

      if (Platform.OS !== 'web') {
        try {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Expo Go / missing native module must not block the tap.
        }
      }
    },
    [tasks, hoyLiteLayout, user?.id, firstSessionMicroDone],
  );

  const { toggleTask, clearToggleTimers } = useTaskActions({
    tasks,
    setTasks,
    loadTasks,
    showToast,
    setMenuOpen: taskExpansion.setMenuOpen,
    backgroundLoadTimeoutRef,
    isLoadingTasksRef,
    locale,
    onTaskCompleted: handleTaskCompleted,
  });

  const { refreshing, handleRefresh, displayName } = useHoyScreenBootstrap({
    user,
    t,
    showToast,
    openRecheck,
    recheckSource,
    loadTasks,
    loadTodayCheckIn,
    loadStreak,
    clearToggleTimers,
    confettiTimeoutRef,
    backgroundLoadTimeoutRef,
    setShowConfetti,
    setShowQuickOnboarding,
  });

  const { explanation, prioritizationPlan } = useHoyPrioritization({
    tasks,
    incompleteTasks,
    todayMood,
    todayEmotionLabel,
    energyLevel,
    time,
    focusLevel,
    locale,
    t,
  });

  const focusCountForCoach = useMemo(() => {
    if (prioritizationPlan?.prioritizedTasks.length) {
      return prioritizationPlan.prioritizedTasks.length;
    }
    return todayPriorityStats.pending;
  }, [prioritizationPlan, todayPriorityStats.pending]);

  const focusTasksForCoach = useMemo(
    () =>
      (prioritizationPlan?.prioritizedTasks ?? []).map((task) => ({
        id: task.id,
        content: task.content,
      })),
    [prioritizationPlan],
  );

  const { coachLine: aiCoachLine, tipIds: dailyTipIds, tipLead: dailyTipLead, fromAi: dailyTipsFromAi, focusTaskIds: aiFocusTaskIds, planHeadline: aiPlanHeadline, focusFromAi } =
    useKoraaDailyBrief({
      userId: user?.id,
      displayName,
      todayMood,
      todayEmotionLabel,
      energyLevel,
      availableTime: time,
      focusLevel,
      suggestion: explanation.suggestion,
      focusCount: focusCountForCoach,
      focusTasks: focusTasksForCoach,
      pendingCount: incompleteTasks.length,
      locale,
      incompleteTasks,
    });

  const coachSuggestion = useMemo(() => {
    // Ajuste activo de Para mí manda sobre el replan genérico.
    if (patternHoyCoachLine) return patternHoyCoachLine;
    if (checkInReplanCoachLine) return checkInReplanCoachLine;
    if (aiCoachLine) return aiCoachLine;
    return explanation.suggestion;
  }, [checkInReplanCoachLine, patternHoyCoachLine, aiCoachLine, explanation.suggestion]);

  const getCategoryColor = useCallback((category: string) => {
    const key = normalizeCategoryKey(category) ?? category.trim().toLowerCase();
    return THEME.colors.category[key as keyof typeof THEME.colors.category] ?? THEME.colors.text.secondary;
  }, []);

  const handleToggleTask = async (taskId: string, isSubtask: boolean = false, parentTaskId?: string) => {
    await toggleTask(taskId, isSubtask, parentTaskId);
  };

  return (
    <View style={styles.container}>
      <CalmScreen
        ref={scrollRef}
        topInset="lg"
        gap={THEME.layout.tabSectionGap}
        keyboardShouldPersistTaps="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={THEME.colors.calm.lavenderDeep}
            colors={[THEME.colors.calm.lavenderDeep, THEME.colors.gradient.pink]}
          />
        }
      >
        <HoyScreenHeader
          displayName={displayName}
          hasCheckInToday={Boolean(todayMood)}
          showSubtitle={false}
          showGreeting={false}
          streak={currentStreak}
          checkedInToday={Boolean(todayMood)}
          softGrace={usedGrace}
          crisisModeActive={crisisModeActive}
          onCareModePress={() => setCareModeSheet(crisisModeActive ? 'deactivate' : 'activate')}
        />

        {!hoyReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            <Text style={styles.loadingText}>{t('hoy.loading')}</Text>
          </View>
        ) : (
          <HoyTasksSection
            todayMood={todayMood ?? ''}
            todayEmotionLabel={todayEmotionLabel}
            energyLevel={energyLevel}
            time={time}
            focusLevel={focusLevel}
            todayPriorityStats={todayPriorityStats}
            compactLayout={hoyLiteCompactLayout}
            firstSessionMicroStep={firstSessionMicroStep}
            firstDayClose={crisisModeActive ? null : firstDayClose}
            onEnableTomorrowReminder={enableTomorrowReminder}
            returnMemory={returnMemory}
            onShowFullView={() => void handleOptOutHoyLite()}
            onShowMoreForToday={handleShowMoreForHoy}
            user={user}
            tasks={tasks}
            incompleteTasksForToday={incompleteTasksForToday}
            projectsMap={projectsMap}
            getCategoryColor={getCategoryColor}
            expandedTasks={expandedTasks}
            expandedDetailsTasks={expandedDetailsTasks}
            menuOpen={menuOpen}
            onMenuPress={toggleMenu}
            handleToggleTask={handleToggleTask}
            toggleTaskExpansion={toggleTaskExpansion}
            toggleDetailsExpansion={toggleDetailsExpansion}
            handleEditTask={handleEditTask}
            handleDeleteTask={handleDeleteTask}
            toggleTask={toggleTask}
            restOfDayExpanded={hoyRestOfDayExpanded}
            onCollapseRestOfDay={() => setShowSecondaryModules(false)}
            displayName={displayName}
            coachSuggestion={coachSuggestion}
            patternHoyMode={patternHoyMode}
            dailyTipIds={dailyTipIds}
            dailyTipLead={dailyTipLead}
            dailyTipsFromAi={dailyTipsFromAi}
            aiFocusTaskIds={aiFocusTaskIds}
            aiPlanHeadline={aiPlanHeadline}
            focusFromAi={focusFromAi}
            onDeleteTask={handleDeleteTask}
            onChangeEmotion={openQuickRecheck}
            crisisMode={crisisModeActive}
            onCareModeDismiss={() => setCareModeSheet('deactivate')}
            onCareModeLearnMore={() => setCareModeGuideOpen(true)}
            onTasksReload={loadTasks}
            showToast={showToast}
            setTasks={setTasks}
            focusedProject={focusedProject}
            onClearFocusedProject={() => void clearFocusedProject()}
          />
        )}

      </CalmScreen>

      <HoyScreenOverlays
        menuOpen={menuOpen}
        onCloseMenu={closeMenu}
        editingTask={editingTask}
        editProjects={editProjects}
        userId={user?.id}
        onProjectCreated={() => void reloadProjects()}
        onSavePlanEdit={handleSavePlanEdit}
        onDeleteEditingTask={handleDeleteEditingTask}
        planEditSaving={planEditSaving}
        onCloseEdit={closeEditTask}
        showConfetti={showConfetti}
        toastMessage={toastMessage}
        toastType={toastType}
        onHideToast={() => setToastMessage(null)}
        showQuickOnboarding={showQuickOnboarding}
        onCloseQuickOnboarding={() => setShowQuickOnboarding(false)}
      />

      <CareModeSheet
        visible={careModeSheet !== null}
        mode={careModeSheet ?? 'activate'}
        onClose={() => setCareModeSheet(null)}
        onConfirm={() => {
          void (async () => {
            setCareModeBusy(true);
            try {
              if (careModeSheet === 'activate') {
                await activateCrisisMode();
              } else {
                await dismissCrisisMode();
              }
              setCareModeSheet(null);
            } finally {
              setCareModeBusy(false);
            }
          })();
        }}
        loading={careModeBusy}
      />

      <CareModeGuideSheet
        visible={careModeGuideOpen}
        onClose={() => setCareModeGuideOpen(false)}
        lastSession={lastSession}
      />
    </View>
  );
}

export default function TodayScreenRoute() {
  return (
    <TabScreenErrorBoundary screenName="hoy">
      <TodayScreen />
    </TabScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  loadingContainer: {
    paddingVertical: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
});
