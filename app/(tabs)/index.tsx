import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  ActivityIndicator,
  View as ViewRN,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Toast } from '@/components/Toast';
import { TaskList } from '@/components/tasks/TaskList';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useTasks } from '@/hooks/useTasks';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useProgress } from '@/hooks/useProgress';
import { supabase } from '@/lib/supabase';
import {
  buildHoyFocusSummaryLine,
  computePrioritizationPlan,
  generatePrioritizationExplanation,
  getPrioritizationExplainerBullets,
  getTaskPriorityInsight,
} from '@/lib/smartPrioritization';
import { CATEGORY_ORDER_KEYS, categoryLabel, normalizeCategoryKey } from '@/lib/i18n/categoryLabels';
import { getCatalog } from '@/lib/i18n';
import { getEmotionEmoji } from '@/lib/emotionalInsights';
import { logger } from '@/lib/logger';
import { Plus, Flame, PenTool, Heart, Target, ArrowRight, Lightbulb, ChevronDown, ChevronRight, FolderKanban, ClipboardList, CalendarRange, Settings, CircleHelp, RefreshCw } from 'lucide-react-native';
import { GradientButton } from '@/components/GradientButton';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import type { Task } from '@/components/tasks/TaskCard';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickOnboardingModal } from '@/components/onboarding/QuickOnboardingModal';
import { RedistributeWorkloadModal } from '@/components/tasks/RedistributeWorkloadModal';
import { MeditationCircleSimple } from '@/components/MeditationCircleSimple';
import { resolveHoyLiteLayout, optOutHoyLiteLayout } from '@/lib/hoyLiteDay';
import { getLocalDateString } from '@/lib/dateLocal';

// Lazy loading para componentes pesados que no se usan inmediatamente
const TaskEditModal = lazy(() => 
  import('@/components/tasks/TaskEditModal').then(module => ({ default: module.TaskEditModal }))
    .catch(() => ({ default: () => null as any }))
);
const ConfettiCelebration = lazy(() => 
  import('@/components/ConfettiCelebration').then(module => ({ default: module.ConfettiCelebration }))
    .catch(() => ({ default: () => null as any }))
);
const QuickRecheckInModal = lazy(() =>
  import('@/components/QuickRecheckInModal').then((module) => ({ default: module.QuickRecheckInModal }))
    .catch(() => ({ default: () => null as any })),
);
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
  }, [tasks, loading, previousCompletedCount, showConfetti, showToast]);

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

  type TaskSection = { id: string; title: string; color: string; isCategory: true; categoryKey: string; tasks: Task[] };
  const taskSections = useMemo(() => {
    const byCategory = new Map<string, Task[]>();
    const normalizeCategory = (cat: string | undefined | null): string => {
      return normalizeCategoryKey(cat || 'otros') ?? 'otros';
    };
    displayedIncompleteTasks.forEach((t) => {
      const key = normalizeCategory(t.category);
      const list = byCategory.get(key) ?? [];
      list.push(t);
      byCategory.set(key, list);
    });
    const sortByPriority = (a: Task, b: Task) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0);
    const sections: TaskSection[] = [];
    CATEGORY_ORDER_KEYS.forEach((key) => {
      const taskList = byCategory.get(key) ?? [];
      if (taskList.length === 0) return;
      const label = categoryLabel(locale, key);
      const color = getCategoryColor(key);
      sections.push({
        id: `cat-${key}`,
        title: label,
        color,
        isCategory: true,
        categoryKey: key,
        tasks: [...taskList].sort(sortByPriority),
      });
    });
    return sections;
  }, [displayedIncompleteTasks, getCategoryColor, locale]);

  useEffect(() => {
    // Vista lite simplifica módulos secundarios, no oculta las tareas del día.
    setExpandedSections(null);
  }, [hoyLiteLayout]);

  // Agrupar tareas pendientes por proyecto para la sección de resumen en Hoy
  const projectSectionsForToday = useMemo(() => {
    const byProject = new Map<string, number>();
    let looseCount = 0;
    displayedIncompleteTasks.forEach((t) => {
      const pid = t.project_id ?? null;
      if (pid) {
        byProject.set(pid, (byProject.get(pid) ?? 0) + 1);
      } else {
        looseCount += 1;
      }
    });
    const list: { id: string; name: string; color: string; count: number }[] = [];
    Object.entries(projectsMap).forEach(([id, { name, color }]) => {
      const count = byProject.get(id) ?? 0;
      list.push({ id, name, color: color ?? THEME.colors.gradient.blue, count });
    });
    list.sort((a, b) => b.count - a.count);
    return { projectRows: list, looseCount };
  }, [displayedIncompleteTasks, projectsMap]);

  const looseTasksList = useMemo(
    () => displayedIncompleteTasks.filter((t) => !t.project_id),
    [displayedIncompleteTasks]
  );

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

        {/* Hero: bienvenida compacta + contexto del día */}
        {!loading && (
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>{getGreeting} ✨</Text>
              <View style={styles.welcomeHeaderRight}>
                {user &&
                  (currentStreak > 0 ? (
                    <View style={styles.streakHeaderCluster}>
                      <TouchableOpacity
                        style={styles.streakBadgeInline}
                        onPress={() => router.push('/(tabs)/yo')}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={t('hoyPlanFallback.streakA11y', { count: currentStreak })}
                        accessibilityHint={t('hoyExtra.profileHint')}
                      >
                        <Flame size={14} color={THEME.colors.gradient.pink} />
                        <Text style={styles.streakTextInline}>{currentStreak}</Text>
                        <Text style={styles.streakDaysLabel}>{t('hoy.streakDays')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.streakBadgeMuted}
                      onPress={() => router.push('/(tabs)/sentir')}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={t('hoyExtra.noStreakA11y')}
                      accessibilityHint={t('hoyExtra.noStreakHint')}
                    >
                      <Flame size={14} color={THEME.colors.text.tertiary} />
                      <Text style={styles.streakTextMuted}>{t('hoy.streakLabel')}</Text>
                      <Text style={styles.streakTextMutedBold}>0</Text>
                    </TouchableOpacity>
                  ))}
                {user ? (
                  <>
                    <TouchableOpacity
                      onPress={() => router.push('/help')}
                      style={styles.settingsHeaderBtn}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={t('hoyExtra.helpA11y')}
                      accessibilityHint={t('hoyExtra.helpHint')}
                    >
                      <CircleHelp size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push('/settings')}
                      style={styles.settingsHeaderBtn}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={t('hoyExtra.settingsA11y')}
                      accessibilityHint={t('hoyExtra.settingsHint')}
                    >
                      <Settings size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
            {user && (
              <Text style={styles.streakHint} accessibilityRole="text">
                {t('hoy.streakHint')}
              </Text>
            )}
          </View>
        )}

        {/* Contexto del día: una línea (estado de ánimo + energía) o CTA a Sentir */}
        {!loading && todayMood && (
          <>
            <TouchableOpacity
              style={styles.contextPillWrap}
              onPress={() => router.push('/(tabs)/sentir')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoyExtra.feelBannerA11y')}
              accessibilityHint={t('hoyExtra.feelBannerHint')}
            >
              <View style={[styles.contextPill, { backgroundColor: getEmotionColor(todayMood) }]}>
                <Text style={styles.contextPillEmoji}>{getEmotionEmoji(todayMood)}</Text>
                <Text style={styles.contextPillText}>
                  {t('hoy.feelingLine', {
                    emotion: todayEmotionLabel,
                    energy: String(energyLevel),
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dayFlowCard}>
              <Text style={styles.dayFlowTitle}>{t('hoyDayFlow.dayChangedTitle')}</Text>
              <Text style={styles.dayFlowBody}>{t('hoyDayFlow.dayChangedBody')}</Text>
              <TouchableOpacity
                style={styles.dayFlowPrimaryBtn}
                onPress={openQuickRecheck}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('hoyDayFlow.dayChangedCta')}
              >
                <RefreshCw size={18} color={THEME.colors.gradient.blue} />
                <Text style={styles.dayFlowPrimaryBtnText}>{t('hoyDayFlow.dayChangedCta')}</Text>
              </TouchableOpacity>
            </View>

            {showNothingDoneCard ? (
              <View style={[styles.dayFlowCard, styles.dayFlowCardMuted]}>
                <Text style={styles.dayFlowTitle}>{t('hoyDayFlow.nothingDoneTitle')}</Text>
                <Text style={styles.dayFlowBody}>{t('hoyDayFlow.nothingDoneBody')}</Text>
                <View style={styles.dayFlowActions}>
                  <TouchableOpacity
                    style={styles.dayFlowPrimaryBtn}
                    onPress={openQuickRecheck}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('hoyDayFlow.nothingDoneReorganize')}
                  >
                    <Text style={styles.dayFlowPrimaryBtnText}>{t('hoyDayFlow.nothingDoneReorganize')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dayFlowSecondaryBtn}
                    onPress={() => setShowRedistribute(true)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('hoyDayFlow.nothingDoneLighten')}
                  >
                    <Text style={styles.dayFlowSecondaryBtnText}>{t('hoyDayFlow.nothingDoneLighten')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </>
        )}
        {/* Una sola tarjeta: cómo funciona Koraa (reemplaza CTA Sentir + guía colapsable) */}
        {!loading && showSecondaryModulesEffective && (
          <TouchableOpacity
            style={styles.howKoraaCard}
            onPress={() => router.push('/(tabs)/sentir')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('hoyExtra.howWorksA11y')}
            accessibilityHint={t('hoyExtra.howWorksHint')}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue + '12', THEME.colors.gradient.pink + '08']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.howKoraaCardGradient}
            >
              <Text style={styles.howKoraaCardTitle}>{t('hoy.howItWorksTitle')}</Text>
              <Text style={styles.howKoraaCardBody}>{t('hoy.howItWorksBody')}</Text>
              <View style={styles.howKoraaCardFlow}>
                <View style={styles.howKoraaCardStep}>
                  <View style={[styles.howKoraaCardStepDot, styles.howKoraaCardStepDotActive]}>
                    <PenTool size={12} color={THEME.colors.onGradient} />
                  </View>
                  <Text style={styles.howKoraaCardStepLabel}>{t('tabs.tasks')}</Text>
                </View>
                <View style={styles.howKoraaCardArrow}>
                  <ArrowRight size={14} color={THEME.colors.text.tertiary} />
                </View>
                <View style={styles.howKoraaCardStep}>
                  <View style={styles.howKoraaCardStepDot}>
                    <Heart size={12} color={THEME.colors.gradient.blue} />
                  </View>
                  <Text style={styles.howKoraaCardStepLabel}>{t('tabs.feel')}</Text>
                </View>
                <View style={styles.howKoraaCardArrow}>
                  <ArrowRight size={14} color={THEME.colors.text.tertiary} />
                </View>
                <View style={styles.howKoraaCardStep}>
                  <View style={styles.howKoraaCardStepDot}>
                    <Target size={12} color={THEME.colors.text.secondary} />
                  </View>
                  <Text style={styles.howKoraaCardStepLabel}>{t('tabs.today')}</Text>
                </View>
              </View>
              <View style={styles.howKoraaCardCta}>
                <Text style={styles.howKoraaCardCtaText}>
                  {todayMood ? t('hoy.updateFeel') : t('hoy.goToFeel')}
                </Text>
                <ChevronRight size={18} color={THEME.colors.gradient.blue} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {hoyLiteLayout && (
          <View style={styles.hoyLiteBanner}>
            <Text style={styles.hoyLiteBannerText}>{t('hoy.hoyLiteBanner')}</Text>
            <TouchableOpacity
              onPress={() => void handleOptOutHoyLite()}
              style={styles.hoyLiteBannerBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('hoyExtra.showAllA11y')}
              accessibilityHint={t('hoyExtra.showAllHint')}
            >
              <Text style={styles.hoyLiteBannerBtnText}>{t('hoy.showAllNow')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CTA principal: agregar tareas */}
        {!loading && (
          <TouchableOpacity
            style={styles.addTasksPill}
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('hoyExtra.goTasksA11y')}
            accessibilityHint={t('hoyExtra.goTasksHint')}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addTasksPillGradient}
            >
              <Plus size={20} color={THEME.colors.onGradient} />
              <Text style={styles.addTasksPillTitle}>{t('hoy.addTasks')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!loading && !hoyLiteActive && (
          <>
            <TouchableOpacity
              style={styles.secondaryModulesToggle}
              onPress={() => setShowSecondaryModules((prev) => !prev)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={showSecondaryModules ? t('hoyExtra.toggleExtraA11yHide') : t('hoyExtra.toggleExtraA11yShow')}
              accessibilityHint={t('hoyExtra.toggleExtraHint')}
              accessibilityState={{ expanded: showSecondaryModules }}
            >
              <Text style={styles.secondaryModulesToggleText}>
                {showSecondaryModules ? t('hoy.hideExtra') : t('hoy.showExtra')}
              </Text>
              {showSecondaryModules ? (
                <ChevronDown size={18} color={THEME.colors.text.secondary} />
              ) : (
                <ChevronRight size={18} color={THEME.colors.text.secondary} />
              )}
            </TouchableOpacity>
            <Text style={styles.secondaryModulesHint}>{t('hoy.secondaryModulesHint')}</Text>
          </>
        )}

        {/* Una sola card de meditación: Mañana y Noche dentro del mismo bloque */}
        {!loading && showSecondaryModulesEffective && (
          <View style={styles.meditationWrap}>
            <LinearGradient
              colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.tint.pink.soft, THEME.colors.fill[200]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.meditationCard}
            >
              <View style={styles.meditationHeader}>
                <Text style={styles.meditationTitle}>
                  {t('hoy.calmMoment')}{' '}
                  <Text style={styles.meditationTitleAccent}>{t('hoy.calmMomentAccent')}</Text>
                </Text>
                <Text style={styles.meditationSubtitle}>{t('commonExtra.meditationListen')}</Text>
              </View>
              <View style={styles.meditationSingleCardInner}>
                <TouchableOpacity
                  style={[styles.meditationRow, morningMeditationDone && styles.meditationRowDone]}
                  onPress={() => !morningMeditationDone && handleStartMeditation('morning')}
                  activeOpacity={0.8}
                  disabled={morningMeditationDone}
                  accessibilityRole="button"
                  accessibilityLabel={morningMeditationDone ? t('hoy.meditationMorningDoneA11y') : t('hoy.meditationMorningA11y')}
                  accessibilityHint={t('hoy.meditationMorningHint')}
                  accessibilityState={{ disabled: morningMeditationDone }}
                >
                  <View style={[styles.meditationRowIconWrap, !morningMeditationDone && styles.meditationRowIconMorning]}>
                    <Text style={styles.meditationRowEmoji}>🧘</Text>
                    {morningMeditationDone && (
                      <View style={styles.meditationCheckBadge}>
                        <Text style={styles.meditationCheckText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.meditationRowTextWrap}>
                    <Text style={[styles.meditationRowLabel, morningMeditationDone && styles.meditationRowLabelDone]}>
                      {morningMeditationDone ? t('hoy.morningDone') : t('hoy.morning')}
                    </Text>
                    {!morningMeditationDone && (
                      <Text style={styles.meditationRowHint}>{t('hoy.morningHint')}</Text>
                    )}
                  </View>
                  {!morningMeditationDone && <ChevronRight size={20} color={THEME.colors.text.tertiary} />}
                </TouchableOpacity>
                <View style={styles.meditationDivider} />
                <TouchableOpacity
                  style={[styles.meditationRow, eveningMeditationDone && styles.meditationRowDone]}
                  onPress={() => !eveningMeditationDone && handleStartMeditation('evening')}
                  activeOpacity={0.8}
                  disabled={eveningMeditationDone}
                  accessibilityRole="button"
                  accessibilityLabel={eveningMeditationDone ? t('hoy.meditationEveningDoneA11y') : t('hoy.meditationEveningA11y')}
                  accessibilityHint={t('hoy.meditationEveningHint')}
                  accessibilityState={{ disabled: eveningMeditationDone }}
                >
                  <View style={[styles.meditationRowIconWrap, !eveningMeditationDone && styles.meditationRowIconEvening]}>
                    <Text style={styles.meditationRowEmoji}>🌙</Text>
                    {eveningMeditationDone && (
                      <View style={styles.meditationCheckBadge}>
                        <Text style={styles.meditationCheckText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.meditationRowTextWrap}>
                    <Text style={[styles.meditationRowLabel, eveningMeditationDone && styles.meditationRowLabelDone]}>
                      {eveningMeditationDone ? t('hoy.eveningDone') : t('hoy.evening')}
                    </Text>
                    {!eveningMeditationDone && (
                      <Text style={styles.meditationRowHint}>{t('commonExtra.eveningHintPeace')}</Text>
                    )}
                  </View>
                  {!eveningMeditationDone && <ChevronRight size={20} color={THEME.colors.text.tertiary} />}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Bloque Hoy: # Tareas por categoría (Trabajo, Salud, Hogar, etc.) */}
        {!loading && (
          <View style={styles.tasksContainer}>
            <View style={styles.tasksListCard}>
              {todayMood && (
                <View style={[styles.heroTodayWrap, styles.heroTodayWrapFirst]}>
                  <LinearGradient
                    colors={[getEmotionColor(todayMood).replace('0.15', '0.22'), THEME.colors.fill[100]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.heroTodayCard}
                  >
                    <Text style={styles.heroTodayHeadline}>{t('hoy.fitsToday')}</Text>
                    <Text style={styles.heroTodaySubtitle}>
                      {focusSummaryLine ?? t('hoy.organizeByYou')}
                    </Text>
                    <View style={styles.heroTodayStateRow}>
                      <View style={[styles.heroTodayPill, { backgroundColor: getEmotionColor(todayMood) }]}>
                        <Text style={styles.heroTodayPillEmoji}>{getEmotionEmoji(todayMood)}</Text>
                        <Text style={styles.heroTodayPillText}>
                          {t('commonExtra.feelingPill', {
                            emotion: todayEmotionLabel,
                          })}
                        </Text>
                      </View>
                      <View style={styles.heroTodayPillNeutral}>
                        <Text style={styles.heroTodayPillNeutralText}>
                          {t('commonExtra.energyPill', { n: energyLevel })}
                        </Text>
                      </View>
                      {time ? (
                        <View style={styles.heroTodayPillNeutral}>
                          <Text style={styles.heroTodayPillNeutralText} numberOfLines={1}>
                            {time}
                          </Text>
                        </View>
                      ) : null}
                      {focusLevel ? (
                        <View style={styles.heroTodayPillNeutral}>
                          <Text style={styles.heroTodayPillNeutralText} numberOfLines={1}>
                            {focusLevel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </LinearGradient>
                  {!hoyLiteLayout && (
                    <TouchableOpacity
                      style={[styles.prioritiesContext, styles.prioritiesContextUnderHero]}
                      onPress={() => setHeroDetailsExpanded((e) => !e)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        heroDetailsExpanded
                          ? t('hoyExtra.orderHide')
                          : t('hoyExtra.orderShow')
                      }
                    >
                      <View style={styles.prioritiesContextHeaderRow}>
                        <Text style={styles.heroDetailsToggleTitle} numberOfLines={1}>
                          {t('commonExtra.moreAboutTodayOrder')}
                        </Text>
                        {heroDetailsExpanded ? (
                          <ChevronDown size={16} color={THEME.colors.text.secondary} />
                        ) : (
                          <ChevronRight size={16} color={THEME.colors.text.secondary} />
                        )}
                      </View>
                      {heroDetailsExpanded && (
                        <View style={styles.heroDetailsExpandedBody}>
                          {explanation.reasoning ? (
                            <>
                              <Text style={styles.heroDetailsSectionLabel}>{t('hoy.perCheckIn')}</Text>
                              <Text style={styles.prioritiesContextText}>{explanation.reasoning}</Text>
                              {explanation.suggestion ? (
                                <View style={styles.prioritiesSuggestionBox}>
                                  <Lightbulb size={18} color={THEME.colors.gradient.blue} />
                                  <Text style={styles.prioritiesSuggestion}>{explanation.suggestion}</Text>
                                </View>
                              ) : null}
                            </>
                          ) : null}
                          <Text style={styles.heroDetailsSectionLabel}>{t('hoy.howPrioritizes')}</Text>
                          <View style={styles.prioritizeHowList}>
                            {getPrioritizationExplainerBullets(locale).map((line, i) => (
                              <Text key={i} style={styles.prioritizeHowBullet}>
                                • {line}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  {emotionalClosure && !hoyLiteLayout && showSecondaryModulesEffective && (
                    <Animated.View
                      style={[
                        styles.emotionalCardAnimatedWrap,
                        {
                          opacity: emotionalCardsAnim,
                          transform: [
                            {
                              translateY: emotionalCardsAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.fill[100]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emotionalClosureCard}
                      >
                        <View style={styles.emotionalSignalBadgeRow}>
                          <View style={styles.emotionalSignalBadge}>
                            <Text style={styles.emotionalSignalBadgeText}>{t('hoy.emotionalLoop')}</Text>
                          </View>
                          <View style={styles.emotionalSignalDot} />
                        </View>
                        <View style={styles.emotionalClosureHeader}>
                          <Target size={16} color={THEME.colors.gradient.blue} />
                          <Text style={styles.emotionalClosureTitle}>{emotionalClosure.title}</Text>
                        </View>
                        <Text style={styles.emotionalClosureMessage}>{emotionalClosure.message}</Text>
                        <View style={styles.emotionalSignalTipRow}>
                          <ArrowRight size={14} color={THEME.colors.gradient.blue} />
                          <Text style={styles.emotionalClosureNote}>{emotionalClosure.note}</Text>
                        </View>
                        <Text style={styles.emotionalToneLine}>{emotionalToneLine}</Text>
                      </LinearGradient>
                    </Animated.View>
                  )}
                </View>
              )}
              {!todayMood && displayedIncompleteTasks.length > 0 && (
                <TouchableOpacity
                  style={styles.checkInPromptBanner}
                  onPress={() => router.push('/(tabs)/sentir')}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={t('hoyExtra.goFeelPrioritize')}
                  accessibilityHint={t('hoyExtra.goFeelPrioritizeHint')}
                >
                  <LinearGradient
                    colors={[THEME.colors.tint.pink.soft, THEME.colors.tint.blue.veryFaint]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkInPromptBannerGradient}
                  >
                    <Heart size={22} color={THEME.colors.gradient.blue} />
                    <View style={styles.checkInPromptBannerTextWrap}>
                      <Text style={styles.checkInPromptBannerTitle}>{t('hoy.howFeelToday')}</Text>
                      <Text style={styles.checkInPromptBannerSub}>{t('commonExtra.checkInPromptSub')}</Text>
                    </View>
                    <ChevronRight size={22} color={THEME.colors.gradient.blue} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {selectedEmotionalMemoryInsight && !hoyLiteLayout && showSecondaryModulesEffective && (
                <Animated.View
                  style={[
                    styles.emotionalCardAnimatedWrap,
                    {
                      opacity: emotionalCardsAnim,
                      transform: [
                        {
                          translateY: emotionalCardsAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[THEME.colors.tint.pink.soft, THEME.colors.fill[100]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emotionalMemoryCard}
                  >
                    <View style={styles.emotionalSignalBadgeRow}>
                      <View style={[styles.emotionalSignalBadge, styles.emotionalMemoryBadge]}>
                        <Text style={styles.emotionalSignalBadgeText}>{t('commonExtra.weeklyMemory')}</Text>
                      </View>
                      <View style={styles.emotionalSignalDot} />
                    </View>
                    <View style={styles.emotionalMemoryHeader}>
                      <Heart size={16} color={THEME.colors.gradient.pink} />
                      <Text style={styles.emotionalMemoryTitle}>{selectedEmotionalMemoryInsight.title}</Text>
                    </View>
                    <Text style={styles.emotionalMemoryMessage}>{selectedEmotionalMemoryInsight.message}</Text>
                    <View style={styles.emotionalSignalTipRow}>
                      <ArrowRight size={14} color={THEME.colors.gradient.pink} />
                      <Text style={styles.emotionalMemoryTip}>{selectedEmotionalMemoryInsight.tip}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
              <View style={styles.tareasHeaderSection}>
              <Text style={styles.tareasTitle} numberOfLines={1}>
                {t('commonExtra.tasksSection')}
              </Text>
              {/* Fecha + filtros en una fila; el estado va debajo a todo el ancho (evita columna estrecha al lado de los pills). */}
              <View style={styles.tareasHeaderMetaRow}>
                <Text style={styles.tareasDate}>
                  {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                {!hoyLiteLayout && (
                  <View style={styles.taskFilterWrap}>
                    <TouchableOpacity
                      style={[styles.taskFilterPill, taskFilter === 'hoy' && styles.taskFilterPillActive]}
                      onPress={() => setTaskFilter('hoy')}
                      activeOpacity={0.8}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: taskFilter === 'hoy' }}
                      accessibilityLabel={t('hoyExtra.filterTodayA11y')}
                      accessibilityHint={t('hoyExtra.filterTodayHint')}
                    >
                      {taskFilter === 'hoy' && (
                        <LinearGradient
                          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Text style={[styles.taskFilterLabel, taskFilter === 'hoy' && styles.taskFilterLabelActive]}>
                        {t('hoy.filterToday')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taskFilterPill, taskFilter === 'todas' && styles.taskFilterPillActive]}
                      onPress={() => setTaskFilter('todas')}
                      activeOpacity={0.8}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: taskFilter === 'todas' }}
                      accessibilityLabel={t('hoyExtra.filterAllA11y')}
                      accessibilityHint={t('hoyExtra.filterAllHint')}
                    >
                      {taskFilter === 'todas' && (
                        <LinearGradient
                          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Text style={[styles.taskFilterLabel, taskFilter === 'todas' && styles.taskFilterLabelActive]}>
                        {t('hoy.filterAll')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.tareasSubtitle}>
                {displayedIncompleteTasks.length === 0
                  ? taskFilter === 'hoy'
                    ? t('hoy.noTasksToday')
                    : t('hoy.noTasksPending')
                  : taskFilter === 'hoy'
                    ? t(
                        displayedIncompleteTasks.length === 1
                          ? 'hoy.taskCountToday'
                          : 'hoy.taskCountTodayPlural',
                        { count: displayedIncompleteTasks.length },
                      )
                    : t(
                        displayedIncompleteTasks.length === 1
                          ? 'hoy.taskCountPending'
                          : 'hoy.taskCountPendingPlural',
                        { count: displayedIncompleteTasks.length },
                      )}
              </Text>
              {taskFilter === 'hoy' && !hoyLiteLayout && (
                <Text style={styles.taskFilterHint}>{t('hoy.filterHint')}</Text>
              )}
              {displayedIncompleteTasks.length > 0 && (
                <Text style={styles.taskCompactHint} accessibilityRole="text">
                  {t('hoy.sortHint')}
                </Text>
              )}
              {incompleteTasks.length >= 1 && user && todayMood && showSecondaryModulesEffective && (
                <TouchableOpacity
                  style={styles.redistributeCta}
                  onPress={() => setShowRedistribute(true)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('hoyExtra.redistributeA11y')}
                  accessibilityHint={t('hoyExtra.redistributeHint')}
                >
                  <CalendarRange size={20} color={THEME.colors.gradient.blue} />
                  <View style={styles.redistributeCtaTextWrap}>
                    <Text style={styles.redistributeCtaTitle}>{t('hoy.lightenLoad')}</Text>
                    <Text style={styles.redistributeCtaSub} numberOfLines={2}>
                      {t('hoy.lightenLoadSub')}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={THEME.colors.text.tertiary} />
                </TouchableOpacity>
              )}
              </View>

              {/* Resumen por tipo de tarea: proyectos y tareas sin proyecto (debajo del encabezado para evitar hueco) */}
              {showSecondaryModulesEffective && (projectSectionsForToday.projectRows.length > 0) && (
                <View style={styles.byProjectSection}>
                  <View style={styles.byProjectHeader}>
                    <View style={styles.byProjectHeaderLeft}>
                      <View style={styles.byProjectHeaderIconWrap}>
                        <FolderKanban size={20} color={THEME.colors.gradient.blue} />
                      </View>
                      <Text style={styles.byProjectTitle} numberOfLines={1}>
                        {t('hoyExtra.tasksSummaryTitle')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.byProjectVerTodosHeader}
                      onPress={() => router.push('/proyectos')}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={t('hoyExtra.allProjectsA11y')}
                      accessibilityHint={t('hoyExtra.allProjectsHint')}
                    >
                      <Text style={styles.byProjectVerTodosText}>{t('hoy.viewAll')}</Text>
                      <ChevronRight size={18} color={THEME.colors.gradient.blue} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.byProjectList}>
                    {projectSectionsForToday.projectRows.map((row) => (
                      <TouchableOpacity
                        key={row.id}
                        style={styles.byProjectRow}
                        onPress={() => router.push(`/project/${row.id}` as const)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={t('hoyPlanFallback.projectRowA11y', { name: row.name, count: row.count })}
                        accessibilityHint={t('hoyExtra.openProjectHint')}
                      >
                        <View style={[styles.byProjectColorBar, { backgroundColor: row.color }]} />
                        <View style={styles.byProjectRowContent}>
                          <Text style={styles.byProjectRowName} numberOfLines={1}>{row.name}</Text>
                          <Text style={styles.byProjectRowCount}>
                            {row.count === 0 ? t('hoyExtra.noPending') : row.count === 1 ? t('hoyExtra.pendingOne', { count: row.count }) : t('hoyExtra.pendingMany', { count: row.count })}
                          </Text>
                        </View>
                        <ChevronRight size={20} color={THEME.colors.text.tertiary} />
                      </TouchableOpacity>
                    ))}
                    {projectSectionsForToday.looseCount > 0 && (
                      <>
                        <TouchableOpacity
                          style={styles.byProjectRowLoose}
                          onPress={() => setLooseTasksExpanded((e) => !e)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={looseTasksExpanded ? t('hoyExtra.collapseLoose') : t('hoyExtra.expandLoose', { count: projectSectionsForToday.looseCount })}
                          accessibilityState={{ expanded: looseTasksExpanded }}
                        >
                          <View style={[styles.byProjectColorBar, { backgroundColor: THEME.colors.text.tertiary }]} />
                          <View style={styles.byProjectRowContent}>
                            <Text style={styles.byProjectRowName}>{t('hoy.looseTasks')}</Text>
                            <Text style={styles.byProjectRowCount}>
                              {t(
                                projectSectionsForToday.looseCount === 1
                                  ? 'sectionHeader.taskOne'
                                  : 'sectionHeader.taskMany',
                                { count: projectSectionsForToday.looseCount },
                              )}
                            </Text>
                          </View>
                          {looseTasksExpanded ? (
                            <ChevronDown size={20} color={THEME.colors.text.tertiary} />
                          ) : (
                            <ChevronRight size={20} color={THEME.colors.text.tertiary} />
                          )}
                        </TouchableOpacity>
                        {looseTasksExpanded && looseTasksList.length > 0 && (
                          <View style={styles.byProjectLooseList}>
                            <TaskList
                              tasks={tasks}
                              incompleteTasks={looseTasksList}
                              expandedTasks={expandedTasks}
                              expandedDetailsTasks={expandedDetailsTasks}
                              menuOpen={menuOpen}
                              onToggleTask={handleToggleTask}
                              onToggleExpansion={toggleTaskExpansion}
                              onToggleDetailsExpansion={toggleDetailsExpansion}
                              onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
                              onEditTask={handleEditTask}
                              onDeleteTask={handleDeleteTask}
                              getCategoryColor={getCategoryColor}
                              onSubtaskToggle={(subtaskId, parentTaskId) => toggleTask(subtaskId, true, parentTaskId)}
                              getProjectInfo={() => ({ label: t('hoyExtra.looseLabel'), color: THEME.colors.text.secondary })}
                              getProjectSteps={(_projectId, _excludeTaskId) => []}
                              expandedProjectSteps={expandedProjectStepsTasks}
                              onToggleProjectSteps={(taskId) => {
                                setExpandedProjectStepsTasks((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(taskId)) next.delete(taskId);
                                  else next.add(taskId);
                                  return next;
                                });
                              }}
                              onPressProject={() => {}}
                              hideProjectLabel={true}
                              sectionAccentColor={THEME.colors.text.secondary}
                              sectionCategory="otros"
                              uniformCard
                              getTaskPriorityInsight={getTaskPriorityInsightForList}
                            />
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              )}
              {displayedIncompleteTasks.length > 0 ? (
                taskSections.map((sec) => {
                  const isSectionExpanded = expandedSections === null || expandedSections.has(sec.id);
                  const toggleSection = () => {
                    setExpandedSections((prev) => {
                      const expanded = prev === null || prev.has(sec.id);
                      if (expanded) {
                        if (prev === null) {
                          return new Set<string>(taskSections.map((s) => s.id).filter((id) => id !== sec.id));
                        }
                        const next = new Set<string>(prev);
                        next.delete(sec.id);
                        return next;
                      }
                      const next = prev === null ? new Set<string>() : new Set<string>(prev);
                      next.add(sec.id);
                      return next;
                    });
                  };
                  return (
                    <View key={sec.id} style={styles.areaCard}>
                      <TouchableOpacity
                        style={[styles.categoryLabelStrip, { borderLeftColor: sec.color }]}
                        onPress={toggleSection}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={isSectionExpanded ? t('hoyPlanFallback.collapseSection', { title: sec.title }) : t('hoyPlanFallback.expandSection', { count: sec.tasks.length, title: sec.title })}
                        accessibilityState={{ expanded: isSectionExpanded }}
                      >
                        <Text style={styles.categoryLabelName}>{sec.title}</Text>
                        <View style={styles.categoryLabelRight}>
                          <Text style={styles.categoryLabelCount}>
                            {t(
                              sec.tasks.length === 1 ? 'sectionHeader.taskOne' : 'sectionHeader.taskMany',
                              { count: sec.tasks.length },
                            )}
                          </Text>
                          {isSectionExpanded ? (
                            <ChevronDown size={20} color={sec.color} style={styles.categoryLabelChevron} />
                          ) : (
                            <ChevronRight size={20} color={sec.color} style={styles.categoryLabelChevron} />
                          )}
                        </View>
                      </TouchableOpacity>
                      {isSectionExpanded && (
                        <View style={styles.areaCardInner}>
                          <TaskList
                            tasks={tasks}
                            incompleteTasks={sec.tasks}
                            expandedTasks={expandedTasks}
                            expandedDetailsTasks={expandedDetailsTasks}
                            menuOpen={menuOpen}
                            onToggleTask={handleToggleTask}
                            onToggleExpansion={toggleTaskExpansion}
                            onToggleDetailsExpansion={toggleDetailsExpansion}
                            onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            getCategoryColor={getCategoryColor}
                            onSubtaskToggle={(subtaskId, parentTaskId) => toggleTask(subtaskId, true, parentTaskId)}
                            getProjectInfo={(task) => {
                              const projectId = task.parent_task_id
                                ? (incompleteTasks.find((t) => t.id === task.parent_task_id) ?? tasks.find((t) => t.id === task.parent_task_id))?.project_id ?? task.project_id
                                : task.project_id;
                              if (task.parent_task_id && projectId) {
                                const p = projectsMap[projectId];
                                const name = p?.name ?? t('hoyExtra.projectFallback');
                                return {
                                  label: t('hoyExtra.partOf', { name }),
                                  color: p?.color ?? THEME.colors.gradient.blue,
                                  projectId,
                                  projectName: name,
                                };
                              }
                              if (task.project_id) {
                                const p = projectsMap[task.project_id];
                                const name = p?.name ?? t('hoyExtra.projectFallback');
                                return {
                                  label: t('hoyExtra.projectColon', { name }), color: p?.color ?? THEME.colors.gradient.blue, projectId: task.project_id, projectName: name };
                              }
                              return { label: t('hoyExtra.looseLabel'), color: THEME.colors.text.secondary };
                            }}
                            getProjectSteps={(projectId, excludeTaskId) =>
                              displayedIncompleteTasks.filter(
                                (t) => t.project_id === projectId && t.id !== excludeTaskId
                              )
                            }
                            expandedProjectSteps={expandedProjectStepsTasks}
                            onToggleProjectSteps={(taskId) => {
                              setExpandedProjectStepsTasks((prev) => {
                                const next = new Set(prev);
                                if (next.has(taskId)) next.delete(taskId);
                                else next.add(taskId);
                                return next;
                              });
                            }}
                            onPressProject={(projectId) => router.push(`/project/${projectId}` as const)}
                            hideProjectLabel={false}
                            sectionAccentColor={sec.color}
                            sectionCategory={sec.categoryKey}
                            uniformCard
                            getTaskPriorityInsight={getTaskPriorityInsightForList}
                          />
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyTasksInCard}>
                  <ClipboardList size={40} color={THEME.colors.gradient.blue} style={styles.emptyTasksIcon} />
                  {incompleteTasks.length === 0 && tasks.length > 0 ? (
                    <>
                      <Text style={styles.emptyTasksTitle}>{t('hoy.allDone')}</Text>
                      <Text style={styles.emptyTasksInCardText}>{t('hoy.allDoneSub')}</Text>
                    </>
                  ) : taskFilter === 'hoy' &&
                    incompleteTasks.length > 0 &&
                    incompleteTasksForToday.length === 0 ? (
                    <>
                      <Text style={styles.emptyTasksTitle}>{t('hoy.noTasksToday')}</Text>
                      <Text style={styles.emptyTasksInCardText}>{t('hoy.noTasksOtherDays')}</Text>
                      <View style={styles.emptyTasksActions}>
                        <TouchableOpacity
                          style={styles.emptyTasksLinkPill}
                          onPress={() => setTaskFilter('todas')}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={t('hoyExtra.filterAllA11y')}
                        >
                          <Text style={styles.emptyTasksLinkPillText}>{t('commonExtra.viewAllTasks')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.emptyTasksLinkPill, styles.emptyTasksLinkPillSecond]}
                          onPress={() =>
                            router.push(
                              `/(tabs)/vaciar?date=${getLocalDateString()}`,
                            )
                          }
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={t('hoyExtra.addTodayA11y')}
                          accessibilityHint={t('hoyExtra.addTodayHint')}
                        >
                          <Text style={styles.emptyTasksLinkPillText}>{t('commonExtra.addForToday')}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyTasksTitle}>{t('hoy.listStarts')}</Text>
                      <Text style={styles.emptyTasksInCardText}>{t('hoy.listStartsSub')}</Text>
                    </>
                  )}
                  <View style={styles.emptyTasksCta}>
                    <GradientButton
                      title={t('hoy.goToTasks')}
                      onPress={() => router.push('/(tabs)/vaciar')}
                    />
                    {incompleteTasks.length === 0 && tasks.length > 0 ? (
                      <TouchableOpacity
                        style={styles.emptyTasksSecondaryCta}
                        onPress={() => router.push('/(tabs)/sentir')}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={t('hoyExtra.goFeelA11y')}
                        accessibilityHint={t('hoyExtra.goFeelHint')}
                      >
                        <Text style={styles.emptyTasksSecondaryCtaText}>{t('commonExtra.goToFeelShort')}</Text>
                        <ChevronRight size={18} color={THEME.colors.gradient.blue} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}

              {displayedIncompleteTasks.length > 0 && (
                <TouchableOpacity
                  style={styles.agregarMasWrap}
                  onPress={() => router.push('/(tabs)/vaciar')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('hoyExtra.addMoreA11y')}
                  accessibilityHint={t('hoyExtra.addMoreHint')}
                >
                  <Plus size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.agregarMasHint}>{t('commonExtra.addMoreTasksHint')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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

      {/* Overlay para cerrar menú al hacer clic fuera */}
      {menuOpen && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(null)}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.closeMenuA11y')}
          accessibilityHint={t('hoyExtra.closeMenuHint')}
        />
      )}

      {/* Modal de edición - Lazy loaded */}
      {editingTask !== null && (
        <Suspense fallback={<ViewRN style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: THEME.colors.overlay, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={THEME.colors.gradient.blue} /></ViewRN>}>
          <TaskEditModal
            visible={editingTask !== null}
            content={editContent}
            onContentChange={setEditContent}
            onSave={handleSaveEdit}
            onClose={() => {
              setEditingTask(null);
              setEditContent('');
            }}
          />
        </Suspense>
      )}
      
      {/* Confetti celebración - Lazy loaded */}
      {showConfetti && (
        <Suspense fallback={null}>
          <ConfettiCelebration />
        </Suspense>
      )}
      
      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage(null)}
        />
      )}
      
      {user && (
        <RedistributeWorkloadModal
          visible={showRedistribute}
          onClose={() => setShowRedistribute(false)}
          userId={user.id}
          tasks={tasks}
          energyLevel={energyLevel}
          availableTime={time || 'Medio (2-4hrs)'}
          emotion={todayMood || 'tranquila'}
          onApplied={() => {
            void loadTasks();
            showToast(t('hoyExtra.datesUpdated'), 'success');
          }}
        />
      )}

      {/* Onboarding rápido y visualmente atractivo */}
      <QuickOnboardingModal
        visible={showQuickOnboarding}
        onClose={() => setShowQuickOnboarding(false)}
      />
      
      {/* Modal de check-in rápido - Lazy loaded */}
      {showQuickRecheck && (
        <Suspense fallback={null}>
          <QuickRecheckInModal
            visible={showQuickRecheck}
            initialEmotion={todayMood || ''}
            initialEnergy={energyLevel || 0}
            onClose={() => setShowQuickRecheck(false)}
            onComplete={() => {
              void loadTodayCheckIn();
              void loadTasks();
            }}
          />
        </Suspense>
      )}

      {/* Modal de meditación: usamos versión simple en todos los entornos para evitar crashes nativos */}
      {showMeditation && (
        <MeditationCircleSimple
          visible={showMeditation}
          onComplete={handleMeditationComplete}
          onClose={() => setShowMeditation(false)}
          type={meditationType}
        />
      )}
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
  moodCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  moodLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
  },
  moodTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodStats: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    flexWrap: 'wrap',
  },
  moodStatItem: {
    backgroundColor: THEME.colors.surfaceOverlay.light,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minWidth: 100,
  },
  moodStatLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.fill[100],
    opacity: 0.85,
    marginBottom: 2,
  },
  moodStatValue: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 13,
  },
  section: {
    marginBottom: THEME.spacing.md,
  },
  valueCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  valueTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  valueLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  valueNumber: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueNumberHighlight: {
    ...THEME.typography.h3,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueMessage: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    fontStyle: 'italic',
  },
  engagementCard: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  sectionSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  accentText: {
    fontFamily: THEME.fonts.accent.italic,
  },
  explanationCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  explanationText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
    marginBottom: THEME.spacing.xs,
  },
  explanationSuggestion: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
  },
  explanationReasoning: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginTop: THEME.spacing.xs,
    fontStyle: 'italic',
  },
  quickCheckInButton: {
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.surfaceOverlay.strong,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.border,
  },
  quickCheckInButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.medium,
  },
  progressIndicator: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  progressLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  progressCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: 4,
  },
  welcomeSection: {
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  contextPillWrap: {
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs + 2,
    borderRadius: THEME.borderRadius.pill,
    maxWidth: '100%',
  },
  contextPillEmoji: {
    fontSize: 16,
  },
  contextPillText: {
    fontSize: 14,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  dayFlowCard: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  dayFlowCardMuted: {
    borderColor: THEME.colors.fill[200],
    backgroundColor: THEME.colors.fill[200],
  },
  dayFlowTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  dayFlowBody: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  dayFlowActions: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  dayFlowPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: THEME.colors.gradient.blue,
    paddingHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.xs,
  },
  dayFlowPrimaryBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  dayFlowSecondaryBtn: {
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  dayFlowSecondaryBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    textDecorationLine: 'underline',
  },
  howKoraaCard: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  howKoraaCardGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm + 4,
    paddingHorizontal: THEME.spacing.md,
  },
  howKoraaCardTitle: {
    ...THEME.typography.body,
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 4,
    textAlign: 'center',
  },
  howKoraaCardBody: {
    ...THEME.typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: 0,
  },
  howKoraaCardFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: THEME.spacing.sm,
  },
  howKoraaCardStep: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  howKoraaCardStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  howKoraaCardStepDotActive: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  howKoraaCardStepLabel: {
    ...THEME.typography.caption,
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  howKoraaCardArrow: {
    marginHorizontal: 2,
  },
  howKoraaCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  howKoraaCardCtaText: {
    fontSize: 15,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
    letterSpacing: 0.2,
  },
  hoyLiteBanner: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  hoyLiteBannerText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.sm,
  },
  hoyLiteBannerBtn: {
    alignSelf: 'flex-start',
    paddingVertical: THEME.spacing.xs,
  },
  hoyLiteBannerBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  addTasksPill: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  addTasksPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm + 4,
    paddingHorizontal: THEME.spacing.xl,
    minHeight: 48,
  },
  addTasksPillTitle: {
    fontSize: 17,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  secondaryModulesToggle: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: -THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryModulesToggleText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  secondaryModulesHint: {
    ...THEME.typography.meta,
    marginHorizontal: THEME.spacing.lg,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    color: THEME.colors.text.secondary,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  welcomeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  streakHeaderCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsHeaderBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    ...THEME.typography.h1,
    fontSize: 28,
    lineHeight: 34,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  streakBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  streakTextInline: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  streakDaysLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginLeft: 2,
  },
  streakBadgeMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  streakTextMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 12,
  },
  streakTextMutedBold: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  streakHint: {
    ...THEME.typography.small,
    color: THEME.colors.accent.purple,
    lineHeight: 18,
    marginTop: 2,
    maxWidth: '100%',
    opacity: 0.92,
  },
  prioritiesCardWrap: {
    marginBottom: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded + 4,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  prioritiesCard: {
    borderRadius: THEME.borderRadius.rounded + 4,
    padding: THEME.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.soft,
  },
  prioritiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  prioritiesHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  prioritiesTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
    fontSize: 16,
  },
  prioritiesSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 13,
  },
  vaciarButton: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    flexShrink: 0,
    ...THEME.shadows.soft,
  },
  vaciarButtonGradient: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  vaciarButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 15,
  },
  prioritiesContext: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.fill[200],
  },
  prioritiesContextUnderHero: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
  },
  prioritiesContextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  heroDetailsToggleTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    letterSpacing: 0.2,
  },
  heroDetailsExpandedBody: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  heroDetailsSectionLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.tertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  prioritiesContextText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 2,
  },
  prioritiesSuggestionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.gradient.blue + '0C',
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  prioritiesSuggestion: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  prioritizeHowList: {
    marginTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
  },
  prioritizeHowBullet: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  redistributeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.tint.blue.veryLight,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  redistributeCtaTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  redistributeCtaTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    fontSize: 15,
  },
  redistributeCtaSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  agregarTareasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    marginTop: THEME.spacing.md,
  },
  agregarTareasButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...THEME.shadows.soft,
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.xl,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  modalButtonCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalButtonConfirm: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  modalButtonConfirmText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    alignSelf: 'center',
  },
  addTaskButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  checkInPrompt: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
  },
  checkInPromptText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
    textAlign: 'center',
  },
  checkInPromptAccent: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
  },
  tasksContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.sm,
  },
  addTasksCard: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.card,
  },
  addTasksCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
    minHeight: 56,
  },
  addTasksCardTextWrap: {
    flex: 1,
  },
  addTasksCardTitle: {
    ...THEME.typography.h3,
    fontSize: 18,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 2,
  },
  addTasksCardHint: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.onGradientMuted,
  },
  emptyTasksInCard: {
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.sm,
    alignItems: 'center',
  },
  emptyTasksIcon: {
    marginBottom: THEME.spacing.sm,
  },
  emptyTasksTitle: {
    ...THEME.typography.h3,
    fontSize: 18,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
  emptyTasksInCardText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyTasksActions: {
    marginTop: THEME.spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  emptyTasksLinkPill: {
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  emptyTasksLinkPillText: {
    ...THEME.typography.small,
    fontSize: 14,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  emptyTasksCta: {
    marginTop: THEME.spacing.md,
    width: '100%',
    maxWidth: 280,
    gap: THEME.spacing.sm,
    alignItems: 'center',
  },
  emptyTasksSecondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
  },
  emptyTasksSecondaryCtaText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  emptyTasksLinkPillSecond: {
    marginTop: THEME.spacing.sm,
  },
  checkInPromptBanner: {
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  checkInPromptBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  checkInPromptBannerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  checkInPromptBannerTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 4,
  },
  checkInPromptBannerSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  tasksListCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.card,
  },
  tareasHeaderSection: {
    marginBottom: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  tareasHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  tareasTitle: {
    ...THEME.typography.h2,
    fontSize: 24,
    lineHeight: 30,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  tareasDate: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flexShrink: 0,
  },
  tareasSubtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    width: '100%',
  },
  taskFilterWrap: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    flexShrink: 0,
    alignItems: 'center',
  },
  taskFilterPill: {
    paddingVertical: 8,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  taskFilterPillActive: {
    backgroundColor: 'transparent',
  },
  taskFilterLabel: {
    ...THEME.typography.body,
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    zIndex: 1,
  },
  taskFilterLabelActive: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  taskFilterHint: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.tertiary,
    marginTop: 4,
    marginBottom: 0,
    width: '100%',
  },
  taskCompactHint: {
    ...THEME.typography.meta,
    lineHeight: 16,
    color: THEME.colors.text.tertiary,
    marginTop: 6,
    width: '100%',
  },
  heroTodayWrap: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  heroTodayWrapFirst: {
    marginTop: 0,
  },
  heroTodayCard: {
    borderRadius: THEME.borderRadius.standard,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  heroTodayHeadline: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  heroTodaySubtitle: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    lineHeight: 18,
  },
  heroTodayStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  heroTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
  },
  heroTodayPillEmoji: {
    fontSize: 15,
  },
  heroTodayPillText: {
    fontSize: 12,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  heroTodayPillNeutral: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
  },
  heroTodayPillNeutralText: {
    fontSize: 12,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  emotionalClosureCard: {
    marginTop: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    overflow: 'hidden',
  },
  emotionalCardAnimatedWrap: {
    marginTop: THEME.spacing.xs,
  },
  emotionalSignalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emotionalSignalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
  },
  emotionalMemoryBadge: {
    backgroundColor: THEME.colors.tint.pink.soft,
  },
  emotionalSignalBadgeText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  emotionalSignalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.gradient.blue,
    opacity: 0.65,
  },
  emotionalClosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  emotionalClosureTitle: {
    fontSize: 12,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    letterSpacing: 0.2,
  },
  emotionalClosureMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
    lineHeight: 21,
  },
  emotionalSignalTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  emotionalClosureNote: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    flex: 1,
  },
  emotionalToneLine: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  emotionalMemoryCard: {
    marginBottom: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    overflow: 'hidden',
  },
  emotionalMemoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  emotionalMemoryTitle: {
    fontSize: 12,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    letterSpacing: 0.2,
  },
  emotionalMemoryMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
    lineHeight: 21,
  },
  emotionalMemoryTip: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    flex: 1,
  },
  categoryLegendWrap: {
    marginBottom: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLegendBar: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  categoryLegendText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    letterSpacing: 0.2,
  },
  taskSection: {
    marginBottom: THEME.spacing.lg,
  },
  areaCard: {
    marginBottom: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  categoryLabelStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderLeftWidth: 4,
    backgroundColor: THEME.colors.fill[200],
  },
  categoryLabelName: {
    fontSize: 18,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    letterSpacing: 0.2,
  },
  categoryLabelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  categoryLabelCount: {
    ...THEME.typography.caption,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  categoryLabelChevron: {
    flexShrink: 0,
  },
  areaCardInner: {
    paddingTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
    paddingLeft: 0,
    paddingRight: 0,
  },
  taskBlock: {
    marginBottom: THEME.spacing.lg,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  taskBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  taskBlockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskBlockTitle: {
    flex: 1,
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    fontSize: 14,
  },
  taskBlockCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 12,
  },
  taskBlockContent: {
    paddingTop: THEME.spacing.xs,
  },
  addFromInicioCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    alignItems: 'center',
    ...THEME.shadows.soft,
  },
  addFromInicioTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    textAlign: 'center',
  },
  addFromInicioSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
  },
  addFromInicioButton: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    alignSelf: 'stretch',
    minHeight: THEME.sizes.touchTarget,
    ...THEME.shadows.soft,
  },
  addFromInicioButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.lg,
  },
  addFromInicioButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  agregarMasWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  agregarMasHint: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  byProjectSection: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
  byProjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  byProjectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  byProjectVerTodosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingVertical: THEME.spacing.xs,
  },
  byProjectHeaderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
  },
  byProjectTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flexShrink: 1,
  },
  byProjectList: {
    gap: THEME.spacing.xs,
  },
  byProjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    paddingVertical: THEME.spacing.sm,
    paddingRight: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  byProjectRowLoose: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    paddingVertical: THEME.spacing.sm,
    paddingRight: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  byProjectLooseList: {
    marginBottom: THEME.spacing.sm,
    paddingLeft: THEME.spacing.xs,
  },
  byProjectColorBar: {
    width: 4,
    height: '100%',
    minHeight: 36,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    marginRight: THEME.spacing.sm,
  },
  byProjectRowContent: {
    flex: 1,
    minWidth: 0,
  },
  byProjectRowName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  byProjectRowCount: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  byProjectVerTodosText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
    marginRight: 4,
  },
  projectSection: {
    marginBottom: THEME.spacing.xl,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  projectSectionHeader: {
    marginBottom: THEME.spacing.md,
  },
  projectSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  projectSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.tint.blue.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectSectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
  },
  projectSectionSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  projectSectionContent: {
    marginTop: THEME.spacing.xs,
  },
  standaloneSection: {
    marginTop: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.stroke[100],
  },
  standaloneSectionHeader: {
    marginBottom: THEME.spacing.md,
  },
  standaloneSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  standaloneSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  standaloneSectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
  },
  standaloneSectionSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  standaloneSectionContent: {
    marginTop: THEME.spacing.xs,
  },
  emptyState: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
  },
  emptyButton: {
    backgroundColor: THEME.colors.gradient.blue,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    ...THEME.shadows.soft,
  },
  emptyButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  taskWrapper: {
    position: 'relative',
    marginBottom: THEME.spacing.sm,
  },
  taskCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  priorityNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    padding: THEME.spacing.xs,
  },
  taskCheckboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.colors.gradient.blue,
  },
  taskContent: {
    flex: 1,
  },
  taskTypeContainer: {
    marginBottom: THEME.spacing.xs,
  },
  taskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    gap: 4,
  },
  projectBadge: {
    backgroundColor: THEME.colors.tint.blue.light,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  taskBadge: {
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  subtaskBadge: {
    backgroundColor: THEME.colors.semantic.dangerSoft,
    borderWidth: 1,
    borderColor: THEME.colors.semantic.dangerBorder,
  },
  taskTypeIcon: {
    fontSize: 12,
  },
  taskTypeText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
  },
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
  },
  taskCardWithSubtasks: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  expandButton: {
    padding: THEME.spacing.sm,
    marginRight: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtasksContainer: {
    marginLeft: THEME.spacing.lg,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
    paddingLeft: THEME.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.stroke[100],
  },
  subtaskCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
    marginLeft: THEME.spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.tint.pink.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  subtaskCardCompleted: {
    opacity: 0.6,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckboxChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.gradient.blue,
  },
  subtaskContent: {
    flex: 1,
  },
  subtaskTypeContainer: {
    marginBottom: THEME.spacing.xs,
  },
  subtaskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  subtasksProgressContainer: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  subtasksProgressBar: {
    height: 4,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  subtasksProgressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: 2,
  },
  subtasksProgressText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  menuButton: {
    padding: THEME.spacing.sm,
    marginLeft: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  vaciarConfirmCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  vaciarConfirmTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
  },
  vaciarConfirmMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.lg,
  },
  vaciarConfirmActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    justifyContent: 'flex-end',
  },
  vaciarConfirmCancel: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  vaciarConfirmCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  vaciarConfirmOk: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  vaciarConfirmOkText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: 50,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.xs,
    minWidth: 150,
    ...THEME.shadows.soft,
    zIndex: 1000,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
  },
  menuItemDanger: {
    marginTop: THEME.spacing.xs,
  },
  menuItemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
  },
  menuItemTextDanger: {
    color: THEME.colors.gradient.pink,
  },
  modalButtonSaveText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  checkInBanner: {
    marginBottom: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  checkInBannerGradient: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  checkInBannerText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.medium,
  },
  checkInBannerSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    opacity: 0.9,
  },
  summaryCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  summaryValue: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: THEME.colors.stroke[100],
    marginHorizontal: THEME.spacing.sm,
  },
  completionState: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
  },
  completionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  completionEmoji: {
    fontSize: 40,
  },
  completionTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  completionMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.md,
  },
  completionAccent: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.gradient.pink,
    fontSize: 18,
  },
  flowGuide: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
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
  flowGuideCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
    marginHorizontal: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  flowGuideCardTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    fontFamily: THEME.fonts.heading.bold,
  },
  flowArrowText: {
    ...THEME.typography.h2,
    color: THEME.colors.text.secondary,
    fontSize: 20,
  },
  mainRegisterButton: {
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  mainRegisterButtonGradient: {
    padding: THEME.spacing.xl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainRegisterIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  mainRegisterText: {
    ...THEME.typography.h1,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  mainRegisterSubtext: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
  },
  emptyStateCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  emptyStateTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyStateEmotion: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.gradient.blue,
    marginBottom: THEME.spacing.sm,
  },
  emptyStateMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    lineHeight: 22,
  },
  secondaryButton: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    marginHorizontal: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  secondaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  secondaryButtonContent: {
    flex: 1,
  },
  secondaryButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
  },
  updateCheckInButton: {
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    alignSelf: 'center',
  },
  updateCheckInButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.medium,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: THEME.colors.tint.pink.soft,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    gap: 4,
    marginBottom: THEME.spacing.md,
  },
  streakText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
  },
  meditationSection: {
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  meditationSectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  meditationButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    height: 130,
  },
  meditationButton: {
    flex: 1,
    maxHeight: 130,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  meditationButtonDone: {
    opacity: 0.6,
  },
  meditationButtonGradient: {
    width: '100%',
    height: '100%',
    padding: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
  },
  meditationEmoji: {
    fontSize: 32,
    marginBottom: THEME.spacing.xs,
  },
  meditationButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  meditationButtonTextDone: {
    color: THEME.colors.text.tertiary,
  },
  checkmark: {
    position: 'absolute',
    top: THEME.spacing.xs,
    right: THEME.spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.semantic.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: THEME.colors.fill[100],
    fontSize: 16,
    fontWeight: 'bold',
  },
  meditationWrap: {
    marginTop: 0,
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded + 4,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  meditationCard: {
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    borderRadius: THEME.borderRadius.rounded + 4,
  },
  meditationHeader: {
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xs,
  },
  meditationTitle: {
    ...THEME.typography.h3,
    fontSize: 20,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.2,
  },
  meditationTitleAccent: {
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.gradient.pink,
    fontStyle: 'italic',
  },
  meditationSubtitle: {
    ...THEME.typography.caption,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  meditationSingleCardInner: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  meditationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  meditationRowDone: {
    opacity: 0.78,
  },
  meditationRowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  meditationRowIconMorning: {
    backgroundColor: THEME.colors.tint.pink.soft,
  },
  meditationRowIconEvening: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  meditationRowEmoji: {
    fontSize: 24,
  },
  meditationRowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  meditationRowLabel: {
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  meditationRowLabelDone: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  meditationRowHint: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  meditationDivider: {
    height: 1,
    backgroundColor: THEME.colors.stroke[100],
    marginLeft: THEME.spacing.md + 44 + THEME.spacing.sm,
  },
  meditationCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME.colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meditationCheckText: {
    ...THEME.typography.meta,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  recommendationsWrap: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
    paddingTop: 0,
  },
});
