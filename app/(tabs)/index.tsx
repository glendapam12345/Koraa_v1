import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Toast } from '@/components/Toast';
import { FlowIndicator } from '@/components/FlowIndicator';
import { ValueCard } from '@/components/tasks/ValueCard';
import { ProgressBar } from '@/components/tasks/ProgressBar';
import { FlowGuideCard } from '@/components/flow/FlowGuideCard';
import { TaskList } from '@/components/tasks/TaskList';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useTasks } from '@/hooks/useTasks';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useProgress } from '@/hooks/useProgress';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { detectCategory } from '@/lib/categoryDetection';
import { generatePrioritizationExplanation } from '@/lib/smartPrioritization';
import { getEmotionEmoji } from '@/lib/emotionalInsights';
import { getSectionEmoji, getCategoryEmoji } from '@/constants/emojis';
import { logger } from '@/lib/logger';
import { Sparkles, Plus, Flame, PenTool, Heart, Target, ArrowRight, Lightbulb, ChevronDown, ChevronRight, FolderKanban } from 'lucide-react-native';
import { router } from 'expo-router';
import { lazy, Suspense } from 'react';
import { ActivityIndicator, View as ViewRN } from 'react-native';
import type { Task } from '@/components/tasks/TaskCard';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickOnboardingModal } from '@/components/onboarding/QuickOnboardingModal';
import { MeditationErrorBoundary } from '@/components/MeditationErrorBoundary';
import { MeditationCircleSimple } from '@/components/MeditationCircleSimple';
import Constants from 'expo-constants';

// Lazy loading para componentes pesados que no se usan inmediatamente
const TaskEditModal = lazy(() => 
  import('@/components/tasks/TaskEditModal').then(module => ({ default: module.TaskEditModal }))
    .catch(() => ({ default: () => null as any }))
);
const ConfettiCelebration = lazy(() => 
  import('@/components/ConfettiCelebration').then(module => ({ default: module.ConfettiCelebration }))
    .catch(() => ({ default: () => null as any }))
);
const MeditationCircle = lazy(() => 
  import('@/components/MeditationCircle').then(module => ({ default: module.MeditationCircle }))
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

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedDetailsTasks, setExpandedDetailsTasks] = useState<Set<string>>(new Set());
  /** Secciones de categoría expandidas (null = todas expandidas) */
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
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const [totalTasksBefore, setTotalTasksBefore] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [showMeditation, setShowMeditation] = useState(false);
  const [meditationType, setMeditationType] = useState<'morning' | 'evening'>('morning');
  const [morningMeditationDone, setMorningMeditationDone] = useState(false);
  const [eveningMeditationDone, setEveningMeditationDone] = useState(false);
  const [dismissedCelebration, setDismissedCelebration] = useState(false);
  const [flowGuideCollapsed, setFlowGuideCollapsed] = useState(true);
  const [heroReasoningExpanded, setHeroReasoningExpanded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingTasksRef = useRef<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  // Hooks personalizados
  const { user } = useAuth();

  const {
    todayMood,
    energy,
    energyLevel,
    time,
    focusLevel,
    loading,
    loadTodayCheckIn,
  } = useCheckIn(showToast);

  const {
    tasks,
    loadingTasks,
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

  const {
    incompleteTasks,
    completedToday,
    totalPriorityTasks,
    progressPercentage,
    progressWidth,
  } = useProgress(tasks, loading);

  const {
    toggleTask,
    handleSaveEdit: handleSaveEditAction,
  } = useTaskActions({
    tasks,
    setTasks,
    loadTasks,
    showToast,
    setMenuOpen,
    timeoutRef,
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

  const loadMeditations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
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

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('meditations')
        .insert({
          user_id: user.id,
          date: today,
          type: meditationType,
        });

      if (error) {
        logger.error('Error guardando meditación:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = null;
      }
      if (backgroundLoadTimeoutRef.current) {
        clearTimeout(backgroundLoadTimeoutRef.current);
        backgroundLoadTimeoutRef.current = null;
      }
    };
  }, [loadTasks, loadTodayCheckIn, loadStreak, loadMeditations, loadPrioritizationMetadata]);

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
  }, [tasks, loading]);

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
                  const errorMessage = getErrorMessage(subtasksError);
                  showToast(`No se pudieron eliminar las subtareas: ${errorMessage}`, 'error');
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
                const errorMessage = getErrorMessage(error);
                showToast(errorMessage, 'error');
                setMenuOpen(null);
                return;
              }

              // Actualización optimista - remover de la lista inmediatamente
              setTasks((prevTasks: Task[]) => prevTasks.filter((t: Task) => t.id !== task.id));
              setMenuOpen(null);
              showToast('Tarea eliminada correctamente', 'success');
            } catch (error) {
              logger.error('Error inesperado al eliminar:', error);
              const errorMessage = getErrorMessage(error);
              showToast(errorMessage, 'error');
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
        suggestion: '1. Vaciar → 2. Sentir → 3. Accionar',
        reasoning: 'Primero agrega tus tareas en "Vaciar", luego registra cómo te sientes en "Sentir" para que Koraa priorice automáticamente tus tareas aquí.',
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
  }, [todayMood, energyLevel, incompleteTasks.length, time, focusLevel, tasks.length]);

  const explanation = useMemo(
    () => getPriorityExplanation(),
    [todayMood, energyLevel, incompleteTasks.length, time, focusLevel, tasks.length]
  );

  type TaskSection = { id: string; title: string; color: string; isCategory: true; categoryKey: string; tasks: Task[] };
  const CATEGORY_ORDER = ['Hogar', 'Trabajo', 'Personal', 'Salud', 'Contenido', 'Marca', 'Otros'];
  const CATEGORY_SUBTITLES: Record<string, string> = {
    hogar: 'Tareas del hogar y casa',
    trabajo: 'Tareas profesionales',
    personal: 'Crecimiento y bienestar personal',
    salud: 'Cuidado físico y mental',
    contenido: 'Creación de contenido',
    marca: 'Tu marca personal',
    otros: 'Otras tareas',
  };
  const taskSections = useMemo(() => {
    const byCategory = new Map<string, Task[]>();
    const normalizeCategory = (cat: string | undefined | null): string => {
      const key = (cat && cat.trim() !== '' ? cat.trim() : 'Otros').toLowerCase();
      const known = CATEGORY_ORDER.map((c) => c.toLowerCase()).includes(key);
      return known ? key : 'otros';
    };
    incompleteTasks.forEach((t) => {
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
  }, [incompleteTasks, getCategoryColor]);

  // Agrupar tareas pendientes por proyecto para la sección "Por proyecto" en Inicio
  const projectSectionsForToday = useMemo(() => {
    const byProject = new Map<string, number>();
    let looseCount = 0;
    incompleteTasks.forEach((t) => {
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
  }, [incompleteTasks, projectsMap]);

  const looseTasksList = useMemo(
    () => incompleteTasks.filter((t) => !t.project_id),
    [incompleteTasks]
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + THEME.spacing.lg }]} 
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
              {currentStreak > 0 && (
                <View style={styles.streakBadgeInline}>
                  <Flame size={14} color={THEME.colors.gradient.pink} />
                  <Text style={styles.streakTextInline}>{currentStreak}</Text>
                </View>
              )}
            </View>
            <Text style={styles.welcomeSubtitle} numberOfLines={1}>
              Koraa prioriza según cómo te sientes
            </Text>
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
          >
            <View style={[styles.contextPill, { backgroundColor: getEmotionColor(todayMood) }]}>
              <Text style={styles.contextPillEmoji}>{getEmotionEmoji(todayMood)}</Text>
              <Text style={styles.contextPillText}>
                Sintiéndote {todayMood.charAt(0).toUpperCase() + todayMood.slice(1)} · Energía {energyLevel}/5
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {!loading && !todayMood && (
          <TouchableOpacity
            style={styles.ctaSentirCardTop}
            onPress={() => router.push('/(tabs)/sentir')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Ir a Sentir para que Koraa priorice tus tareas según cómo te sientes"
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue + '14', THEME.colors.gradient.pink + '0C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaSentirCardTopGradient}
            >
              <View style={styles.ctaSentirCardTopIconWrap}>
                <Heart size={24} color={THEME.colors.gradient.blue} strokeWidth={1.8} />
              </View>
              <View style={styles.ctaSentirCardTopTextWrap}>
                <Text style={styles.ctaSentirCardTopBody}>
                  Cuando indiques cómo te sientes en Sentir, aquí verás solo lo que te conviene hoy.
                </Text>
                <View style={styles.ctaSentirCardTopLinkRow}>
                  <Text style={styles.ctaSentirCardTopLink}>Ir a Sentir</Text>
                  <ChevronRight size={18} color={THEME.colors.gradient.blue} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* CTA principal: agregar tareas (estilo Musa: una acción clara) */}
        {!loading && (
          <TouchableOpacity
            style={styles.addTasksPill}
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Ir a Vaciar para agregar tareas"
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

        {/* Guía visual del flujo - Cómo funciona Koraa (colapsable, cerrada por defecto) */}
        {!loading && (
          <View style={styles.flowGuideSection}>
            <TouchableOpacity
              style={styles.flowGuideHeader}
              onPress={() => setFlowGuideCollapsed((c) => !c)}
              activeOpacity={0.7}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={flowGuideCollapsed ? 'Expandir guía Cómo funciona Koraa' : 'Contraer guía'}
            >
              <Text style={styles.flowGuideTitle} numberOfLines={1}>¿Cómo funciona Koraa?</Text>
              {flowGuideCollapsed ? (
                <ChevronRight size={20} color={THEME.colors.gradient.blue} />
              ) : (
                <ChevronDown size={20} color={THEME.colors.gradient.blue} />
              )}
            </TouchableOpacity>
            {!flowGuideCollapsed && (
            <View style={styles.flowStepsContainer}>
              <View style={styles.flowStep}>
                <View style={[styles.flowStepNumber, styles.flowStepNumberActive]}>
                  <PenTool size={14} color={THEME.colors.onGradient} />
                </View>
                <Text style={styles.flowStepLabel} numberOfLines={1}>Vaciar</Text>
                <Text style={styles.flowStepDesc} numberOfLines={1}>Agrega tus tareas</Text>
              </View>
              <View style={styles.flowArrow}>
                <ArrowRight size={14} color={THEME.colors.text.secondary} />
              </View>
              <View style={styles.flowStep}>
                <View style={styles.flowStepNumber}>
                  <Heart size={14} color={THEME.colors.text.secondary} />
                </View>
                <Text style={styles.flowStepLabel} numberOfLines={1}>Sentir</Text>
                <Text style={styles.flowStepDesc} numberOfLines={1}>Di cómo te sientes</Text>
              </View>
              <View style={styles.flowArrow}>
                <ArrowRight size={14} color={THEME.colors.text.secondary} />
              </View>
              <View style={styles.flowStep}>
                <View style={styles.flowStepNumber}>
                  <Target size={14} color={THEME.colors.text.secondary} />
                </View>
                <Text style={styles.flowStepLabel} numberOfLines={1}>Hoy</Text>
                <Text style={styles.flowStepDesc} numberOfLines={1}>Ve tus prioridades</Text>
              </View>
            </View>
            )}
          </View>
        )}

        {/* Una sola card de meditación: Mañana y Noche dentro del mismo bloque */}
        {!loading && (
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
              <View style={styles.tareasHeaderRow}>
                <View style={styles.tareasHeaderLeft}>
                  <Text style={styles.tareasTitle}>📋 # Tareas</Text>
                  <Text style={styles.tareasDate}>
                    {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  <Text style={styles.tareasSubtitle}>
                    {incompleteTasks.length === 0 ? 'Aún no tienes tareas para hoy' : `${incompleteTasks.length} ${incompleteTasks.length === 1 ? 'tarea' : 'tareas'} para hoy`}
                  </Text>
                </View>
                {incompleteTasks.length > 0 && (
                  <View
                    style={styles.priorityLegend}
                    accessibilityLabel="Las tareas de mayor prioridad aparecen arriba; las de menor prioridad, abajo."
                    accessibilityRole="text"
                  >
                    <Text style={styles.priorityLegendHigh}>Prioridad alta</Text>
                    <View style={styles.priorityLegendArrow} />
                    <Text style={styles.priorityLegendLow}>Prioridad baja</Text>
                  </View>
                )}
              </View>

              {todayMood && (
                <View style={styles.heroTodayWrap}>
                  <LinearGradient
                    colors={[getEmotionColor(todayMood).replace('0.15', '0.28'), THEME.colors.fill[100]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.45 }}
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
                  {explanation.reasoning && (
                    <TouchableOpacity
                      style={styles.prioritiesContext}
                      onPress={() => setHeroReasoningExpanded((e) => !e)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={heroReasoningExpanded ? 'Ocultar explicación' : 'Ver por qué priorizamos así'}
                    >
                      <View style={styles.prioritiesContextHeaderRow}>
                        <Text style={styles.prioritiesContextTitle}>Basado en cómo te sientes</Text>
                        {heroReasoningExpanded ? (
                          <ChevronDown size={16} color={THEME.colors.text.secondary} />
                        ) : (
                          <ChevronRight size={16} color={THEME.colors.text.secondary} />
                        )}
                      </View>
                      {heroReasoningExpanded && (
                        <>
                          <Text style={styles.prioritiesContextText}>{explanation.reasoning}</Text>
                          {explanation.suggestion && (
                            <View style={styles.prioritiesSuggestionBox}>
                              <Lightbulb size={18} color={THEME.colors.gradient.blue} />
                              <Text style={styles.prioritiesSuggestion}>{explanation.suggestion}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {todayMood && incompleteTasks.length > 0 && (
                <Text style={styles.tasksForTodayLabel}>Estas tareas priorizamos para ti hoy</Text>
              )}
              {/* Sección Por proyecto: mismo flujo que Tareas y pantalla Proyectos */}
              {(projectSectionsForToday.projectRows.length > 0 || projectSectionsForToday.looseCount > 0) && (
                <View style={styles.byProjectSection}>
                  <View style={styles.byProjectHeader}>
                    <View style={styles.byProjectHeaderIconWrap}>
                      <FolderKanban size={20} color={THEME.colors.gradient.blue} />
                    </View>
                    <Text style={styles.byProjectTitle}>Por proyecto</Text>
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
                            <Text style={styles.byProjectRowName}>Tareas sueltas</Text>
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
                    <TouchableOpacity
                      style={styles.byProjectVerTodos}
                      onPress={() => router.push('/proyectos')}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Ver todos los proyectos"
                    >
                      <Text style={styles.byProjectVerTodosText}>Ver todos los proyectos</Text>
                      <ChevronRight size={18} color={THEME.colors.gradient.blue} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {incompleteTasks.length > 0 ? (
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
                        accessibilityLabel={isSectionExpanded ? `Contraer ${sec.title}` : `Ver ${sec.tasks.length} tareas de ${sec.title}`}
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
                              tasks.filter(
                                (t) => t.project_id === projectId && !t.is_completed && t.id !== excludeTaskId
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
                  <Text style={styles.emptyTasksInCardText}>Usa el cuadro de arriba para agregar tu primera tarea.</Text>
                </View>
              )}

              {incompleteTasks.length > 0 && (
                <TouchableOpacity
                  style={styles.agregarMasWrap}
                  onPress={() => router.push('/(tabs)/vaciar')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Agregar más tareas"
                >
                  <Plus size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.agregarMasHint}>Agregar más · pestaña Vaciar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Mensaje cuando no hay tareas pendientes pero sí completadas */}
        {!loading && todayMood && incompleteTasks.length === 0 && tasks.length > 0 && !dismissedCelebration && (
          <Suspense fallback={null}>
            <NoPendingTasksCelebration onDismiss={() => setDismissedCelebration(true)} />
          </Suspense>
        )}

        {/* Recomendaciones: siempre visibles al final */}
        {user && (
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

      {/* Modal de meditación: en Expo Go usamos versión simple (sin Reanimated/SVG) para evitar crash */}
      {showMeditation && (
        Constants.appOwnership === 'expo' ? (
          <MeditationCircleSimple
            visible={showMeditation}
            onComplete={handleMeditationComplete}
            onClose={() => setShowMeditation(false)}
            type={meditationType}
          />
        ) : (
          <MeditationErrorBoundary
            onError={() => {
              setShowMeditation(false);
              showToast('No se pudo abrir la meditación. Intenta de nuevo.', 'error');
            }}
          >
            <Suspense fallback={<ViewRN style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: THEME.colors.overlay, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={THEME.colors.gradient.blue} /></ViewRN>}>
              <MeditationCircle
                visible={showMeditation}
                onComplete={handleMeditationComplete}
                onClose={() => setShowMeditation(false)}
                type={meditationType}
              />
            </Suspense>
          </MeditationErrorBoundary>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    paddingBottom: THEME.spacing.lg,
  },
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
    marginBottom: THEME.spacing.sm,
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
  ctaSentirCardTop: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  ctaSentirCardTopGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  ctaSentirCardTopIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSentirCardTopTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  ctaSentirCardTopBody: {
    ...THEME.typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  ctaSentirCardTopLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaSentirCardTopLink: {
    fontSize: 15,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
    letterSpacing: 0.2,
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
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
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
  welcomeSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.95,
  },
  flowGuideSection: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    overflow: 'hidden',
    ...THEME.shadows.soft,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  flowGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  flowGuideTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    fontSize: 11,
    flexShrink: 0,
  },
  flowStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  flowStep: {
    alignItems: 'center',
    minWidth: 72,
    flexShrink: 0,
  },
  flowStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
  },
  flowStepNumberActive: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  flowStepLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  flowStepDesc: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  flowArrow: {
    paddingHorizontal: 2,
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
  prioritiesContextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  prioritiesContextTitle: {
    fontSize: 13,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: 8,
    letterSpacing: 0.25,
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
    paddingBottom: THEME.spacing.lg,
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
    alignItems: 'center',
  },
  emptyTasksInCardText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
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
  tareasHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  tareasHeaderLeft: {
    flex: 1,
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
    marginTop: 2,
  },
  tareasSubtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
    fontSize: 13,
  },
  heroTodayWrap: {
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  heroTodayCard: {
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md + 4,
    paddingHorizontal: THEME.spacing.lg,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  heroTodayHeadline: {
    fontSize: 21,
    lineHeight: 28,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 0.3,
  },
  heroTodayStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  heroTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: THEME.borderRadius.pill,
  },
  heroTodayPillEmoji: {
    fontSize: 18,
  },
  heroTodayPillText: {
    fontSize: 14,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  heroTodayPillNeutral: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
  },
  heroTodayPillNeutralText: {
    fontSize: 13,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  priorityLegend: {
    alignItems: 'flex-end',
  },
  priorityLegendHigh: {
    ...THEME.typography.small,
    fontSize: 10,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  priorityLegendArrow: {
    width: 0,
    height: 0,
    marginVertical: 4,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: THEME.colors.text.secondary,
  },
  priorityLegendLow: {
    ...THEME.typography.small,
    fontSize: 10,
    color: THEME.colors.text.secondary,
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
  tasksForTodayLabel: {
    fontSize: 13,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
    letterSpacing: 0.15,
  },
  taskSection: {
    marginBottom: THEME.spacing.lg,
  },
  areaCard: {
    marginBottom: THEME.spacing.md,
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
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
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
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
  },
  agregarMasHint: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  byProjectSection: {
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
  byProjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
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
  byProjectVerTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
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
    marginTop: THEME.spacing.lg,
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
    marginBottom: THEME.spacing.xl,
    paddingTop: THEME.spacing.sm,
  },
});
