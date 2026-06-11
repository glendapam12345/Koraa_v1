import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useTasks } from '@/hooks/useTasks';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useProgress } from '@/hooks/useProgress';
import { normalizeCategoryKey } from '@/lib/i18n/categoryLabels';
import { getCatalog } from '@/lib/i18n';
import { HoyLiteBanner } from '@/components/hoy/HoyLiteBanner';
import { HoyScreenHeader } from '@/components/hoy/HoyScreenHeader';
import { HoyInicioView } from '@/components/hoy/HoyInicioView';
import { HoyTasksSection } from '@/components/hoy/HoyTasksSection';
import { useLocalSearchParams } from 'expo-router';
import type { Task } from '@/components/tasks/TaskCard';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { HoyScreenOverlays } from '@/components/hoy/HoyScreenOverlays';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { useHoyScreenLayout } from '@/hooks/useHoyScreenLayout';
import { useStreak } from '@/hooks/today/useStreak';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import { isHoyAfternoonNudgeWindow } from '@/lib/hoyDayFlowNudge';
import { getTodayPriorityStats, isPriorityCompletedToday } from '@/lib/priorityProgress';
import { useHoyDeleteTask, useHoyAllCompleteConfetti } from '@/hooks/useHoyTaskActions';
import { useHoyPrioritization } from '@/hooks/useHoyPrioritization';
import { useHoyTaskExpansion } from '@/hooks/useHoyTaskExpansion';
import { useHoyProjectsMap } from '@/hooks/useHoyProjectsMap';
import { useHoyScreenBootstrap } from '@/hooks/useHoyScreenBootstrap';
import type { TaskCompletedPayload } from '@/hooks/useTaskActions';
import { NoPendingTasksCelebration } from '@/components/NoPendingTasksCelebration';
import { HoyCrisisBanner } from '@/components/hoy/HoyCrisisBanner';
import { useCrisisMode } from '@/hooks/useCrisisMode';
import { router } from 'expo-router';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { openEmergencyKit } from '@/lib/emergencyKitNavigation';
import { HoySupportPanel } from '@/components/hoy/HoySupportPanel';

export default function TodayScreen() {
  const { t, locale } = useI18n();
  const [showQuickOnboarding, setShowQuickOnboarding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [showConfetti, setShowConfetti] = useState(false);
  const { openRecheck, recheckSource } = useLocalSearchParams<{
    openRecheck?: string;
    recheckSource?: string;
  }>();
  const [dismissedCelebration, setDismissedCelebration] = useState(false);
  const [showRedistribute, setShowRedistribute] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingTasksRef = useRef<boolean>(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const { user } = useAuth();
  const { crisisModeActive, lastSession, dismissCrisisMode } = useCrisisMode();
  const { isSubscribed } = useSubscription();

  const openEmergencyKitSession = useCallback(() => {
    openEmergencyKit(isSubscribed, lastSession, router);
  }, [isSubscribed, lastSession]);
  const {
    todayMood,
    energyLevel,
    time,
    focusLevel,
    loading: checkInLoading,
    loadTodayCheckIn,
  } = useCheckIn(showToast);

  const {
    tasks,
    loadingTasks,
    loadTasks,
    setTasks,
  } = useTasks(todayMood, showToast);

  const loading = checkInLoading || loadingTasks;

  const taskExpansion = useHoyTaskExpansion();
  const {
    expandedTasks,
    expandedDetailsTasks,
    menuOpen,
    closeMenu,
    toggleMenu,
    editingTask,
    setEditingTask,
    editContent,
    setEditContent,
    toggleDetailsExpansion,
    toggleTaskExpansion,
    handleEditTask,
    closeEditTask,
  } = taskExpansion;

  const { handleDeleteTask } = useHoyDeleteTask({
    t,
    showToast,
    setTasks,
    loadTasks,
    setMenuOpen: taskExpansion.setMenuOpen,
  });

  useHoyAllCompleteConfetti({
    tasks,
    loading,
    showConfetti,
    setShowConfetti,
    showToast,
    t,
    confettiTimeoutRef,
  });

  const { currentStreak, loadStreak } = useStreak(user?.id);
  const {
    hoyLiteLayout,
    hoyPreFlowActive,
    hoyRestOfDayExpanded,
    showSecondaryModules,
    showDayChangedCard,
    setShowSecondaryModules,
    handleOptOutHoyLite,
    handleDismissDayChangedCard,
    handleShowMoreForHoy,
  } = useHoyScreenLayout({
    userId: user?.id,
    loading,
    todayMood,
    showToast,
    loadTodayCheckIn,
    loadTasks,
    scrollRef,
  });

  const projectsMap = useHoyProjectsMap(user?.id);
  const { incompleteTasks } = useProgress(tasks, loading);

  const todayEmotionLabel = useMemo(() => {
    if (!todayMood) return '';
    const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
    return emotions[todayMood.toLowerCase()] ?? todayMood;
  }, [locale, todayMood]);

  const inicioEmotions = useMemo(() => {
    const catalog = getCatalog(locale).sentir.emotions as Record<string, string>;
    const ids = ['agotada', 'tranquila', 'ansiosa', 'motivada', 'abrumada', 'enfocada'] as const;
    const emojis: Record<(typeof ids)[number], string> = {
      agotada: '😔',
      tranquila: '😌',
      ansiosa: '😰',
      motivada: '✨',
      abrumada: '🥺',
      enfocada: '🌿',
    };
    return ids.map((id) => ({ id, emoji: emojis[id], label: catalog[id] ?? id }));
  }, [locale]);

  const incompleteTasksForToday = useMemo(() => {
    const today = getLocalDateString();
    return incompleteTasks.filter((task) => {
      const date = normalizeScheduledDate((task as Task).scheduled_date);
      return !date || date === today;
    });
  }, [incompleteTasks]);

  const todayPriorityStats = useMemo(() => getTodayPriorityStats(tasks), [tasks]);

  const priorityIncomplete = useMemo(
    () => incompleteTasks.filter((task) => task.is_priority),
    [incompleteTasks],
  );

  const completedPriorityToday = useMemo(() => {
    const today = getLocalDateString();
    return tasks.filter(
      (task) => task.is_priority && !task.parent_task_id && isPriorityCompletedToday(task, today),
    );
  }, [tasks]);

  const showNothingDoneCard =
    Boolean(todayMood) &&
    priorityIncomplete.length > 0 &&
    completedPriorityToday.length === 0 &&
    !loading &&
    isHoyAfternoonNudgeWindow() &&
    showDayChangedCard;

  const openQuickRecheck = useCallback(() => {
    openRecheckCheckIn('hoy');
  }, []);

  const handleRedistributeApplied = useCallback(() => {
    void loadTasks();
    showToast(t('hoy.lightenLoadCelebration'), 'success');
    setShowConfetti(true);
    if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    confettiTimeoutRef.current = setTimeout(() => {
      setShowConfetti(false);
      confettiTimeoutRef.current = null;
    }, 2800);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loadTasks, showToast, t]);

  const handleTaskCompleted = useCallback(
    (payload: TaskCompletedPayload) => {
      const mood = todayMood?.toLowerCase() ?? '';
      const lowEnergy = energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(mood);
      const allTasksComplete = tasks.length > 0 && tasks.every((task) => task.is_completed);

      if (payload.allPrioritiesDoneToday) {
        if (!allTasksComplete) {
          setShowConfetti(true);
          showToast(t('hoy.allStepsDoneToast'), 'success');
          if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
          confettiTimeoutRef.current = setTimeout(() => {
            setShowConfetti(false);
            confettiTimeoutRef.current = null;
          }, 3500);
          if (Platform.OS !== 'web') {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        return;
      }

      if (payload.isFirstPriorityToday) {
        showToast(lowEnergy ? t('hoy.firstStepDoneLow') : t('hoy.firstStepDone'), 'success');
      } else if (payload.remainingPriorities === 1) {
        showToast(t('hoy.focusOneRemaining'), 'success');
      } else {
        showToast(t('hoy.stepDoneToast'), 'success');
      }

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [todayMood, energyLevel, showToast, t, tasks],
  );

  const { toggleTask, handleSaveEdit: handleSaveEditAction, clearToggleTimers } = useTaskActions({
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

  const { explanation } = useHoyPrioritization({
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

  const getCategoryColor = useCallback((category: string) => {
    const key = normalizeCategoryKey(category) ?? category.trim().toLowerCase();
    return THEME.colors.category[key as keyof typeof THEME.colors.category] ?? THEME.colors.text.secondary;
  }, []);

  const handleToggleTask = async (taskId: string, isSubtask: boolean = false, parentTaskId?: string) => {
    await toggleTask(taskId, isSubtask, parentTaskId);
  };

  const handleSaveEdit = async () => {
    await handleSaveEditAction(editingTask, editContent, setEditingTask, setEditContent);
  };

  return (
    <View style={styles.container}>
      <CalmScreen
        ref={scrollRef}
        topInset={hoyPreFlowActive ? 'md' : 'lg'}
        gap={hoyPreFlowActive ? THEME.layout.sectionGapCompact : THEME.layout.tabSectionGap}
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
          minimal={hoyPreFlowActive}
          showSubtitle={!hoyPreFlowActive && !hoyLiteLayout}
          streak={currentStreak}
          checkedInToday={Boolean(todayMood)}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            <Text style={styles.loadingText}>{t('hoy.loading')}</Text>
          </View>
        ) : null}

        {!loading && crisisModeActive ? (
          <HoyCrisisBanner
            supportSnippet={lastSession?.response.supportMessage}
            onDismiss={() => void dismissCrisisMode()}
            onOpenKit={openEmergencyKitSession}
          />
        ) : null}

        {!loading && hoyLiteLayout ? (
          <HoyLiteBanner
            hasCheckIn={Boolean(todayMood)}
            hasTasks={incompleteTasks.length > 0}
            hasCompletedStep={todayPriorityStats.done > 0}
            expanded={showSecondaryModules}
          />
        ) : null}

        {!loading && hoyPreFlowActive ? (
          <HoyInicioView
            displayName={displayName}
            emotions={inicioEmotions}
            hasTasks={incompleteTasks.length > 0}
            pendingCount={incompleteTasks.length}
            liteMode={Boolean(hoyLiteLayout)}
            onCheckInSaved={() => {
              void loadTodayCheckIn();
              void loadTasks();
            }}
          />
        ) : null}

        {!loading && todayMood ? (
          <HoyTasksSection
            todayMood={todayMood}
            todayEmotionLabel={todayEmotionLabel}
            energyLevel={energyLevel}
            time={time}
            focusLevel={focusLevel}
            todayPriorityStats={todayPriorityStats}
            compactLayout={Boolean(hoyLiteLayout && !showSecondaryModules)}
            onShowFullView={() => void handleOptOutHoyLite()}
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
            coachSuggestion={explanation.suggestion}
            onShowMoreForToday={!showSecondaryModules ? handleShowMoreForHoy : undefined}
            onDeleteTask={handleDeleteTask}
            onChangeEmotion={openQuickRecheck}
            showDayChangedCard={showDayChangedCard && !hoyLiteLayout && !crisisModeActive}
            showNothingDoneCard={showNothingDoneCard && !hoyLiteLayout && !crisisModeActive}
            onQuickRecheck={openQuickRecheck}
            onDismissDayChanged={handleDismissDayChangedCard}
            onLightenLoad={() => setShowRedistribute(true)}
            crisisMode={crisisModeActive}
            crisisSupportMessage={lastSession?.response.supportMessage}
            onOpenEmergencyKit={openEmergencyKitSession}
          />
        ) : null}

        {!loading &&
        todayMood &&
        !crisisModeActive &&
        (!hoyLiteLayout || showSecondaryModules) ? (
          <HoySupportPanel
            userId={user?.id}
            emotionKey={todayMood}
            emotionLabel={todayEmotionLabel}
            energyLevel={energyLevel}
          />
        ) : null}

        {!loading &&
        todayMood &&
        !crisisModeActive &&
        !hoyLiteLayout &&
        incompleteTasksForToday.length === 0 &&
        tasks.length > 0 &&
        !dismissedCelebration ? (
          <NoPendingTasksCelebration onDismiss={() => setDismissedCelebration(true)} />
        ) : null}

      </CalmScreen>

      <HoyScreenOverlays
        menuOpen={menuOpen}
        onCloseMenu={closeMenu}
        editingTask={editingTask}
        editContent={editContent}
        onEditContentChange={setEditContent}
        onSaveEdit={handleSaveEdit}
        onCloseEdit={closeEditTask}
        showConfetti={showConfetti}
        toastMessage={toastMessage}
        toastType={toastType}
        onHideToast={() => setToastMessage(null)}
        userId={user?.id}
        showRedistribute={showRedistribute}
        onCloseRedistribute={() => setShowRedistribute(false)}
        tasks={tasks}
        energyLevel={energyLevel}
        availableTime={time || 'Medio (2-4hrs)'}
        emotion={todayMood || 'tranquila'}
        onRedistributeApplied={handleRedistributeApplied}
        showQuickOnboarding={showQuickOnboarding}
        onCloseQuickOnboarding={() => setShowQuickOnboarding(false)}
      />
    </View>
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
