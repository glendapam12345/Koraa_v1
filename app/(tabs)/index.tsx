import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useTasks } from '@/hooks/useTasks';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useProgress } from '@/hooks/useProgress';
import { supabase } from '@/lib/supabase';
import {
  buildHoyFocusSummaryLine,
  computePrioritizationPlan,
  generatePrioritizationExplanation,
  getTaskPriorityInsight,
} from '@/lib/smartPrioritization';
import { normalizeCategoryKey } from '@/lib/i18n/categoryLabels';
import { getCatalog } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { HoyDayFlowSection } from '@/components/hoy/HoyDayFlowSection';
import { HoyWelcomeHeader } from '@/components/hoy/HoyWelcomeHeader';
import { HoyHowItWorksCard } from '@/components/hoy/HoyHowItWorksCard';
import { HoyLiteBanner } from '@/components/hoy/HoyLiteBanner';
import { HoyQuickActions } from '@/components/hoy/HoyQuickActions';
import { HoyMeditationCard } from '@/components/hoy/HoyMeditationCard';
import { HoyTasksSection } from '@/components/hoy/HoyTasksSection';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import type { Task } from '@/components/tasks/TaskCard';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HoyScreenOverlays } from '@/components/hoy/HoyScreenOverlays';
import { resolveHoyLiteLayout, optOutHoyLiteLayout } from '@/lib/hoyLiteDay';
import {
  dismissDayChangedCard,
  shouldShowDayChangedCard,
} from '@/lib/hoyDayFlowDismiss';
import { FlowIndicator } from '@/components/FlowIndicator';
import { getLocalDateString } from '@/lib/dateLocal';
import { getTodayPriorityStats } from '@/lib/priorityProgress';
import type { TaskCompletedPayload } from '@/hooks/useTaskActions';

// Lazy loading para componentes pesados que no se usan inmediatamente
const NoPendingTasksCelebration = lazy(() => 
  import('@/components/NoPendingTasksCelebration').then(module => ({ default: module.NoPendingTasksCelebration }))
    .catch(() => ({ default: () => null as any }))
);


export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedDetailsTasks, setExpandedDetailsTasks] = useState<Set<string>>(new Set());
  /** Secciones de categoría expandidas (null = todas expandidas) */
  /** null = todas las secciones expandidas (estado por defecto). */
  const [expandedSections, setExpandedSections] = useState<Set<string> | null>(null);
  /** Tareas con "pasos del proyecto" expandidos */
  const [expandedProjectStepsTasks, setExpandedProjectStepsTasks] = useState<Set<string>>(new Set());
  /** Sección "Tareas sueltas" expandida para ver la lista */
  const [looseTasksExpanded, setLooseTasksExpanded] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showQuickOnboarding, setShowQuickOnboarding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousCompletedCount, setPreviousCompletedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickRecheck, setShowQuickRecheck] = useState(false);
  const { openRecheck } = useLocalSearchParams<{ openRecheck?: string }>();
  const [, setTotalTasksBefore] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [showMeditation, setShowMeditation] = useState(false);
  const [meditationType, setMeditationType] = useState<'morning' | 'evening'>('morning');
  const [morningMeditationDone, setMorningMeditationDone] = useState(false);
  const [eveningMeditationDone, setEveningMeditationDone] = useState(false);
  const [dismissedCelebration, setDismissedCelebration] = useState(false);
  /** Un solo desplegable: evita dos filas duplicando el mensaje del hero. */
  const [heroDetailsExpanded, setHeroDetailsExpanded] = useState(false);
  const [showRedistribute, setShowRedistribute] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'hoy' | 'todas'>('hoy');
  /** Primer día en Hoy: oculta bloques secundarios hasta mañana o “Mostrar todo”. */
  const [hoyLiteLayout, setHoyLiteLayout] = useState<boolean | null>(null);
  /** Módulos secundarios colapsables para reducir carga en pantalla. */
  const [showSecondaryModules, setShowSecondaryModules] = useState(false);
  const [showDayChangedCard, setShowDayChangedCard] = useState(false);
  const [emotionalMemoryInsights, setEmotionalMemoryInsights] = useState<{
    title: string;
    message: string;
    tip: string;
  }[]>([]);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingTasksRef = useRef<boolean>(false);
  const emotionalCardsAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  // Hooks personalizados
  const { user } = useAuth();

  useEffect(() => {
    if (hoyLiteLayout) {
      setTaskFilter('hoy');
    }
  }, [hoyLiteLayout]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const secondaryRaw = await AsyncStorage.getItem(`hoy_secondary_modules_${user.id}_v1`);
        if (cancelled) return;
        setShowSecondaryModules(secondaryRaw === '1');
      } catch {
        // no-op: se mantienen valores por defecto
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    // En “hoyLiteLayout” ignoramos persistencia para no pelear con la vista simplificada.
    if (!user?.id) return;
    if (hoyLiteLayout) return;
    void AsyncStorage.setItem(
      `hoy_secondary_modules_${user.id}_v1`,
      showSecondaryModules ? '1' : '0',
    );
  }, [user?.id, showSecondaryModules, hoyLiteLayout]);

  const handleOptOutHoyLite = useCallback(async () => {
    if (!user?.id) return;
    await optOutHoyLiteLayout(user.id);
    setHoyLiteLayout(false);
    showToast(t('hoy.showAllSectionsToast'), 'info');
  }, [user?.id, showToast, t]);

  const {
    todayMood,
    energyLevel,
    time,
    focusLevel,
    loading: checkInLoading,
    loadTodayCheckIn,
  } = useCheckIn(showToast);

  const todayEmotionLabel = useMemo(() => {
    if (!todayMood) return '';
    const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
    return emotions[todayMood.toLowerCase()] ?? todayMood;
  }, [locale, todayMood]);

  const {
    tasks,
    loadingTasks,
    loadTasks,
    setTasks,
  } = useTasks(todayMood, showToast);

  const loading = checkInLoading || loadingTasks;

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        setHoyLiteLayout(null);
        return;
      }
      let cancelled = false;
      void (async () => {
        const lite = await resolveHoyLiteLayout(user.id);
        if (!cancelled) setHoyLiteLayout(lite);
      })();
      void (async () => {
        try {
          const { syncAll } = await import('@/lib/offlineStorage');
          await syncAll();
        } catch {
          // no crítico
        }
        if (cancelled) return;
        await Promise.all([loadTodayCheckIn(), loadTasks()]);
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id, loadTodayCheckIn, loadTasks]),
  );

  const [projectsMap, setProjectsMap] = useState<Record<string, { name: string; color: string }>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('user_id', user.id);
      if (!error && data) {
        setProjectsMap(Object.fromEntries(data.map((p) => [p.id, { name: p.name, color: p.color }])));
      }
    })();
  }, [user]);

  const { incompleteTasks } = useProgress(tasks, loading);

  const priorityIncomplete = useMemo(
    () => incompleteTasks.filter((task) => task.is_priority),
    [incompleteTasks],
  );

  const completedPriorityToday = useMemo(() => {
    const today = getLocalDateString();
    return tasks.filter((task) => {
      if (!task.is_priority || !task.is_completed) return false;
      if (!task.completed_at) return false;
      return String(task.completed_at).slice(0, 10) === today;
    });
  }, [tasks]);

  const showNothingDoneCard =
    Boolean(todayMood) &&
    priorityIncomplete.length > 0 &&
    completedPriorityToday.length === 0 &&
    !loading;

  useEffect(() => {
    if (!user?.id || !todayMood) {
      setShowDayChangedCard(false);
      return;
    }
    let cancelled = false;
    void shouldShowDayChangedCard(user.id).then((show) => {
      if (!cancelled) setShowDayChangedCard(show);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, todayMood]);

  const handleDismissDayChangedCard = useCallback(() => {
    if (user?.id) {
      void dismissDayChangedCard(user.id);
    }
    setShowDayChangedCard(false);
  }, [user?.id]);

  const openQuickRecheck = useCallback(() => {
    setShowQuickRecheck(true);
  }, []);

  useEffect(() => {
    if (openRecheck === '1') {
      setShowQuickRecheck(true);
      router.setParams({ openRecheck: undefined });
    }
  }, [openRecheck]);

  // En "Hoy" solo mostramos tareas sin fecha o programadas para hoy
  const incompleteTasksForToday = useMemo(() => {
    const today = getLocalDateString();
    return incompleteTasks.filter((t) => {
      const date = (t as Task).scheduled_date;
      return !date || date === today;
    });
  }, [incompleteTasks]);

  // Lista que se muestra según el filtro (Hoy | Todas)
  const displayedIncompleteTasks = useMemo(
    () => (taskFilter === 'todas' ? incompleteTasks : incompleteTasksForToday),
    [taskFilter, incompleteTasks, incompleteTasksForToday]
  );

  const hoyLiteActive = hoyLiteLayout === true;
  const showSecondaryModulesEffective = showSecondaryModules && !hoyLiteActive;

  const todayPriorityStats = useMemo(
    () => getTodayPriorityStats(tasks),
    [tasks],
  );

  const handleTaskCompleted = useCallback(
    (payload: TaskCompletedPayload) => {
      const mood = todayMood?.toLowerCase() ?? '';
      const lowEnergy =
        energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(mood);
      const allTasksComplete =
        tasks.length > 0 && tasks.every((task) => task.is_completed);

      if (payload.allPrioritiesDoneToday) {
        if (!allTasksComplete) {
          setShowConfetti(true);
          showToast(t('hoy.allPrioritiesDone'), 'success');
          if (confettiTimeoutRef.current) {
            clearTimeout(confettiTimeoutRef.current);
          }
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
        showToast(
          lowEnergy ? t('hoy.firstPriorityDoneLow') : t('hoy.firstPriorityDone'),
          'success',
        );
      } else {
        showToast(t('hoy.priorityDone'), 'success');
      }

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [todayMood, energyLevel, showToast, t, tasks],
  );

  const {
    toggleTask,
    handleSaveEdit: handleSaveEditAction,
    clearToggleTimers,
  } = useTaskActions({
    tasks,
    setTasks,
    loadTasks,
    showToast,
    setMenuOpen,
    backgroundLoadTimeoutRef,
    isLoadingTasksRef,
    locale,
    onTaskCompleted: handleTaskCompleted,
  });

  const loadStreak = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const checkInDates = new Set<string>();

      // Fetch check-ins from last 365 days
      const oneYearAgo = new Date(today);
      oneYearAgo.setDate(today.getDate() - 365);

      const { data: checkIns } = await supabase
        .from('daily_check_ins')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', oneYearAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (checkIns) {
        checkIns.forEach((checkIn: { date: string }) => {
          checkInDates.add(checkIn.date);
        });
      }

      // Calculate streak from today backwards
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];

        if (checkInDates.has(dateString)) {
          streak++;
        } else if (i === 0) {
          continue;
        } else {
          break;
        }
      }

      setCurrentStreak(streak);
    } catch (error) {
      logger.debug('Error cargando racha:', error);
      // No mostrar toast para errores de racha (no crítico)
    }
  }, []);

  const loadEmotionalMemory = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      if (!authUser) return;

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 42);

      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('date, energy_level, emotion')
        .eq('user_id', authUser.id)
        .gte('date', fromDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error || !data || data.length < 4) {
        setEmotionalMemoryInsights([]);
        return;
      }

      const dayNames = [
        t('insights.weekdaySun'),
        t('insights.weekdayMon'),
        t('insights.weekdayTue'),
        t('insights.weekdayWed'),
        t('insights.weekdayThu'),
        t('insights.weekdayFri'),
        t('insights.weekdaySat'),
      ];
      const byDay = new Map<number, number[]>();
      const emotionCounts = new Map<string, number>();

      data.forEach((item) => {
        const dt = new Date(item.date);
        const day = dt.getDay();
        const energy = typeof item.energy_level === 'number' ? item.energy_level : null;
        if (energy !== null) {
          byDay.set(day, [...(byDay.get(day) ?? []), energy]);
        }
        if (item.emotion) {
          const key = item.emotion.toLowerCase();
          emotionCounts.set(key, (emotionCounts.get(key) ?? 0) + 1);
        }
      });

      let lowestDay = -1;
      let lowestAvg = Number.POSITIVE_INFINITY;
      let highestDay = -1;
      let highestAvg = Number.NEGATIVE_INFINITY;

      byDay.forEach((energies, day) => {
        if (energies.length < 2) return;
        const avg = energies.reduce((sum, val) => sum + val, 0) / energies.length;
        if (avg < lowestAvg) {
          lowestAvg = avg;
          lowestDay = day;
        }
        if (avg > highestAvg) {
          highestAvg = avg;
          highestDay = day;
        }
      });

      const topEmotionEntry = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const topEmotion = topEmotionEntry ? topEmotionEntry[0] : null;

      const insights: { title: string; message: string; tip: string }[] = [];

      if (lowestDay !== -1 && lowestAvg <= 3.2) {
        insights.push({
          title: t('hoy.emotionalMemory'),
          message: t('hoyMemory.lowEnergyMessage', { day: dayNames[lowestDay] }),
          tip: t('hoyMemory.lowEnergyTip', {
            emotionSuffix: topEmotion
              ? t('hoyMemory.lowEnergyTipEmotion', { emotion: topEmotion })
              : '',
          }),
        });
      }

      if (highestDay !== -1 && highestAvg >= 4) {
        insights.push({
          title: t('hoy.emotionalMemory'),
          message: t('hoyMemory.highEnergyMessage', { day: dayNames[highestDay] }),
          tip: t('hoy.memoryTipDeep'),
        });
      }

      if (insights.length === 0) {
        insights.push({
          title: t('hoy.emotionalMemory'),
          message: t('hoy.memoryMsgVariable'),
          tip: t('hoy.memoryTipRealtime'),
        });
      }

      if (topEmotion && !insights.some((i) => i.message.includes(topEmotion))) {
        insights.push({
          title: t('hoy.emotionalMemory'),
          message: t('hoyMemory.topEmotionMessage', { emotion: topEmotion }),
          tip: t('hoy.memoryTipFriction'),
        });
      }

      setEmotionalMemoryInsights(insights.slice(0, 3));
    } catch (error) {
      logger.debug('Error cargando memoria emocional:', error);
      setEmotionalMemoryInsights([]);
    }
  }, [t]);

  useEffect(() => {
    const unsub = subscribeCheckInCelebration((p) => {
      void loadStreak();
      void loadTodayCheckIn();
      void loadEmotionalMemory();
      if (p.milestone) {
        setShowConfetti(true);
        showToast(t('hoyPlanFallback.streakToast', { count: p.streak }), 'success');
        if (confettiTimeoutRef.current) {
          clearTimeout(confettiTimeoutRef.current);
        }
        confettiTimeoutRef.current = setTimeout(() => {
          setShowConfetti(false);
          confettiTimeoutRef.current = null;
        }, 3500);
        if (Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        showToast(t('hoy.prioritiesUpdatedToast'), 'success');
        if (Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    });
    return unsub;
  }, [loadStreak, loadTodayCheckIn, loadEmotionalMemory, showToast]);

  const loadMeditations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getLocalDateString();
      const { data: meditations } = await supabase
        .from('meditations')
        .select('type')
        .eq('user_id', user.id)
        .eq('date', today);

      if (meditations) {
        setMorningMeditationDone(meditations.some((m: { type: string }) => m.type === 'morning'));
        setEveningMeditationDone(meditations.some((m: { type: string }) => m.type === 'evening'));
      }
    } catch (error) {
      logger.debug('Error cargando meditaciones:', error);
      // No mostrar toast para errores de meditaciones (no crítico)
    }
  }, []);

  const handleMeditationComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getLocalDateString();
      const { error } = await supabase
        .from('meditations')
        .upsert({
          user_id: user.id,
          date: today,
          type: meditationType,
        }, { onConflict: 'user_id,date,type' });

      if (error) {
        logger.error('Error guardando meditación:', error);
        const code = (error as { code?: string }).code;
        const msg = (error as { message?: string }).message ?? '';
        if (code === 'PGRST205' || msg.includes('meditations')) {
          Alert.alert(
            t('hoy.meditationPrepTitle'),
            t('hoy.meditationPrepBody'),
            [{ text: t('errors.understood') }],
          );
          return;
        }
        showToast(t('errors.saveMeditationFailed'), 'error');
        return;
      }

      // Update state
      if (meditationType === 'morning') {
        setMorningMeditationDone(true);
      } else {
        setEveningMeditationDone(true);
      }

      setShowMeditation(false);
      setShowConfetti(true);
      showToast(t('hoy.meditationDoneToast'), 'success');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Limpiar timeout anterior si existe
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
      confettiTimeoutRef.current = setTimeout(() => {
        setShowConfetti(false);
        confettiTimeoutRef.current = null;
      }, 3000);
    } catch (error) {
      logger.error('Error inesperado en meditación:', error);
      showToast(t('errors.generic'), 'error');
    }
  };

  const handleStartMeditation = (type: 'morning' | 'evening') => {
    setMeditationType(type);
    setShowMeditation(true);
  };

  // loadTasks ahora viene del hook useTasks


  const loadPrioritizationMetadata = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getLocalDateString();
      const stored = await AsyncStorage.getItem(`prioritization_${user.id}_${today}`);
      
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data && data.date === today) {
            setTotalTasksBefore(data.totalTasksBefore);
          } else {
            setTotalTasksBefore(null);
          }
        } catch (parseError) {
          logger.debug('Error parseando metadata:', parseError);
          setTotalTasksBefore(null);
        }
      } else {
        setTotalTasksBefore(null);
      }
    } catch (error) {
      logger.debug('Error cargando metadata:', error);
      setTotalTasksBefore(null);
      // No mostrar toast para errores de metadata (no crítico)
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadTodayCheckIn();
    loadStreak();
    loadMeditations();
    loadPrioritizationMetadata();
    loadEmotionalMemory();

    // Intentar sincronizar datos offline al cargar
    (async () => {
      try {
        const { syncAll } = await import('@/lib/offlineStorage');
        await syncAll();
      } catch (error) {
        // Silencioso, no es crítico
        logger.debug('Sincronización offline:', error);
      }
    })();

    // Mostrar onboarding rápido solo la primera vez
    (async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenQuickOnboarding');
        if (!hasSeenOnboarding) {
          // Pequeño delay para que la app cargue primero
          setTimeout(() => {
            setShowQuickOnboarding(true);
          }, 800);
          await AsyncStorage.setItem('hasSeenQuickOnboarding', 'true');
        }
      } catch (error) {
        logger.debug('Error checking onboarding:', error);
      }
    })();

    // Cleanup: limpiar todos los timeouts si el componente se desmonta
    return () => {
      clearToggleTimers();
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = null;
      }
      if (backgroundLoadTimeoutRef.current) {
        clearTimeout(backgroundLoadTimeoutRef.current);
        backgroundLoadTimeoutRef.current = null;
      }
    };
  }, [loadTasks, loadTodayCheckIn, loadStreak, loadMeditations, loadPrioritizationMetadata, loadEmotionalMemory, clearToggleTimers]);

  // Onboarding rápido se muestra solo la primera vez (ya está en el useEffect principal)

  // Detectar cuando todas las tareas están completadas
  useEffect(() => {
    if (tasks.length === 0 || loading) return;
    
    const allCompleted = tasks.every((t: Task) => t.is_completed);
    const hasTasks = tasks.length > 0;
    const completedCount = tasks.filter((t: Task) => t.is_completed).length;
    const wasNotAllCompleted = previousCompletedCount < tasks.length;
    
    if (allCompleted && hasTasks && wasNotAllCompleted && !showConfetti) {
      // ¡Todas las tareas completadas!
      setShowConfetti(true);
      showToast(t('hoy.dayComplete'), 'success');
      
      // Ocultar confetti después de 4 segundos
      // Limpiar timeout anterior si existe
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
      confettiTimeoutRef.current = setTimeout(() => {
        setShowConfetti(false);
        confettiTimeoutRef.current = null;
      }, 4000);
    }
    
    // Actualizar contador de tareas completadas
    setPreviousCompletedCount(completedCount);
  }, [tasks, loading, previousCompletedCount, showConfetti, showToast, t]);

  // La animación de la barra de progreso ahora se maneja en el hook useProgress

  const toggleDetailsExpansion = useCallback((taskId: string) => {
    setExpandedDetailsTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  }, []);

  // toggleTask ahora viene del hook useTaskActions
  const handleToggleTask = async (taskId: string, isSubtask: boolean = false, parentTaskId?: string) => {
    await toggleTask(taskId, isSubtask, parentTaskId);
  };

  const getCategoryColor = useCallback((category: string) => {
    const key =
      normalizeCategoryKey(category) ??
      category.trim().toLowerCase();
    return THEME.colors.category[key as keyof typeof THEME.colors.category] ?? THEME.colors.text.secondary;
  }, []);

  const getEmotionColor = useCallback((emotion: string) => {
    const key = emotion.toLowerCase();
    return THEME.colors.emotionTint[key as keyof typeof THEME.colors.emotionTint] ?? THEME.colors.emotionTint.default;
  }, []);

  // Categorías ahora son invisibles - se detectan automáticamente

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setEditContent(task.content);
    setMenuOpen(null);
  }, []);

  const handleSaveEdit = async () => {
    await handleSaveEditAction(editingTask, editContent, setEditingTask, setEditContent);
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      t('hoy.deleteTaskTitle'),
      `${t('hoy.deleteTaskConfirm', { task: task.content })}${
        task.subtasks && task.subtasks.length > 0
          ? `\n\n${t('hoy.deleteSubtasksAlso', { count: task.subtasks.length })}`
          : ''
      }`,
      [
        { text: t('errors.cancel'), style: 'cancel', onPress: () => setMenuOpen(null) },
        {
          text: t('errors.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar subtareas primero (si las hay)
              if (task.subtasks && task.subtasks.length > 0) {
                const subtaskIds = task.subtasks.map((st: Task) => st.id);
                const { error: subtasksError } = await supabase
                  .from('tasks')
                  .delete()
                  .in('id', subtaskIds);

                if (subtasksError) {
                  logger.error('Error eliminando subtareas:', subtasksError);
                  showToast(t('errors.deleteSubtasksFailed'), 'error');
                  setMenuOpen(null);
                  return;
                }
              }

              // Eliminar tarea principal
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id);

              if (error) {
                logger.error('Error eliminando tarea:', error);
                showToast(t('errors.deleteTaskFailed'), 'error');
                setMenuOpen(null);
                return;
              }

              // Actualización optimista: quitar tarea y sus subtareas de la lista
              setTasks((prevTasks: Task[]) =>
                prevTasks.filter((t: Task) => t.id !== task.id && t.parent_task_id !== task.id)
              );
              setMenuOpen(null);
              showToast(t('hoy.taskDeleted'), 'success');
              loadTasks();
            } catch (error) {
              logger.error('Error inesperado al eliminar:', error);
              showToast(t('errors.deleteTaskFailed'), 'error');
              setMenuOpen(null);
            }
          },
        },
      ]
    );
  };

  // Los cálculos de progreso vienen del hook useProgress (líneas 76-82)

  // Función para obtener mensaje explicativo basado en energía y emoción - Memoizada
  const getPriorityExplanation = useCallback(() => {
    // Si no hay check-in, mostrar mensaje de flujo
    if (!todayMood || energyLevel === 0) {
      return {
        title: t('hoy.planTitle'),
        message: t('hoy.planSteps'),
        suggestion: t('hoyPlanFallback.planSteps'),
        reasoning: t('hoy.planReasoning'),
      };
    }

    // Si tenemos todos los datos del check-in, usar algoritmo inteligente
    if (time && energyLevel > 0 && focusLevel) {
      try {
        const explanation = generatePrioritizationExplanation(
          incompleteTasks,
          {
            energyLevel,
            emotion: todayMood,
            availableTime: time,
            focusLevel: focusLevel || t('hoy.focusLevelNormal'),
          },
          tasks,
          locale,
        );
        
        return {
          title: t('hoy.planTitle'),
          message: explanation.message,
          suggestion: explanation.suggestion,
          reasoning: explanation.reasoning,
        };
      } catch (error) {
        logger.debug('Error generando explicación inteligente:', error);
      }
    }

    // Fallback simplificado: solo si falta algún dato del check-in
    const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
    const emotionKey = todayMood.toLowerCase();
    const emotionLabel = emotions[emotionKey] ?? todayMood;
    const priorityCount = incompleteTasks.length;
    const negativeEmotions = ['agotada', 'ansiosa', 'abrumada'];
    const isNegativeEmotion = negativeEmotions.includes(emotionKey);

    let message = '';
    let reasoning = '';
    let suggestion = '';

    if (energyLevel <= 2 || isNegativeEmotion) {
      message =
        priorityCount === 1
          ? t('hoyPlanFallback.essentialOne', { count: priorityCount })
          : t('hoyPlanFallback.essentialMany', { count: priorityCount });
      reasoning = t('hoyPlanFallback.reasoningLow', { energy: energyLevel, emotion: emotionLabel });
      suggestion = t('hoy.planSuggestLow');
    } else if (energyLevel === 3) {
      message =
        priorityCount === 1
          ? t('hoyPlanFallback.priorityOne', { count: priorityCount })
          : t('hoyPlanFallback.priorityMany', { count: priorityCount });
      reasoning = t('hoyPlanFallback.reasoningMid', { emotion: emotionLabel });
      suggestion = t('hoy.planSuggestMid');
    } else if (energyLevel >= 4) {
      message =
        priorityCount === 1
          ? t('hoyPlanFallback.tasksOne', { count: priorityCount })
          : t('hoyPlanFallback.tasksMany', { count: priorityCount });
      reasoning = t('hoyPlanFallback.reasoningHigh', { emotion: emotionLabel });
      suggestion = t('hoy.planSuggestHigh');
    }

    return {
      title: t('hoy.planTitle'),
      message,
      suggestion,
      reasoning,
    };
  }, [todayMood, energyLevel, incompleteTasks, time, focusLevel, tasks, t, locale]);

  const explanation = useMemo(
    () => getPriorityExplanation(),
    [getPriorityExplanation]
  );

  const prioritizationPlan = useMemo(() => {
    if (!todayMood || energyLevel <= 0 || !time || !focusLevel) return null;
    return computePrioritizationPlan(
      tasks,
      {
        energyLevel,
        emotion: todayMood,
        availableTime: time,
        focusLevel,
      },
      locale,
    );
  }, [tasks, todayMood, energyLevel, time, focusLevel, locale]);

  const focusSummaryLine = useMemo(() => {
    if (!prioritizationPlan || !todayMood || !time || !focusLevel) return null;
    return buildHoyFocusSummaryLine(
      prioritizationPlan,
      {
        energyLevel,
        emotion: todayMood,
        availableTime: time,
        focusLevel,
      },
      locale,
      todayEmotionLabel,
    );
  }, [
    prioritizationPlan,
    todayMood,
    energyLevel,
    time,
    focusLevel,
    locale,
    todayEmotionLabel,
  ]);

  const getTaskPriorityInsightForList = useCallback(
    (taskId: string) => {
      if (!todayMood || !prioritizationPlan) return undefined;
      const insight = getTaskPriorityInsight(taskId, prioritizationPlan, locale);
      if (insight.whyUp.length === 0 && insight.whyDown.length === 0) return undefined;
      return insight;
    },
    [todayMood, prioritizationPlan, locale],
  );

  const emotionalClosure = useMemo(() => {
    if (!todayMood || energyLevel === 0) return null;

    const totalCount = tasks.length;
    const completedCount = tasks.filter((t: Task) => t.is_completed).length;
    const pendingCount = Math.max(totalCount - completedCount, 0);
    const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;
    const lowEnergyContext = energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(todayMood.toLowerCase());

    if (totalCount === 0) {
      return {
        title: t('hoy.closureTitle'),
        message: t('hoy.closureListen'),
        note: t('hoy.closureListenNote'),
      };
    }

    if (completionRatio >= 0.8) {
      return {
        title: t('hoy.closureTitle'),
        message: t('hoy.closureEnough', { completed: completedCount, total: totalCount }),
        note: t('hoy.closureRestNote'),
      };
    }

    if (lowEnergyContext) {
      return {
        title: t('hoy.closureTitle'),
        message:
          completedCount > 0
            ? t('hoy.closureLowProgress', { count: completedCount })
            : t('hoy.closureNoProgress'),
        note:
          pendingCount > 0
            ? t('hoy.closurePendingSplit', { count: pendingCount })
            : t('hoy.closureResumeLight'),
      };
    }

    if (completionRatio >= 0.4) {
      return {
        title: t('hoy.closureTitle'),
        message: t('hoy.closureMidProgress', { completed: completedCount, total: totalCount }),
        note:
          pendingCount > 0
            ? t('hoy.closurePendingOne', { count: pendingCount })
            : t('hoy.closureCleanList'),
      };
    }

    return {
      title: t('hoy.closureTitle'),
      message:
        completedCount > 0
          ? t('hoy.closureSmallProgress', { count: completedCount })
          : t('hoy.closureHardDay'),
      note: t('hoy.closureTomorrow'),
    };
  }, [todayMood, energyLevel, tasks, t]);

  const emotionalToneLine = useMemo(() => {
    if (!todayMood) return t('hoy.mantraDefault');
    const mood = todayMood.toLowerCase();
    if (['agotada', 'ansiosa', 'abrumada'].includes(mood)) return t('hoy.mantraCompassion');
    if (['motivada', 'enfocada'].includes(mood)) return t('hoy.mantraImpulse');
    return t('hoy.mantraSteady');
  }, [todayMood, t]);

  const selectedEmotionalMemoryInsight = useMemo(() => {
    if (emotionalMemoryInsights.length === 0) return null;
    const dayIndex = new Date().getDate() % emotionalMemoryInsights.length;
    return emotionalMemoryInsights[dayIndex];
  }, [emotionalMemoryInsights]);

  useEffect(() => {
    emotionalCardsAnim.setValue(0);
    Animated.timing(emotionalCardsAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [emotionalClosure, selectedEmotionalMemoryInsight, emotionalCardsAnim]);


  // Función para manejar pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadTasks(),
        loadTodayCheckIn(),
        loadStreak(),
        loadMeditations(),
        loadEmotionalMemory(),
      ]);
    } catch (error) {
      logger.error('Error al refrescar:', error);
      showToast(t('errors.refreshFailed'), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Función para obtener saludo basado en la hora del día
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('hoy.greetingMorning');
    if (hour < 18) return t('hoy.greetingAfternoon');
    return t('hoy.greetingEvening');
  }, [t]);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + THEME.spacing.lg,
            paddingBottom: Math.max(THEME.spacing.sm, insets.bottom + THEME.spacing.xs),
          },
        ]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.gradient.blue}
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          />
        }
      >
        {/* Estado de carga */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            <Text style={styles.loadingText}>{t('hoy.loading')}</Text>
          </View>
        )}

        {!loading && (
          <HoyWelcomeHeader
            greeting={getGreeting}
            showUserActions={Boolean(user)}
            currentStreak={currentStreak}
          />
        )}

        {!loading && <FlowIndicator currentStep="accionar" />}

        {!loading && todayMood ? (
          <HoyDayFlowSection
            showDayChangedCard={showDayChangedCard}
            showNothingDoneCard={showNothingDoneCard}
            onQuickRecheck={openQuickRecheck}
            onDismissDayChanged={handleDismissDayChangedCard}
            onLightenLoad={() => setShowRedistribute(true)}
          />
        ) : null}
        {!loading && showSecondaryModulesEffective ? (
          <HoyHowItWorksCard hasCheckInToday={Boolean(todayMood)} />
        ) : null}

        {hoyLiteLayout ? <HoyLiteBanner onShowAll={() => void handleOptOutHoyLite()} /> : null}

        {!loading ? (
          <HoyQuickActions
            showSecondaryToggle={!hoyLiteActive}
            showSecondaryModules={showSecondaryModules}
            onToggleSecondaryModules={() => setShowSecondaryModules((prev) => !prev)}
          />
        ) : null}

        {!loading && showSecondaryModulesEffective ? (
          <HoyMeditationCard
            morningDone={morningMeditationDone}
            eveningDone={eveningMeditationDone}
            onStartMorning={() => {
              if (!morningMeditationDone) handleStartMeditation('morning');
            }}
            onStartEvening={() => {
              if (!eveningMeditationDone) handleStartMeditation('evening');
            }}
          />
        ) : null}

        {!loading && (
          <HoyTasksSection
            todayMood={todayMood}
            todayEmotionLabel={todayEmotionLabel}
            energyLevel={energyLevel}
            time={time}
            focusLevel={focusLevel}
            focusSummaryLine={focusSummaryLine}
            todayPriorityStats={todayPriorityStats}
            getEmotionColor={getEmotionColor}
            hoyLiteLayout={hoyLiteLayout}
            showSecondaryModulesEffective={showSecondaryModulesEffective}
            heroDetailsExpanded={heroDetailsExpanded}
            onToggleHeroDetails={() => setHeroDetailsExpanded((e) => !e)}
            explanation={explanation}
            emotionalClosure={emotionalClosure}
            emotionalToneLine={emotionalToneLine}
            emotionalCardsAnim={emotionalCardsAnim}
            selectedEmotionalMemoryInsight={selectedEmotionalMemoryInsight}
            taskFilter={taskFilter}
            onTaskFilterChange={setTaskFilter}
            user={user}
            onShowRedistribute={() => setShowRedistribute(true)}
            tasks={tasks}
            incompleteTasks={incompleteTasks}
            displayedIncompleteTasks={displayedIncompleteTasks}
            incompleteTasksForToday={incompleteTasksForToday}
            projectsMap={projectsMap}
            getCategoryColor={getCategoryColor}
            expandedTasks={expandedTasks}
            expandedDetailsTasks={expandedDetailsTasks}
            menuOpen={menuOpen}
            onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
            expandedSections={expandedSections}
            onExpandedSectionsChange={setExpandedSections}
            looseTasksExpanded={looseTasksExpanded}
            onToggleLooseTasksExpanded={() => setLooseTasksExpanded((e) => !e)}
            expandedProjectStepsTasks={expandedProjectStepsTasks}
            onExpandedProjectStepsChange={setExpandedProjectStepsTasks}
            handleToggleTask={handleToggleTask}
            toggleTaskExpansion={toggleTaskExpansion}
            toggleDetailsExpansion={toggleDetailsExpansion}
            handleEditTask={handleEditTask}
            handleDeleteTask={handleDeleteTask}
            toggleTask={toggleTask}
            getTaskPriorityInsightForList={getTaskPriorityInsightForList}
          />
        )}

        {/* Mensaje cuando no hay tareas pendientes pero sí completadas */}
        {!loading && todayMood && displayedIncompleteTasks.length === 0 && tasks.length > 0 && !dismissedCelebration && (
          <Suspense fallback={null}>
            <NoPendingTasksCelebration onDismiss={() => setDismissedCelebration(true)} />
          </Suspense>
        )}

        {/* Recomendaciones: siempre visibles al final (omitidas en vista simplificada primer día) */}
        {user && showSecondaryModulesEffective && (
          <View style={styles.recommendationsWrap}>
            <RecommendationsSection userId={user.id} />
          </View>
        )}
      </ScrollView>

      <HoyScreenOverlays
        menuOpen={menuOpen}
        onCloseMenu={() => setMenuOpen(null)}
        editingTask={editingTask}
        editContent={editContent}
        onEditContentChange={setEditContent}
        onSaveEdit={handleSaveEdit}
        onCloseEdit={() => {
          setEditingTask(null);
          setEditContent('');
        }}
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
        onRedistributeApplied={() => {
          void loadTasks();
          showToast(t('hoyExtra.datesUpdated'), 'success');
        }}
        showQuickOnboarding={showQuickOnboarding}
        onCloseQuickOnboarding={() => setShowQuickOnboarding(false)}
        showQuickRecheck={showQuickRecheck}
        onCloseQuickRecheck={() => setShowQuickRecheck(false)}
        initialEmotion={todayMood || ''}
        initialEnergy={energyLevel || 0}
        onQuickRecheckComplete={() => {
          void loadTodayCheckIn();
          void loadTasks();
        }}
        showMeditation={showMeditation}
        onCloseMeditation={() => setShowMeditation(false)}
        meditationType={meditationType}
        onMeditationComplete={handleMeditationComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {},
  loadingContainer: {
    paddingVertical: THEME.spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.md,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  recommendationsWrap: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
    paddingTop: 0,
  },
});
