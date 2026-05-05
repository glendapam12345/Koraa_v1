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
import { generatePrioritizationExplanation, getPrioritizationExplainerBullets } from '@/lib/smartPrioritization';
import { getEmotionEmoji } from '@/lib/emotionalInsights';
import { logger } from '@/lib/logger';
import { Plus, Flame, PenTool, Heart, Target, ArrowRight, Lightbulb, ChevronDown, ChevronRight, FolderKanban, ClipboardList, CalendarRange, Settings, CircleHelp } from 'lucide-react-native';
import { GradientButton } from '@/components/GradientButton';
import { router, useFocusEffect } from 'expo-router';
import type { Task } from '@/components/tasks/TaskCard';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickOnboardingModal } from '@/components/onboarding/QuickOnboardingModal';
import { RedistributeWorkloadModal } from '@/components/tasks/RedistributeWorkloadModal';
import { MeditationCircleSimple } from '@/components/MeditationCircleSimple';
import { resolveHoyLiteLayout, optOutHoyLiteLayout } from '@/lib/hoyLiteDay';

// Lazy loading para componentes pesados que no se usan inmediatamente
const TaskEditModal = lazy(() => 
  import('@/components/tasks/TaskEditModal').then(module => ({ default: module.TaskEditModal }))
    .catch(() => ({ default: () => null as any }))
);
const ConfettiCelebration = lazy(() => 
  import('@/components/ConfettiCelebration').then(module => ({ default: module.ConfettiCelebration }))
    .catch(() => ({ default: () => null as any }))
);
const QuickCheckInModal = lazy(() => 
  import('@/components/QuickCheckInModal').then(module => ({ default: module.QuickCheckInModal }))
    .catch(() => ({ default: () => null as any }))
);
const NoPendingTasksCelebration = lazy(() => 
  import('@/components/NoPendingTasksCelebration').then(module => ({ default: module.NoPendingTasksCelebration }))
    .catch(() => ({ default: () => null as any }))
);

const CATEGORY_ORDER = ['Hogar', 'Trabajo', 'Personal', 'Salud', 'Contenido', 'Marca', 'Otros'];

function getLocalDateString(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedDetailsTasks, setExpandedDetailsTasks] = useState<Set<string>>(new Set());
  /** Secciones de categoría expandidas (null = todas expandidas) */
  const [expandedSections, setExpandedSections] = useState<Set<string> | null>(new Set<string>());
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
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
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
  /** “Modo foco” colapsa categorías de tareas para mostrar menos de golpe. */
  const [focusMode, setFocusMode] = useState<boolean>(true);
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
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  useEffect(() => {
    if (hoyLiteLayout) {
      setTaskFilter('hoy');
      setFocusMode(true);
    }
  }, [hoyLiteLayout]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const [secondaryRaw, focusRaw] = await Promise.all([
          AsyncStorage.getItem(`hoy_secondary_modules_${user.id}_v1`),
          AsyncStorage.getItem(`hoy_focus_mode_${user.id}_v1`),
        ]);
        if (cancelled) return;
        setShowSecondaryModules(secondaryRaw === '1');
        setFocusMode(focusRaw !== '0'); // por defecto: activo
      } catch {
        // no-op: se mantienen valores por defecto
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Cuando sales de “Hoy lite”, restauramos preferencias desde AsyncStorage
  // (en lite forzamos modo foco, pero no queremos sobrescribir la preferencia real).
  useEffect(() => {
    if (!user?.id) return;
    if (hoyLiteLayout) return;
    let cancelled = false;
    void (async () => {
      try {
        const [secondaryRaw, focusRaw] = await Promise.all([
          AsyncStorage.getItem(`hoy_secondary_modules_${user.id}_v1`),
          AsyncStorage.getItem(`hoy_focus_mode_${user.id}_v1`),
        ]);
        if (cancelled) return;
        setShowSecondaryModules(secondaryRaw === '1');
        setFocusMode(focusRaw !== '0');
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, hoyLiteLayout]);

  useEffect(() => {
    // En “hoyLiteLayout” ignoramos persistencia para no pelear con la vista simplificada.
    if (!user?.id) return;
    if (hoyLiteLayout) return;
    void AsyncStorage.setItem(
      `hoy_secondary_modules_${user.id}_v1`,
      showSecondaryModules ? '1' : '0',
    );
  }, [user?.id, showSecondaryModules, hoyLiteLayout]);

  useEffect(() => {
    if (!user?.id) return;
    if (hoyLiteLayout) return;
    void AsyncStorage.setItem(`hoy_focus_mode_${user.id}_v1`, focusMode ? '1' : '0');
  }, [user?.id, focusMode, hoyLiteLayout]);

  const handleOptOutHoyLite = useCallback(async () => {
    if (!user?.id) return;
    await optOutHoyLiteLayout(user.id);
    setHoyLiteLayout(false);
    showToast('Verás todas las secciones en Hoy', 'info');
  }, [user?.id, showToast]);

  const {
    todayMood,
    energyLevel,
    time,
    focusLevel,
    loading,
    loadTodayCheckIn,
  } = useCheckIn(showToast);

  const {
    tasks,
    loadTasks,
    setTasks,
  } = useTasks(todayMood, showToast);

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

  // En "Hoy" solo mostramos tareas sin fecha o programadas para hoy
  const incompleteTasksForToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
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
  const showSecondaryModulesEffective = showSecondaryModules && !focusMode && !hoyLiteActive;

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

      const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
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
          title: 'Memoria emocional',
          message: `En las ultimas semanas, los ${dayNames[lowestDay]} sueles llegar con menos energia.`,
          tip: `Ese dia deja tareas ligeras y protege recuperacion${topEmotion ? ` cuando te notes ${topEmotion}` : ''}.`,
        });
      }

      if (highestDay !== -1 && highestAvg >= 4) {
        insights.push({
          title: 'Memoria emocional',
          message: `Tu mejor ventana suele ser los ${dayNames[highestDay]}: ahi te notas con mas energia.`,
          tip: 'Reserva ese dia para enfoque profundo y mueve lo operativo a bloques mas suaves.',
        });
      }

      if (insights.length === 0) {
        insights.push({
          title: 'Memoria emocional',
          message: 'Tu energia ha estado variable estas semanas, sin un patron rigido por dia.',
          tip: 'Revisa Sentir al inicio del dia y ajusta tu carga en tiempo real.',
        });
      }

      if (topEmotion && !insights.some((i) => i.message.includes(topEmotion))) {
        insights.push({
          title: 'Memoria emocional',
          message: `Tu estado mas repetido recientemente fue ${topEmotion}.`,
          tip: 'Cuando aparezca ese estado, reduce friccion y enfocate en una sola tarea clave.',
        });
      }

      setEmotionalMemoryInsights(insights.slice(0, 3));
    } catch (error) {
      logger.debug('Error cargando memoria emocional:', error);
      setEmotionalMemoryInsights([]);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeCheckInCelebration((p) => {
      void loadStreak();
      void loadTodayCheckIn();
      void loadEmotionalMemory();
      if (p.milestone) {
        setShowConfetti(true);
        showToast(`¡${p.streak} días de racha! ✨`, 'success');
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
        showToast('Listo: prioridades actualizadas según tu check-in ✨', 'success');
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
            'Meditación no disponible',
            'Esta función todavía no está activa en este entorno.',
            [{ text: 'Entendido' }],
          );
          return;
        }
        showToast('No se pudo guardar la meditación. Inténtalo de nuevo.', 'error');
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
      showToast('¡Meditación completada! 🧘', 'success');

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
      showToast('Ocurrió un error', 'error');
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

      const today = new Date().toISOString().split('T')[0];
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
      showToast('Hoy está completo. Descansa y disfruta del momento presente ✨', 'success');
      
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
    const key = category.toLowerCase();
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
      'Eliminar tarea',
      `¿Estás seguro de que quieres eliminar "${task.content}"?${task.subtasks && task.subtasks.length > 0 ? `\n\nSe eliminarán también ${task.subtasks.length} subtareas.` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setMenuOpen(null) },
        {
          text: 'Eliminar',
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
                  showToast('No se pudieron eliminar los pasos. Inténtalo de nuevo.', 'error');
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
                showToast('No se pudo eliminar la tarea. Inténtalo de nuevo.', 'error');
                setMenuOpen(null);
                return;
              }

              // Actualización optimista: quitar tarea y sus subtareas de la lista
              setTasks((prevTasks: Task[]) =>
                prevTasks.filter((t: Task) => t.id !== task.id && t.parent_task_id !== task.id)
              );
              setMenuOpen(null);
              showToast('Tarea eliminada correctamente', 'success');
              loadTasks();
            } catch (error) {
              logger.error('Error inesperado al eliminar:', error);
              showToast('No se pudo eliminar la tarea. Inténtalo de nuevo.', 'error');
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
        title: 'Tu plan de hoy',
        message: 'Sigue estos pasos para organizar tu día:',
        suggestion: '1. Tareas → 2. Sentir → 3. Hoy',
        reasoning: 'Primero agrega tus tareas en la pestaña Tareas, luego registra cómo te sientes en Sentir para que Koraa priorice automáticamente aquí en Hoy.',
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
            focusLevel: focusLevel || 'Normal',
          },
          tasks
        );
        
        return {
          title: 'Tu plan de hoy',
          message: explanation.message,
          suggestion: explanation.suggestion,
          reasoning: explanation.reasoning,
        };
      } catch (error) {
        logger.debug('Error generando explicación inteligente:', error);
      }
    }

    // Fallback simplificado: solo si falta algún dato del check-in
    const emotionLabel = todayMood.charAt(0).toUpperCase() + todayMood.slice(1);
    const priorityCount = incompleteTasks.length;
    const negativeEmotions = ['agotada', 'ansiosa', 'abrumada'];
    const isNegativeEmotion = negativeEmotions.includes(todayMood.toLowerCase());

    let message = '';
    let reasoning = '';
    let suggestion = '';
    
    if (energyLevel <= 2 || isNegativeEmotion) {
      message = `Te sugerimos enfocarte en ${priorityCount} ${priorityCount === 1 ? 'tarea esencial' : 'tareas esenciales'} hoy.`;
      reasoning = `Con energía ${energyLevel}/5 y sintiéndote ${emotionLabel}, tu cuerpo y mente necesitan menos presión.`;
      suggestion = 'Menos es más cuando tu energía está baja. Enfócate en lo esencial.';
    } else if (energyLevel === 3) {
      message = `Te sugerimos enfocarte en ${priorityCount} ${priorityCount === 1 ? 'tarea prioritaria' : 'tareas prioritarias'} hoy.`;
      reasoning = `Con energía moderada y sintiéndote ${emotionLabel}, puedes manejar estas tareas sin sobrecargarte.`;
      suggestion = 'Tienes energía moderada. Prioriza lo importante.';
    } else if (energyLevel >= 4) {
      message = `Te sugerimos enfocarte en ${priorityCount} ${priorityCount === 1 ? 'tarea' : 'tareas'} hoy.`;
      reasoning = `¡Tienes energía alta y te sientes ${emotionLabel}! Aprovecha este momento.`;
      suggestion = '¡Tienes energía para más! Aprovecha este momento.';
    }

    return {
      title: 'Tu plan de hoy',
      message,
      suggestion,
      reasoning,
    };
  }, [todayMood, energyLevel, incompleteTasks, time, focusLevel, tasks]);

  const explanation = useMemo(
    () => getPriorityExplanation(),
    [getPriorityExplanation]
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
        title: 'Cierre emocional de hoy',
        message: 'Hoy escuchaste cómo te sentías. Ese ya es un avance real.',
        note: 'Cuando quieras, agrega una tarea pequeña para seguir el ritmo sin presión.',
      };
    }

    if (completionRatio >= 0.8) {
      return {
        title: 'Cierre emocional de hoy',
        message: `Hiciste suficiente para hoy: cerraste ${completedCount} de ${totalCount} tareas.`,
        note: 'Puedes soltar con tranquilidad y retomar mañana con claridad.',
      };
    }

    if (lowEnergyContext) {
      return {
        title: 'Cierre emocional de hoy',
        message:
          completedCount > 0
            ? `Tuviste poca energía y aun así avanzaste ${completedCount} tarea${completedCount === 1 ? '' : 's'}. Eso cuenta.`
            : 'Hoy no avanzaste tareas, y tiene sentido por cómo te sentías.',
        note: pendingCount > 0 ? `Quedan ${pendingCount} pendientes; podemos repartirlos sin sobrecargarte.` : 'Mañana puedes retomar desde una tarea liviana.',
      };
    }

    if (completionRatio >= 0.4) {
      return {
        title: 'Cierre emocional de hoy',
        message: `Hoy avanzaste ${completedCount} de ${totalCount}. Es progreso, no perfección.`,
        note: pendingCount > 0 ? `Te quedan ${pendingCount} tareas; priorizar una mañana será suficiente.` : 'Tu lista quedó limpia hoy. Buen cierre.',
      };
    }

    return {
      title: 'Cierre emocional de hoy',
      message:
        completedCount > 0
          ? `Hoy hiciste ${completedCount} tarea${completedCount === 1 ? '' : 's'}. Parece poco, pero suma.`
          : 'Hoy no se completaron tareas y también es válido cuando el día se complica.',
      note: 'Si quieres, mañana arrancamos con la tarea más corta para ganar inercia.',
    };
  }, [todayMood, energyLevel, tasks]);

  const emotionalToneLine = useMemo(() => {
    if (!todayMood) return 'Tu forma de avanzar no tiene que parecerse a la de nadie mas.';
    const mood = todayMood.toLowerCase();
    if (['agotada', 'ansiosa', 'abrumada'].includes(mood)) {
      return 'Hoy tocaba sostenerte primero. La productividad tambien puede ser compasiva.';
    }
    if (['motivada', 'enfocada'].includes(mood)) {
      return 'Canaliza este impulso con intencion: menos dispersion, mas impacto.';
    }
    return 'Ritmo sereno, avance real: asi se construye consistencia durable.';
  }, [todayMood]);

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
      const key = (cat && cat.trim() !== '' ? cat.trim() : 'Otros').toLowerCase();
      const known = CATEGORY_ORDER.map((c) => c.toLowerCase()).includes(key);
      return known ? key : 'otros';
    };
    displayedIncompleteTasks.forEach((t) => {
      const key = normalizeCategory(t.category);
      const list = byCategory.get(key) ?? [];
      list.push(t);
      byCategory.set(key, list);
    });
    const sortByPriority = (a: Task, b: Task) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0);
    const sections: TaskSection[] = [];
    CATEGORY_ORDER.forEach((label) => {
      const key = label.toLowerCase();
      const taskList = byCategory.get(key) ?? [];
      if (taskList.length === 0) return;
      const color = getCategoryColor(label);
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
  }, [displayedIncompleteTasks, getCategoryColor]);

  useEffect(() => {
    if (hoyLiteLayout) {
      setExpandedSections(new Set<string>());
      return;
    }
    if (!focusMode) {
      setExpandedSections(null);
      return;
    }
    if (taskSections.length === 0) {
      setExpandedSections(new Set<string>());
      return;
    }
    // En modo foco dejamos visible solo la categoría más prioritaria.
    setExpandedSections(new Set<string>([taskSections[0].id]));
  }, [focusMode, hoyLiteLayout, taskSections]);

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
      showToast('Error al actualizar los datos', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Función para obtener saludo basado en la hora del día
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

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
            <Text style={styles.loadingText}>Preparando tu día...</Text>
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
                        accessibilityLabel={`Racha de ${currentStreak} días. Ver en Yo`}
                        accessibilityHint="Abre tu perfil para ver tu progreso y racha"
                      >
                        <Flame size={14} color={THEME.colors.gradient.pink} />
                        <Text style={styles.streakTextInline}>{currentStreak}</Text>
                        <Text style={styles.streakDaysLabel}>días</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.streakBadgeMuted}
                      onPress={() => router.push('/(tabs)/sentir')}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel="Sin racha aún. Ir a Sentir para tu check-in"
                      accessibilityHint="Abre Sentir para registrar cómo te sientes hoy"
                    >
                      <Flame size={14} color={THEME.colors.text.tertiary} />
                      <Text style={styles.streakTextMuted}>Racha</Text>
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
                      accessibilityLabel="Ayuda y preguntas frecuentes"
                      accessibilityHint="Abre la pantalla de ayuda con preguntas sobre Sentir, Tareas y Hoy"
                    >
                      <CircleHelp size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push('/settings')}
                      style={styles.settingsHeaderBtn}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel="Ajustes de cuenta"
                      accessibilityHint="Abre ajustes de cuenta y preferencias"
                    >
                      <Settings size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
            {user && (
              <Text style={styles.streakHint} accessibilityRole="text">
                La racha cuenta los días seguidos con check-in en Sentir. La meditación no suma a la racha.
              </Text>
            )}
          </View>
        )}

        {/* Contexto del día: una línea (estado de ánimo + energía) o CTA a Sentir */}
        {!loading && todayMood && (
          <TouchableOpacity
            style={styles.contextPillWrap}
            onPress={() => router.push('/(tabs)/sentir')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Ver y actualizar cómo te sientes hoy"
            accessibilityHint="Abre Sentir para editar tu check-in del día"
          >
            <View style={[styles.contextPill, { backgroundColor: getEmotionColor(todayMood) }]}>
              <Text style={styles.contextPillEmoji}>{getEmotionEmoji(todayMood)}</Text>
              <Text style={styles.contextPillText}>
                Sintiéndote {todayMood.charAt(0).toUpperCase() + todayMood.slice(1)} · Energía {energyLevel}/5
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {/* Una sola tarjeta: cómo funciona Koraa (reemplaza CTA Sentir + guía colapsable) */}
        {!loading && (
          <TouchableOpacity
            style={styles.howKoraaCard}
            onPress={() => router.push('/(tabs)/sentir')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Cómo funciona Koraa. Ir a Sentir para indicar cómo te sientes."
            accessibilityHint="Abre Sentir, el segundo paso del flujo recomendado"
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue + '12', THEME.colors.gradient.pink + '08']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.howKoraaCardGradient}
            >
              <Text style={styles.howKoraaCardTitle}>Cómo funciona Koraa</Text>
              <Text style={styles.howKoraaCardBody}>
                Agrega tus tareas en Tareas, indica cómo te sientes en Sentir, y aquí verás solo lo que te conviene hoy.
              </Text>
              <View style={styles.howKoraaCardFlow}>
                <View style={styles.howKoraaCardStep}>
                  <View style={[styles.howKoraaCardStepDot, styles.howKoraaCardStepDotActive]}>
                    <PenTool size={12} color={THEME.colors.onGradient} />
                  </View>
                  <Text style={styles.howKoraaCardStepLabel}>Tareas</Text>
                </View>
                <View style={styles.howKoraaCardArrow}>
                  <ArrowRight size={14} color={THEME.colors.text.tertiary} />
                </View>
                <View style={styles.howKoraaCardStep}>
                  <View style={styles.howKoraaCardStepDot}>
                    <Heart size={12} color={THEME.colors.gradient.blue} />
                  </View>
                  <Text style={styles.howKoraaCardStepLabel}>Sentir</Text>
                </View>
                <View style={styles.howKoraaCardArrow}>
                  <ArrowRight size={14} color={THEME.colors.text.tertiary} />
                </View>
                <View style={styles.howKoraaCardStep}>
                  <View style={styles.howKoraaCardStepDot}>
                    <Target size={12} color={THEME.colors.text.secondary} />
                  </View>
                  <Text style={styles.howKoraaCardStepLabel}>Hoy</Text>
                </View>
              </View>
              <View style={styles.howKoraaCardCta}>
                <Text style={styles.howKoraaCardCtaText}>
                  {todayMood ? 'Actualizar en Sentir' : 'Ir a Sentir'}
                </Text>
                <ChevronRight size={18} color={THEME.colors.gradient.blue} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {hoyLiteLayout && (
          <View style={styles.hoyLiteBanner}>
            <Text style={styles.hoyLiteBannerText}>
              Vista simplificada tu primer día en Hoy: mañana verás filtros, proyectos, meditación y más.
            </Text>
            <TouchableOpacity
              onPress={() => void handleOptOutHoyLite()}
              style={styles.hoyLiteBannerBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Mostrar todas las secciones de Hoy ahora"
              accessibilityHint="Desactiva la vista simplificada y muestra todo en Hoy"
            >
              <Text style={styles.hoyLiteBannerBtnText}>Mostrar todo ahora</Text>
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
            accessibilityLabel="Ir a la pestaña Tareas para agregar tareas"
            accessibilityHint="Abre Tareas para capturar nuevas pendientes"
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addTasksPillGradient}
            >
              <Plus size={20} color={THEME.colors.onGradient} />
              <Text style={styles.addTasksPillTitle}>Agregar tareas</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!loading && !hoyLiteLayout && (
          <TouchableOpacity
            style={styles.focusModeToggle}
            onPress={() => setFocusMode((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={focusMode ? 'Desactivar modo foco en Hoy' : 'Activar modo foco en Hoy'}
            accessibilityHint="Muestra una sola categoría prioritaria y oculta secciones extra para reducir distracciones"
            accessibilityState={{ expanded: focusMode }}
          >
            <View style={styles.focusModeToggleTextWrap}>
              <Text style={styles.focusModeToggleText}>
                {focusMode ? 'Modo foco activo' : 'Activar modo foco'}
              </Text>
              <Text style={styles.focusModeToggleSubtext}>
                {focusMode
                  ? 'Muestra 1 categoria prioritaria y oculta extras'
                  : 'Reduce distracciones en Hoy'}
              </Text>
            </View>
            {focusMode ? (
              <ChevronDown size={18} color={THEME.colors.text.secondary} />
            ) : (
              <ChevronRight size={18} color={THEME.colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}

        {!loading && !hoyLiteActive && !focusMode && (
          <TouchableOpacity
            style={styles.secondaryModulesToggle}
            onPress={() => setShowSecondaryModules((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={showSecondaryModules ? 'Ocultar secciones extra de Hoy' : 'Mostrar secciones extra de Hoy'}
            accessibilityHint="Controla módulos secundarios como meditación, resumen por proyecto y recomendaciones"
            accessibilityState={{ expanded: showSecondaryModules }}
          >
            <Text style={styles.secondaryModulesToggleText}>
              {showSecondaryModules ? 'Ocultar secciones extra' : 'Mostrar secciones extra'}
            </Text>
            {showSecondaryModules ? (
              <ChevronDown size={18} color={THEME.colors.text.secondary} />
            ) : (
              <ChevronRight size={18} color={THEME.colors.text.secondary} />
            )}
          </TouchableOpacity>
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
                <Text style={styles.meditationTitle}>Tu momento de <Text style={styles.meditationTitleAccent}>calma</Text></Text>
                <Text style={styles.meditationSubtitle}>Respira. Escucha.</Text>
              </View>
              <View style={styles.meditationSingleCardInner}>
                <TouchableOpacity
                  style={[styles.meditationRow, morningMeditationDone && styles.meditationRowDone]}
                  onPress={() => !morningMeditationDone && handleStartMeditation('morning')}
                  activeOpacity={0.8}
                  disabled={morningMeditationDone}
                  accessibilityRole="button"
                  accessibilityLabel={morningMeditationDone ? 'Meditación matutina completada' : 'Meditar por la mañana'}
                  accessibilityHint="Abre una sesión breve para iniciar el día"
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
                      {morningMeditationDone ? 'Mañana — Completada' : 'Mañana'}
                    </Text>
                    {!morningMeditationDone && (
                      <Text style={styles.meditationRowHint}>Despierta con claridad</Text>
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
                  accessibilityLabel={eveningMeditationDone ? 'Meditación nocturna completada' : 'Meditar por la noche'}
                  accessibilityHint="Abre una sesión breve para cerrar el día"
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
                      {eveningMeditationDone ? 'Noche — Completada' : 'Noche'}
                    </Text>
                    {!eveningMeditationDone && (
                      <Text style={styles.meditationRowHint}>Termina el día en paz</Text>
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
                    <Text style={styles.heroTodayHeadline}>Esto te conviene hoy</Text>
                    <View style={styles.heroTodayStateRow}>
                      <View style={[styles.heroTodayPill, { backgroundColor: getEmotionColor(todayMood) }]}>
                        <Text style={styles.heroTodayPillEmoji}>{getEmotionEmoji(todayMood)}</Text>
                        <Text style={styles.heroTodayPillText}>
                          Sintiéndote {todayMood.charAt(0).toUpperCase() + todayMood.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.heroTodayPillNeutral}>
                        <Text style={styles.heroTodayPillNeutralText}>Energía {energyLevel}/5</Text>
                      </View>
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
                          ? 'Ocultar detalles del orden de tareas'
                          : 'Ver detalles del orden de tareas'
                      }
                    >
                      <View style={styles.prioritiesContextHeaderRow}>
                        <Text style={styles.heroDetailsToggleTitle} numberOfLines={1}>
                          Más sobre tu orden de hoy
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
                              <Text style={styles.heroDetailsSectionLabel}>Según tu check-in</Text>
                              <Text style={styles.prioritiesContextText}>{explanation.reasoning}</Text>
                              {explanation.suggestion ? (
                                <View style={styles.prioritiesSuggestionBox}>
                                  <Lightbulb size={18} color={THEME.colors.gradient.blue} />
                                  <Text style={styles.prioritiesSuggestion}>{explanation.suggestion}</Text>
                                </View>
                              ) : null}
                            </>
                          ) : null}
                          <Text style={styles.heroDetailsSectionLabel}>Cómo prioriza Koraa</Text>
                          <View style={styles.prioritizeHowList}>
                            {getPrioritizationExplainerBullets().map((line, i) => (
                              <Text key={i} style={styles.prioritizeHowBullet}>
                                • {line}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  {emotionalClosure && !hoyLiteLayout && (
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
                            <Text style={styles.emotionalSignalBadgeText}>Loop emocional</Text>
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
                  accessibilityLabel="Ir a Sentir para registrar cómo te sientes y priorizar"
                  accessibilityHint="Haz check-in para que Koraa ordene tus tareas"
                >
                  <LinearGradient
                    colors={[THEME.colors.tint.pink.soft, THEME.colors.tint.blue.veryFaint]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkInPromptBannerGradient}
                  >
                    <Heart size={22} color={THEME.colors.gradient.blue} />
                    <View style={styles.checkInPromptBannerTextWrap}>
                      <Text style={styles.checkInPromptBannerTitle}>¿Cómo te sientes hoy?</Text>
                      <Text style={styles.checkInPromptBannerSub}>
                        Haz tu check-in en Sentir para que Koraa ordene estas tareas según tu energía.
                      </Text>
                    </View>
                    <ChevronRight size={22} color={THEME.colors.gradient.blue} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {selectedEmotionalMemoryInsight && !hoyLiteLayout && (
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
                        <Text style={styles.emotionalSignalBadgeText}>Memoria semanal</Text>
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
                Tareas
              </Text>
              {/* Fecha + filtros en una fila; el estado va debajo a todo el ancho (evita columna estrecha al lado de los pills). */}
              <View style={styles.tareasHeaderMetaRow}>
                <Text style={styles.tareasDate}>
                  {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {!hoyLiteLayout && (
                  <View style={styles.taskFilterWrap}>
                    <TouchableOpacity
                      style={[styles.taskFilterPill, taskFilter === 'hoy' && styles.taskFilterPillActive]}
                      onPress={() => setTaskFilter('hoy')}
                      activeOpacity={0.8}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: taskFilter === 'hoy' }}
                      accessibilityLabel="Ver solo tareas de hoy"
                      accessibilityHint="Muestra pendientes de hoy y tareas sin fecha"
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
                        Solo hoy
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taskFilterPill, taskFilter === 'todas' && styles.taskFilterPillActive]}
                      onPress={() => setTaskFilter('todas')}
                      activeOpacity={0.8}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: taskFilter === 'todas' }}
                      accessibilityLabel="Ver todas las tareas pendientes"
                      accessibilityHint="Muestra todos los pendientes sin filtrar por fecha"
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
                        Todas
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.tareasSubtitle}>
                {displayedIncompleteTasks.length === 0
                  ? taskFilter === 'hoy'
                    ? 'Nada programado para hoy'
                    : 'No hay tareas pendientes'
                  : taskFilter === 'hoy'
                    ? `${displayedIncompleteTasks.length} ${displayedIncompleteTasks.length === 1 ? 'tarea' : 'tareas'} para hoy`
                    : `${displayedIncompleteTasks.length} ${displayedIncompleteTasks.length === 1 ? 'tarea' : 'tareas'} pendientes`}
              </Text>
              {focusMode && taskSections.length > 0 && (
                <Text style={styles.focusModeHint}>
                  Hoy vamos paso a paso: 1 categoría clave.
                </Text>
              )}
              {taskFilter === 'hoy' && !hoyLiteLayout && (
                <Text style={styles.taskFilterHint}>Tareas de hoy y sin fecha asignada</Text>
              )}
              {displayedIncompleteTasks.length > 0 && (
                <Text
                  style={styles.taskCompactHint}
                  accessibilityLabel="Las tareas de mayor prioridad aparecen arriba. Desliza una tarea para completar, editar o eliminar."
                  accessibilityRole="text"
                >
                  Orden: prioridad alta → baja · Desliza para completar, editar o eliminar
                </Text>
              )}
              {incompleteTasks.length >= 1 && user && todayMood && showSecondaryModulesEffective && (
                <TouchableOpacity
                  style={styles.redistributeCta}
                  onPress={() => setShowRedistribute(true)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Aliviar carga, repartir tareas en el calendario"
                  accessibilityHint="Abre el asistente para redistribuir tareas según tu energía"
                >
                  <CalendarRange size={20} color={THEME.colors.gradient.blue} />
                  <View style={styles.redistributeCtaTextWrap}>
                    <Text style={styles.redistributeCtaTitle}>Aliviar carga</Text>
                    <Text style={styles.redistributeCtaSub} numberOfLines={2}>
                      Reparte pendientes por días según tu energía y tiempo de hoy
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
                        Resumen de tareas
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.byProjectVerTodosHeader}
                      onPress={() => router.push('/proyectos')}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Ver todos los proyectos"
                      accessibilityHint="Abre la pantalla completa de proyectos"
                    >
                      <Text style={styles.byProjectVerTodosText}>Ver todos</Text>
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
                        accessibilityLabel={`${row.name}, ${row.count} tareas pendientes`}
                        accessibilityHint="Abre el detalle de este proyecto"
                      >
                        <View style={[styles.byProjectColorBar, { backgroundColor: row.color }]} />
                        <View style={styles.byProjectRowContent}>
                          <Text style={styles.byProjectRowName} numberOfLines={1}>{row.name}</Text>
                          <Text style={styles.byProjectRowCount}>
                            {row.count === 0 ? 'Sin pendientes' : `${row.count} ${row.count === 1 ? 'pendiente' : 'pendientes'}`}
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
                          accessibilityLabel={looseTasksExpanded ? 'Contraer tareas sueltas' : `Ver ${projectSectionsForToday.looseCount} tareas sueltas`}
                          accessibilityState={{ expanded: looseTasksExpanded }}
                        >
                          <View style={[styles.byProjectColorBar, { backgroundColor: THEME.colors.text.tertiary }]} />
                          <View style={styles.byProjectRowContent}>
                            <Text style={styles.byProjectRowName}>Tareas sin proyecto</Text>
                            <Text style={styles.byProjectRowCount}>
                              {projectSectionsForToday.looseCount} {projectSectionsForToday.looseCount === 1 ? 'tarea' : 'tareas'}
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
                              getProjectInfo={() => ({ label: 'Tareas sueltas', color: THEME.colors.text.secondary })}
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
                    if (focusMode) {
                      // En modo foco siempre mostramos una sola categoría a la vez.
                      setExpandedSections(new Set<string>([sec.id]));
                      return;
                    }
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
                        accessibilityLabel={
                          focusMode
                            ? `Mostrar solo ${sec.title}`
                            : isSectionExpanded
                              ? `Contraer ${sec.title}`
                              : `Ver ${sec.tasks.length} tareas de ${sec.title}`
                        }
                        accessibilityState={{ expanded: isSectionExpanded }}
                      >
                        <Text style={styles.categoryLabelName}>{sec.title}</Text>
                        <View style={styles.categoryLabelRight}>
                          <Text style={styles.categoryLabelCount}>{sec.tasks.length} {sec.tasks.length === 1 ? 'tarea' : 'tareas'}</Text>
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
                                const name = p?.name ?? 'proyecto';
                                return { label: `Parte de ${name}`, color: p?.color ?? THEME.colors.gradient.blue, projectId, projectName: name };
                              }
                              if (task.project_id) {
                                const p = projectsMap[task.project_id];
                                const name = p?.name ?? 'Proyecto';
                                return { label: `Proyecto: ${name}`, color: p?.color ?? THEME.colors.gradient.blue, projectId: task.project_id, projectName: name };
                              }
                              return { label: 'Tareas sueltas', color: THEME.colors.text.secondary };
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
                      <Text style={styles.emptyTasksTitle}>Todo al día</Text>
                      <Text style={styles.emptyTasksInCardText}>
                        No tienes tareas pendientes. Si añades algo en Tareas, aparecerá aquí priorizado según cómo te sientas.
                      </Text>
                    </>
                  ) : taskFilter === 'hoy' &&
                    incompleteTasks.length > 0 &&
                    incompleteTasksForToday.length === 0 ? (
                    <>
                      <Text style={styles.emptyTasksTitle}>Nada programado para hoy</Text>
                      <Text style={styles.emptyTasksInCardText}>
                        Tienes tareas en otros días. Cambia a «Todas» para verlas o añade algo para hoy desde la pestaña Tareas.
                      </Text>
                      <View style={styles.emptyTasksActions}>
                        <TouchableOpacity
                          style={styles.emptyTasksLinkPill}
                          onPress={() => setTaskFilter('todas')}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel="Ver todas las tareas pendientes"
                        >
                          <Text style={styles.emptyTasksLinkPillText}>Ver todas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.emptyTasksLinkPill, styles.emptyTasksLinkPillSecond]}
                          onPress={() =>
                            router.push(
                              `/(tabs)/vaciar?date=${new Date().toISOString().split('T')[0]}`,
                            )
                          }
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel="Agregar tarea con fecha de hoy"
                          accessibilityHint="Abre Tareas y preselecciona la fecha de hoy"
                        >
                          <Text style={styles.emptyTasksLinkPillText}>Agregar para hoy</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyTasksTitle}>Tu lista empieza aquí</Text>
                      <Text style={styles.emptyTasksInCardText}>
                        Captura tareas en segundos en la pestaña Tareas. Koraa las ordenará según tu check-in en Sentir.
                      </Text>
                    </>
                  )}
                  <View style={styles.emptyTasksCta}>
                    <GradientButton
                      title="Ir a Tareas"
                      onPress={() => router.push('/(tabs)/vaciar')}
                    />
                    {incompleteTasks.length === 0 && tasks.length > 0 ? (
                      <TouchableOpacity
                        style={styles.emptyTasksSecondaryCta}
                        onPress={() => router.push('/(tabs)/sentir')}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Ir a Sentir"
                        accessibilityHint="Abre Sentir para registrar tu estado emocional"
                      >
                        <Text style={styles.emptyTasksSecondaryCtaText}>Ir a Sentir</Text>
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
                  accessibilityLabel="Agregar más tareas"
                  accessibilityHint="Abre la pestaña Tareas para capturar más pendientes"
                >
                  <Plus size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.agregarMasHint}>Agregar más · pestaña Tareas</Text>
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
          accessibilityLabel="Cerrar menú"
          accessibilityHint="Toca fuera del menú para cerrarlo"
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
            showToast('Fechas actualizadas. Revisa la pestaña Semana o filtra por Hoy.', 'success');
          }}
        />
      )}

      {/* Onboarding rápido y visualmente atractivo */}
      <QuickOnboardingModal
        visible={showQuickOnboarding}
        onClose={() => setShowQuickOnboarding(false)}
      />
      
      {/* Modal de check-in rápido - Lazy loaded */}
      {showQuickCheckIn && (
        <Suspense fallback={null}>
          <QuickCheckInModal
            visible={showQuickCheckIn}
            onClose={() => setShowQuickCheckIn(false)}
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
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.8,
    fontSize: 10,
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
  focusModeToggle: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: -THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
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
  focusModeToggleText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  focusModeToggleTextWrap: {
    flex: 1,
    paddingRight: THEME.spacing.sm,
  },
  focusModeToggleSubtext: {
    ...THEME.typography.small,
    fontSize: 11,
    color: THEME.colors.text.secondary,
    marginTop: 2,
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
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 11,
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
    fontSize: 11,
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
  focusModeHint: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.gradient.blue,
    marginTop: 4,
    width: '100%',
  },
  taskCompactHint: {
    ...THEME.typography.small,
    fontSize: 11,
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
    marginBottom: 6,
    letterSpacing: 0.2,
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
    ...THEME.typography.small,
    fontSize: 10,
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
    ...THEME.typography.small,
    fontSize: 11,
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
    ...THEME.typography.caption,
    fontSize: 10,
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
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 11,
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
    color: THEME.colors.fill[100],
    fontSize: 11,
    fontWeight: 'bold',
  },
  recommendationsWrap: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
    paddingTop: 0,
  },
});
