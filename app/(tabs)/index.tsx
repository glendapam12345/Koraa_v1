import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl } from 'react-native';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Toast } from '@/components/Toast';
import { FlowIndicator } from '@/components/FlowIndicator';
import { MoodCard } from '@/components/mood/MoodCard';
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
import { logger } from '@/lib/logger';
import { Sparkles, Plus, Flame, Sunrise, Moon, PenTool, Heart, Target, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { lazy, Suspense } from 'react';
import { ActivityIndicator, View as ViewRN } from 'react-native';
import type { Task } from '@/components/tasks/TaskCard';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickOnboardingModal } from '@/components/onboarding/QuickOnboardingModal';

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

export default function TodayScreen() {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
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
    switch (category.toLowerCase()) {
      case 'trabajo':
        return '#4A90E2';
      case 'salud':
        return '#FF6B6B';
      case 'personal':
        return '#9B59B6';
      default:
        return THEME.colors.text.secondary;
    }
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
        reasoning: 'Primero agrega tus tareas en "Vaciar", luego registra cómo te sientes en "Sentir" para que Kora priorice automáticamente tus tareas aquí.',
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
        contentContainerStyle={styles.content} 
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
        {/* Título de bienvenida con racha */}
        {!loading && (
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>{getGreeting} ✨</Text>
              {currentStreak > 0 && (
                <View style={styles.streakBadgeInline}>
                  <Flame size={16} color="#FF6B6B" />
                  <Text style={styles.streakTextInline}>{currentStreak}</Text>
                </View>
              )}
            </View>
            <Text style={styles.welcomeSubtitle}>
              Koraa prioriza tus tareas según cómo te sientes
            </Text>
          </View>
        )}

        {/* Sección de Meditación */}
        {!loading && (
          <View style={styles.meditationSection}>
            <Text style={styles.meditationSectionTitle}>
              Tu momento de <Text style={styles.accentText}>calma</Text>
            </Text>

            <View style={styles.meditationButtons}>
              {/* Meditación matutina */}
              <TouchableOpacity
                style={[
                  styles.meditationButton,
                  morningMeditationDone && styles.meditationButtonDone
                ]}
                onPress={() => !morningMeditationDone && handleStartMeditation('morning')}
                activeOpacity={0.8}
                disabled={morningMeditationDone}
                accessibilityRole="button"
                accessibilityLabel={morningMeditationDone ? "Meditación matutina completada" : "Iniciar meditación matutina"}
                accessibilityHint={morningMeditationDone ? "Ya completaste tu meditación matutina de hoy" : "Abre la meditación guiada para comenzar el día con calma"}
                accessibilityState={{ disabled: morningMeditationDone }}
              >
                <LinearGradient
                  colors={
                    morningMeditationDone
                      ? ['#E8E8E8', '#F5F5F5']
                      : ['#FFA07A', '#FF6B6B']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.meditationButtonGradient}
                >
                  <Text style={styles.meditationEmoji}>🧘</Text>
                  <Text style={[
                    styles.meditationButtonText,
                    morningMeditationDone && styles.meditationButtonTextDone
                  ]}>
                    {morningMeditationDone ? 'Mañana completada' : 'Meditar por la mañana'}
                  </Text>
                  {morningMeditationDone && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Meditación nocturna */}
              <TouchableOpacity
                style={[
                  styles.meditationButton,
                  eveningMeditationDone && styles.meditationButtonDone
                ]}
                onPress={() => !eveningMeditationDone && handleStartMeditation('evening')}
                activeOpacity={0.8}
                disabled={eveningMeditationDone}
                accessibilityRole="button"
                accessibilityLabel={eveningMeditationDone ? "Meditación nocturna completada" : "Iniciar meditación nocturna"}
                accessibilityHint={eveningMeditationDone ? "Ya completaste tu meditación nocturna de hoy" : "Abre la meditación guiada para terminar el día con calma"}
                accessibilityState={{ disabled: eveningMeditationDone }}
              >
                <LinearGradient
                  colors={
                    eveningMeditationDone
                      ? ['#E8E8E8', '#F5F5F5']
                      : ['#9B59B6', '#6C5CE7']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.meditationButtonGradient}
                >
                  <Text style={styles.meditationEmoji}>🧘</Text>
                  <Text style={[
                    styles.meditationButtonText,
                    eveningMeditationDone && styles.meditationButtonTextDone
                  ]}>
                    {eveningMeditationDone ? 'Noche completada' : 'Meditar por la noche'}
                  </Text>
                  {eveningMeditationDone && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sección de Cómo te sientes hoy - Siempre mostrar si hay check-in */}
        {!loading && todayMood && (
          <MoodCard
            todayMood={todayMood}
            energy={energy}
            time={time}
            focusLevel={focusLevel}
            onRefresh={() => {
              loadTasks();
              loadTodayCheckIn();
            }}
          />
        )}

        {/* Guía visual del flujo - Mejorada para claridad */}
        {!loading && (
          <TouchableOpacity
            style={styles.flowGuideSection}
            onPress={() => {
              // Aquí podrías abrir un modal o navegar a una pantalla de ayuda
              // Por ahora solo hacemos que sea interactivo
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ver cómo funciona Koraa"
            accessibilityHint="Toca para ver una explicación detallada del flujo"
          >
            <View style={styles.flowGuideHeader}>
              <Text style={styles.flowGuideTitle}>¿Cómo funciona Koraa?</Text>
              <Sparkles size={18} color={THEME.colors.gradient.blue} />
            </View>
            <View style={styles.flowStepsContainer}>
              <View style={styles.flowStep}>
                <View style={[styles.flowStepNumber, styles.flowStepNumberActive]}>
                  <PenTool size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.flowStepLabel}>Vaciar</Text>
                <Text style={styles.flowStepDesc}>Agrega tus tareas</Text>
              </View>
              <View style={styles.flowArrow}>
                <ArrowRight size={16} color={THEME.colors.text.secondary} />
              </View>
              <View style={styles.flowStep}>
                <View style={styles.flowStepNumber}>
                  <Heart size={16} color={THEME.colors.text.secondary} />
                </View>
                <Text style={styles.flowStepLabel}>Sentir</Text>
                <Text style={styles.flowStepDesc}>Di cómo te sientes</Text>
              </View>
              <View style={styles.flowArrow}>
                <ArrowRight size={16} color={THEME.colors.text.secondary} />
              </View>
              <View style={styles.flowStep}>
                <View style={styles.flowStepNumber}>
                  <Target size={16} color={THEME.colors.text.secondary} />
                </View>
                <Text style={styles.flowStepLabel}>Accionar</Text>
                <Text style={styles.flowStepDesc}>Ve tus prioridades</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Cuadro de Prioridades con contexto */}
        {!loading && incompleteTasks.length > 0 && (
          <View style={styles.prioritiesCard}>
            <View style={styles.prioritiesHeader}>
              <Text style={styles.prioritiesTitle}>Tus prioridades para hoy</Text>
              <Sparkles size={20} color={THEME.colors.gradient.blue} />
            </View>
            
            {todayMood && explanation.reasoning && (
              <View style={styles.prioritiesContext}>
                <Text style={styles.prioritiesContextText}>
                  {explanation.reasoning}
                </Text>
                {explanation.suggestion && (
                  <Text style={styles.prioritiesSuggestion}>
                    💡 {explanation.suggestion}
                  </Text>
                )}
              </View>
            )}

            {!todayMood && (
              <View style={styles.prioritiesContext}>
                <Text style={styles.prioritiesContextText}>
                  Ve a <Text style={styles.prioritiesContextAccent}>Sentir</Text> para que Kora priorice estas tareas.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.vaciarTareasButton}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Vaciar tareas"
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.vaciarTareasButtonGradient}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.vaciarTareasButtonText}>Vaciar tareas</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de tareas organizadas por proyecto */}
        {!loading && incompleteTasks.length > 0 && (() => {
          // Agrupar tareas por proyecto
          const tasksByProject = new Map<string | null, typeof incompleteTasks>();
          const standaloneTasks: typeof incompleteTasks = [];
          
          incompleteTasks.forEach(task => {
            if (task.project_id) {
              if (!tasksByProject.has(task.project_id)) {
                tasksByProject.set(task.project_id, []);
              }
              tasksByProject.get(task.project_id)!.push(task);
            } else {
              standaloneTasks.push(task);
            }
          });

          return (
            <View style={styles.tasksContainer}>
              {/* Tareas de proyectos */}
              {Array.from(tasksByProject.entries()).map(([projectId, projectTasks]) => (
                <View key={`project-${projectId}`} style={styles.projectSection}>
                  <Text style={styles.projectSectionTitle}>Proyecto</Text>
                  <TaskList
                    tasks={projectTasks}
                    incompleteTasks={projectTasks}
                    expandedTasks={expandedTasks}
                    menuOpen={menuOpen}
                    onToggleTask={handleToggleTask}
                    onToggleExpansion={toggleTaskExpansion}
                    onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    getCategoryColor={getCategoryColor}
                    onSubtaskToggle={(subtaskId, parentTaskId) => toggleTask(subtaskId, true, parentTaskId)}
                  />
                </View>
              ))}
              
              {/* Tareas sueltas */}
              {standaloneTasks.length > 0 && (
                <View style={styles.standaloneSection}>
                  <Text style={styles.standaloneSectionTitle}>Tareas sueltas</Text>
                  <TaskList
                    tasks={standaloneTasks}
                    incompleteTasks={standaloneTasks}
                    expandedTasks={expandedTasks}
                    menuOpen={menuOpen}
                    onToggleTask={handleToggleTask}
                    onToggleExpansion={toggleTaskExpansion}
                    onMenuPress={(taskId) => setMenuOpen(menuOpen === taskId ? null : taskId)}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    getCategoryColor={getCategoryColor}
                    onSubtaskToggle={(subtaskId, parentTaskId) => toggleTask(subtaskId, true, parentTaskId)}
                  />
                </View>
              )}
            </View>
          );
        })()}

        {/* Mensaje cuando no hay tareas pendientes pero sí completadas */}
        {!loading && todayMood && incompleteTasks.length === 0 && tasks.length > 0 && !dismissedCelebration && (
          <Suspense fallback={null}>
            <NoPendingTasksCelebration onDismiss={() => setDismissedCelebration(true)} />
          </Suspense>
        )}

        {/* Sección de Recomendaciones */}
        {user && (
          <RecommendationsSection userId={user.id} />
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
        <Suspense fallback={<ViewRN style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={THEME.colors.gradient.blue} /></ViewRN>}>
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

      {/* Modal de meditación - Lazy loaded */}
      {showMeditation && (
        <Suspense fallback={<ViewRN style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={THEME.colors.gradient.blue} /></ViewRN>}>
          <MeditationCircle
            visible={showMeditation}
            onComplete={handleMeditationComplete}
            onClose={() => setShowMeditation(false)}
            type={meditationType}
          />
        </Suspense>
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
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
  },
  welcomeTitle: {
    ...THEME.typography.h1,
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
    color: '#FF6B6B',
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  welcomeSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
  },
  flowGuideSection: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  flowGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  flowGuideTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  flowStepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.xs,
  },
  flowStep: {
    flex: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  flowStepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingHorizontal: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs * 2,
  },
  prioritiesCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  prioritiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  prioritiesTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  prioritiesContext: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  prioritiesContextText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
    fontSize: 14,
  },
  prioritiesContextAccent: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
  },
  prioritiesSuggestion: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
    fontSize: 12,
  },
  vaciarTareasButton: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  vaciarTareasButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  vaciarTareasButtonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
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
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
  },
  projectSection: {
    marginBottom: THEME.spacing.lg,
  },
  projectSectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  standaloneSection: {
    marginTop: THEME.spacing.lg,
  },
  standaloneSectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  emptyState: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
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
    backgroundColor: 'rgba(74, 144, 226, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.25)',
  },
  taskBadge: {
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  subtaskBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.19)',
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
    backgroundColor: 'rgba(74, 144, 226, 0.02)',
  },
  expandButton: {
    padding: THEME.spacing.sm,
    marginRight: THEME.spacing.xs,
    minWidth: 44,
    minHeight: 44,
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
    borderLeftColor: 'rgba(255, 107, 107, 0.25)',
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
    minWidth: 44,
    minHeight: 44,
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
    color: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl * 2,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
  },
  modalCloseButton: {
    padding: THEME.spacing.xs,
  },
  editInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: 100,
    marginBottom: THEME.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: THEME.colors.fill[200],
  },
  modalButtonSave: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  modalButtonCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalButtonSaveText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  checkInBanner: {
    marginBottom: THEME.spacing.md,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  emptyStateCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
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
    width: '100%',
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
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    ...THEME.typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  updateCheckInButton: {
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    gap: 4,
    marginBottom: THEME.spacing.md,
  },
  streakText: {
    ...THEME.typography.caption,
    color: '#FF6B6B',
    fontFamily: THEME.fonts.heading.bold,
  },
  meditationSection: {
    marginBottom: THEME.spacing.lg,
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
  },
  meditationButton: {
    flex: 1,
    minHeight: 120,
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
    padding: THEME.spacing.md,
    alignItems: 'center',
    gap: THEME.spacing.xs,
    minHeight: 120,
    justifyContent: 'center',
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
    color: '#999',
  },
  checkmark: {
    position: 'absolute',
    top: THEME.spacing.xs,
    right: THEME.spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: THEME.colors.fill[100],
    fontSize: 16,
    fontWeight: 'bold',
  },
});
