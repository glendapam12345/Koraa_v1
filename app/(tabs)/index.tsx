import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Platform, RefreshControl } from 'react-native';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { Tooltip } from '@/components/Tooltip';
import { Toast } from '@/components/Toast';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { QuickCheckInModal } from '@/components/QuickCheckInModal';
import { FlowIndicator } from '@/components/FlowIndicator';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ChevronDown, ChevronUp, MoreVertical, Edit, Trash2, X, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { router } from 'expo-router';

type Task = {
  id: string;
  content: string;
  category: string;
  is_completed: boolean;
  parent_task_id: string | null;
  subtasks?: Task[];
};

export default function TodayScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [todayMood, setTodayMood] = useState<string>('');
  const [energy, setEnergy] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousCompletedCount, setPreviousCompletedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const progressWidth = useSharedValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  useEffect(() => {
    loadTasks();
    loadTodayCheckIn();
    
    // Intentar sincronizar datos offline al cargar
    (async () => {
      try {
        const { syncAll } = await import('@/lib/offlineStorage');
        await syncAll();
      } catch (error) {
        // Silencioso, no es crítico
        console.log('Sincronización offline:', error);
      }
    })();

    // Cleanup: limpiar timeout si el componente se desmonta
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadTasks, loadTodayCheckIn]);

  // Verificar si mostrar tooltip después de cargar datos
  useEffect(() => {
    if (!loading && todayMood && tasks.length === 0) {
      // Hay check-in pero no hay tareas priorizadas (primera vez)
      setShowTooltip(true);
    }
  }, [loading, todayMood, tasks.length]);

  // Detectar cuando todas las tareas están completadas
  useEffect(() => {
    if (tasks.length === 0 || loading) return;
    
    const allCompleted = tasks.every(t => t.is_completed);
    const hasTasks = tasks.length > 0;
    const completedCount = tasks.filter(t => t.is_completed).length;
    const wasNotAllCompleted = previousCompletedCount < tasks.length;
    
    if (allCompleted && hasTasks && wasNotAllCompleted && !showConfetti) {
      // ¡Todas las tareas completadas!
      setShowConfetti(true);
      showToast('Hoy está completo. Descansa y disfruta del momento presente ✨', 'success');
      
      // Ocultar confetti después de 4 segundos
      setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
    }
    
    // Actualizar contador de tareas completadas
    setPreviousCompletedCount(completedCount);
  }, [tasks, loading]);

  // Animar barra de progreso cuando cambia el porcentaje
  useEffect(() => {
    const incompleteTasks = tasks.filter(t => !t.is_completed);
    const completedToday = tasks.filter(t => t.is_completed).length;
    const totalPriorityTasks = incompleteTasks.length + completedToday;
    const progressPercentage = totalPriorityTasks > 0 ? (completedToday / totalPriorityTasks) * 100 : 0;
    
    if (!loading && totalPriorityTasks > 0) {
      progressWidth.value = withTiming(progressPercentage, {
        duration: 500,
      });
    }
  }, [tasks, loading]);

  // Estilo animado para la barra de progreso
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando check-in:', error);
        return;
      }

      if (checkIn) {
        setTodayMood(checkIn.emotion.toLowerCase());
        setEnergy(`${checkIn.energy_level}/5`);
        setEnergyLevel(checkIn.energy_level);
        setTime(checkIn.available_time);
      } else {
        setTodayMood('');
        setEnergy('');
        setEnergyLevel(0);
        setTime('');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar todas las tareas prioritarias (principales y subtareas)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_priority', true)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando tareas:', error);
        showToast('No se pudieron cargar las tareas', 'error');
        return;
      }

      if (data) {
        // Separar tareas principales y subtareas
        const mainTasks = data.filter(task => !task.parent_task_id);
        const subtasks = data.filter(task => task.parent_task_id);

        // Agrupar subtareas bajo sus tareas principales
        const tasksWithSubtasks = mainTasks.map(task => {
          const taskSubtasks = subtasks.filter(st => st.parent_task_id === task.id);
          return {
            ...task,
            subtasks: taskSubtasks.length > 0 ? taskSubtasks : undefined,
          };
        });

        setTasks(tasksWithSubtasks);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Ocurrió un error al cargar las tareas', 'error');
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleTask = async (taskId: string, isSubtask: boolean = false, parentTaskId?: string) => {
    const task = isSubtask
      ? tasks.find(t => t.id === parentTaskId)?.subtasks?.find(st => st.id === taskId)
      : tasks.find(t => t.id === taskId);

    if (!task) return;

    const newCompletedState = !task.is_completed;

    // Haptic feedback al completar tarea
    if (Platform.OS !== 'web' && newCompletedState) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error actualizando tarea:', error);
        showToast('No se pudo actualizar la tarea', 'error');
        return;
      }

      // Si se completa una tarea principal, animar fade out después de un delay
      if (newCompletedState && !isSubtask) {
        setTimeout(() => {
          setTasks(prev => prev.filter(t => t.id !== taskId));
        }, 800); // Delay para que el usuario vea la confirmación antes de desaparecer
      }

      // Actualizar estado local y verificar si la tarea principal debe completarse
      if (isSubtask && parentTaskId) {
        // Actualizar subtarea y verificar estado de tarea principal
        const updatedTasks = tasks.map(t => {
          if (t.id === parentTaskId && t.subtasks) {
            const updatedSubtasks = t.subtasks.map(st =>
              st.id === taskId ? { ...st, is_completed: newCompletedState } : st
            );
            
            // Verificar si todas las subtareas están completadas
            const allSubtasksCompleted = updatedSubtasks.every(st => st.is_completed);
            const wasParentCompleted = t.is_completed;
            
            // Si todas las subtareas están completadas y la tarea principal no lo estaba
            if (allSubtasksCompleted && !wasParentCompleted) {
              // Marcar tarea principal como completada en la base de datos
              (async () => {
                try {
                  await supabase
                    .from('tasks')
                    .update({
                      is_completed: true,
                      completed_at: new Date().toISOString(),
                    })
                    .eq('id', parentTaskId);

                  // Limpiar timeout anterior si existe
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                  // Recargar después de actualizar
                  timeoutRef.current = setTimeout(() => {
                    loadTasks();
                    timeoutRef.current = null;
                  }, 200);
                } catch (error) {
                  console.error('Error actualizando tarea principal:', error);
                }
              })();
            } else if (!allSubtasksCompleted && wasParentCompleted) {
              // Desmarcar tarea principal si se desmarcó una subtarea
              (async () => {
                try {
                  await supabase
                    .from('tasks')
                    .update({
                      is_completed: false,
                      completed_at: null,
                    })
                    .eq('id', parentTaskId);

                  // Limpiar timeout anterior si existe
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                  timeoutRef.current = setTimeout(() => {
                    loadTasks();
                    timeoutRef.current = null;
                  }, 200);
                } catch (error) {
                  console.error('Error actualizando tarea principal:', error);
                }
              })();
            }
            
            return {
              ...t,
              subtasks: updatedSubtasks,
              is_completed: allSubtasksCompleted,
            };
          }
          return t;
        });
        
        setTasks(updatedTasks);
      } else {
        // Actualizar tarea principal
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, is_completed: newCompletedState } : t
        ));
      }
      // Cerrar menú si estaba abierto
      setMenuOpen(null);
      
      // Recargar tareas para obtener el estado actualizado
      await loadTasks();
      
      // Mostrar toast de éxito
      if (newCompletedState) {
        showToast('¡Tarea completada!', 'success');
      } else {
        showToast('Tarea marcada como pendiente', 'info');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Ocurrió un error al actualizar la tarea', 'error');
      // Cerrar menú en caso de error
      setMenuOpen(null);
    }
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

  const CATEGORIES = [
    { id: 'trabajo', label: '💼 Trabajo', color: '#4A90E2' },
    { id: 'salud', label: '❤️ Salud', color: '#FF6B6B' },
    { id: 'personal', label: '👤 Personal', color: '#9B59B6' },
  ];

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditContent(task.content);
    setEditCategory(task.category || '');
    setMenuOpen(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          content: editContent.trim(),
          category: editCategory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error actualizando tarea:', error);
        showToast('No se pudo actualizar la tarea', 'error');
        return;
      }

      // Recargar tareas para asegurar sincronización completa (incluye subtareas si las hay)
      await loadTasks();

      setEditingTask(null);
      setEditContent('');
      setEditCategory('');
      showToast('Tarea actualizada correctamente', 'success');
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Ocurrió un error al actualizar la tarea', 'error');
    }
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
                const subtaskIds = task.subtasks.map(st => st.id);
                const { error: subtasksError } = await supabase
                  .from('tasks')
                  .delete()
                  .in('id', subtaskIds);

                if (subtasksError) {
                  console.error('Error eliminando subtareas:', subtasksError);
                  showToast('No se pudieron eliminar las subtareas. La tarea principal no se eliminó.', 'error');
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
                console.error('Error eliminando tarea:', error);
                showToast('No se pudo eliminar la tarea', 'error');
                setMenuOpen(null);
                return;
              }

              // Actualizar estado local
              setTasks(tasks.filter(t => t.id !== task.id));
              setMenuOpen(null);
              showToast('Tarea eliminada correctamente', 'success');
            } catch (error) {
              console.error('Error inesperado:', error);
              showToast('Ocurrió un error al eliminar la tarea', 'error');
              setMenuOpen(null);
            }
          },
        },
      ]
    );
  };

  // Calcular tareas completadas y no completadas (solo tareas principales, no subtareas) - Memoizado
  const incompleteTasks = useMemo(() => tasks.filter(t => !t.is_completed), [tasks]);
  const completedToday = useMemo(() => tasks.filter(t => t.is_completed).length, [tasks]);
  const totalPriorityTasks = useMemo(() => incompleteTasks.length + completedToday, [incompleteTasks.length, completedToday]);
  const progressPercentage = useMemo(() => 
    totalPriorityTasks > 0 ? (completedToday / totalPriorityTasks) * 100 : 0,
    [completedToday, totalPriorityTasks]
  );

  // Función para obtener mensaje explicativo basado en energía y emoción - Memoizada
  const getPriorityExplanation = useCallback(() => {
    if (!todayMood || energyLevel === 0) {
      return {
        title: 'Tu plan de hoy',
        message: 'Primero agrega tus tareas en "Vaciar", luego haz tu check-in en "Sentir" para ver tus prioridades basadas en cómo te sientes.',
        suggestion: 'Flujo sugerido: Vaciar → Sentir → Hoy',
        reasoning: null,
      };
    }

    const negativeEmotions = ['agotada', 'ansiosa', 'abrumada'];
    const isNegativeEmotion = negativeEmotions.includes(todayMood.toLowerCase());

    const emotionLabel = todayMood.charAt(0).toUpperCase() + todayMood.slice(1);
    const priorityCount = incompleteTasks.length;

    // Razonamiento emocional claro del "por qué"
    let reasoning = '';
    let suggestion = '';
    
    if (energyLevel <= 2 || isNegativeEmotion) {
      reasoning = `Con energía ${energyLevel}/5 y sintiéndote ${emotionLabel}, tu cuerpo y mente necesitan menos presión. Por eso priorizamos solo ${priorityCount} ${priorityCount === 1 ? 'tarea esencial' : 'tareas esenciales'} para hoy.`;
      suggestion = 'Menos es más cuando tu energía está baja. Enfócate en lo esencial.';
    } else if (energyLevel === 3) {
      reasoning = `Con energía moderada (${energyLevel}/5) y sintiéndote ${emotionLabel}, puedes manejar ${priorityCount} ${priorityCount === 1 ? 'tarea prioritaria' : 'tareas prioritarias'} sin sobrecargarte.`;
      suggestion = 'Tienes energía moderada. Prioriza lo importante.';
    } else if (energyLevel >= 4) {
      reasoning = `¡Tienes energía alta (${energyLevel}/5) y te sientes ${emotionLabel}! Por eso priorizamos ${priorityCount} ${priorityCount === 1 ? 'tarea' : 'tareas'} para que aproveches este momento de energía.`;
      suggestion = '¡Tienes energía para más! Aprovecha este momento.';
    }

    return {
      title: 'Tu plan de hoy',
      message: `Con tu energía de ${energyLevel}/5 y sintiéndote ${emotionLabel}, te sugerimos enfocarte en ${priorityCount} ${priorityCount === 1 ? 'tarea prioritaria' : 'tareas prioritarias'} hoy.`,
      suggestion,
      reasoning,
    };
  }, [todayMood, energyLevel, incompleteTasks.length]);

  const explanation = useMemo(() => getPriorityExplanation(), [getPriorityExplanation]);

  // Función para manejar pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadTasks(),
        loadTodayCheckIn(),
      ]);
    } catch (error) {
      console.error('Error al refrescar:', error);
      showToast('Error al actualizar los datos', 'error');
    } finally {
      setRefreshing(false);
    }
  };

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
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.moodCard}
        >
          <View style={styles.moodHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.moodLabel}>Hoy te sientes</Text>
              <Text style={styles.moodTitle}>
                {loading ? 'Cargando...' : todayMood || 'Aún no has hecho tu check-in'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                loadTasks();
                loadTodayCheckIn();
              }}
            >
              <RefreshCw size={20} color={THEME.colors.fill[100]} />
            </TouchableOpacity>
          </View>
          {!loading && (energy || time) && (
            <View style={styles.moodStats}>
              {energy && <Text style={styles.moodStat}>Energía: {energy}</Text>}
              {time && <Text style={styles.moodStat}>{time}</Text>}
            </View>
          )}
          
          {/* Botón de check-in rápido */}
          {!loading && (
            <TouchableOpacity
              style={styles.quickCheckInButton}
              onPress={() => {
                if (todayMood) {
                  // Si ya hay check-in, ir a la pantalla completa para actualizar
                  router.push('/(tabs)/sentir');
                } else {
                  // Si no hay check-in, abrir modal rápido
                  setShowQuickCheckIn(true);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.quickCheckInButtonText}>
                {todayMood ? 'Actualizar cómo me siento' : '¿Cómo te sientes hoy?'}
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.section}>
          {/* Indicador de flujo */}
          {!loading && (
            <FlowIndicator currentStep="accionar" />
          )}
          <Text style={styles.sectionTitle}>{explanation.title}</Text>
          
          {/* Banner de recordatorio de check-in */}
          {!loading && !todayMood && (
            <TouchableOpacity
              style={styles.checkInBanner}
              onPress={() => router.push('/onboarding/emotion')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.pink, THEME.colors.gradient.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkInBannerGradient}
              >
                <Text style={styles.checkInBannerText}>
                  💭 Haz tu check-in diario para ver tus prioridades
                </Text>
                <Text style={styles.checkInBannerSubtext}>
                  Toca para comenzar →
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {/* Mensaje explicativo con razonamiento emocional */}
          {incompleteTasks.length > 0 && explanation.reasoning && (
            <View style={styles.explanationCard}>
              <Text style={styles.explanationText}>
                {explanation.message}
              </Text>
              <Text style={styles.explanationReasoning}>
                {explanation.reasoning}
              </Text>
              {explanation.suggestion && (
                <Text style={styles.explanationSuggestion}>
                  {explanation.suggestion}
                </Text>
              )}
            </View>
          )}
          
          {/* Mensaje explicativo sin razonamiento (cuando no hay check-in) */}
          {incompleteTasks.length > 0 && !explanation.reasoning && (
            <View style={styles.explanationCard}>
              <Text style={styles.explanationText}>
                {explanation.message}
              </Text>
              {explanation.suggestion && (
                <Text style={styles.explanationSuggestion}>
                  {explanation.suggestion}
                </Text>
              )}
            </View>
          )}

          {/* Mensaje cuando hay check-in pero no hay tareas */}
          {todayMood && incompleteTasks.length === 0 && tasks.length === 0 && (
            <TouchableOpacity
              style={styles.explanationCard}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.7}
            >
              <Text style={styles.explanationText}>
                Ya hiciste tu check-in, pero aún no tienes tareas.{'\n'}
                Ve a <Text style={styles.flowGuideAccent}>Vaciar</Text> para agregar lo que necesitas hacer hoy.
              </Text>
            </TouchableOpacity>
          )}

          {/* Guía contextual cuando hay tareas pero no hay check-in */}
          {!todayMood && incompleteTasks.length > 0 && (
            <View style={styles.flowGuide}>
              <Text style={styles.flowGuideText}>
                💡 Ve a <Text style={styles.flowGuideAccent}>Sentir</Text> para que Kora priorice estas tareas según cómo te sientes hoy
              </Text>
            </View>
          )}

          {/* Resumen diario */}
          {todayMood && totalPriorityTasks > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Emoción</Text>
                  <Text style={styles.summaryValue}>{todayMood}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Energía</Text>
                  <Text style={styles.summaryValue}>{energyLevel}/5</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Completadas</Text>
                  <Text style={styles.summaryValue}>
                    {completedToday}/{totalPriorityTasks}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Indicador de progreso */}
          {totalPriorityTasks > 0 && (
            <View style={styles.progressIndicator}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Progreso de hoy
                </Text>
                <Text style={styles.progressCount}>
                  {completedToday} de {totalPriorityTasks}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill,
                      animatedProgressStyle
                    ]} 
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.tasksContainer}>
          {loadingTasks ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Sparkles size={48} color={THEME.colors.gradient.blue} />
              </View>
              <Text style={styles.emptyTitle}>
                {todayMood 
                  ? 'No hay tareas priorizadas'
                  : 'Comienza tu día'
                }
              </Text>
              <Text style={styles.emptyText}>
                {todayMood 
                  ? 'Ve a "Vaciar" para agregar tus pendientes y Kora los priorizará automáticamente.'
                  : 'Agrega tus tareas en "Vaciar", luego haz tu check-in en "Sentir" para ver tus prioridades basadas en cómo te sientes.'
                }
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/vaciar')}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyButtonText}>
                  {todayMood ? 'Agregar tareas →' : 'Comenzar →'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            (() => {
              // Separar tareas completadas y no completadas (ya calculado arriba)
              const completedTasks = tasks.filter(t => t.is_completed);
              const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.is_completed);
              
              // Mostrar mensaje de paz cuando todas las tareas están completadas
              if (allTasksCompleted) {
                return (
                  <View style={styles.completionState}>
                    <View style={styles.completionIconContainer}>
                      <Text style={styles.completionEmoji}>✨</Text>
                    </View>
                    <Text style={styles.completionTitle}>
                      Hoy está completo
                    </Text>
                    <Text style={styles.completionMessage}>
                      Has completado todas tus tareas prioritarias.{'\n'}
                      Es momento de descansar y disfrutar del momento presente.
                    </Text>
                    <Text style={styles.completionAccent}>
                      Descansa
                    </Text>
                  </View>
                );
              }
              
              const renderTask = (task: Task, index: number, isCompleted: boolean) => {
                const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                const isExpanded = expandedTasks.has(task.id);
                const completedSubtasks = hasSubtasks 
                  ? task.subtasks!.filter(st => st.is_completed).length 
                  : 0;
                const totalSubtasks = hasSubtasks ? task.subtasks!.length : 0;
                const subtasksProgress = totalSubtasks > 0 
                  ? (completedSubtasks / totalSubtasks) * 100 
                  : 0;

                return (
                  <View key={task.id} style={styles.taskWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        if (hasSubtasks) {
                          toggleTaskExpansion(task.id);
                        } else {
                          toggleTask(task.id);
                        }
                        setMenuOpen(null); // Cerrar menú al hacer clic en la tarea
                      }}
                      style={[
                        styles.taskCard,
                        isCompleted && styles.taskCardCompleted,
                        hasSubtasks && styles.taskCardWithSubtasks,
                        isCompleted && { opacity: 0.5 },
                      ]}
                      activeOpacity={0.7}
                    >
                      {/* Número de prioridad (solo para tareas no completadas) */}
                      {!isCompleted && (
                        <View style={styles.priorityNumberContainer}>
                          <View style={styles.priorityNumber}>
                            <Text style={styles.priorityNumberText}>{index + 1}</Text>
                          </View>
                        </View>
                      )}

                      {/* Botón expandir/colapsar si tiene subtareas */}
                      {hasSubtasks && (
                        <TouchableOpacity
                          onPress={() => toggleTaskExpansion(task.id)}
                          style={styles.expandButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {isExpanded ? (
                            <ChevronUp size={20} color={THEME.colors.text.secondary} />
                          ) : (
                            <ChevronDown size={20} color={THEME.colors.text.secondary} />
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => toggleTask(task.id)}
                        style={styles.taskCheckbox}
                        activeOpacity={0.7}
                      >
                        {task.is_completed && <View style={styles.taskCheckboxChecked} />}
                      </TouchableOpacity>
                      
                      <View style={styles.taskContent}>
                        <Text style={[
                          styles.taskText,
                          isCompleted && styles.taskTextCompleted,
                        ]}>
                          {task.content}
                        </Text>
                        
                        {/* Indicador de progreso de subtareas */}
                        {hasSubtasks && !isCompleted && (
                          <View style={styles.subtasksProgressContainer}>
                            <View style={styles.subtasksProgressBar}>
                              <View 
                                style={[
                                  styles.subtasksProgressFill,
                                  { width: `${subtasksProgress}%` }
                                ]} 
                              />
                            </View>
                            <Text style={styles.subtasksProgressText}>
                              {completedSubtasks} de {totalSubtasks} completadas
                            </Text>
                          </View>
                        )}
                        
                        {task.category && (
                          <View style={[
                            styles.categoryBadge,
                            { backgroundColor: getCategoryColor(task.category) + '20' },
                          ]}>
                            <Text style={[
                              styles.categoryText,
                              { color: getCategoryColor(task.category) },
                            ]}>
                              {task.category}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Botón de menú */}
                      <TouchableOpacity
                        onPress={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
                        style={styles.menuButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MoreVertical size={20} color={THEME.colors.text.secondary} />
                      </TouchableOpacity>

                    </TouchableOpacity>

                    {/* Menú desplegable */}
                    {menuOpen === task.id && (
                      <View style={styles.menuDropdown}>
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => handleEditTask(task)}
                        >
                          <Edit size={18} color={THEME.colors.text.main} />
                          <Text style={styles.menuItemText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.menuItem, styles.menuItemDanger]}
                          onPress={() => handleDeleteTask(task)}
                        >
                          <Trash2 size={18} color="#FF6B6B" />
                          <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Renderizar subtareas si está expandido */}
                    {hasSubtasks && isExpanded && (
                      <View style={styles.subtasksContainer}>
                        {task.subtasks!.map((subtask) => (
                          <TouchableOpacity
                            key={subtask.id}
                            onPress={() => toggleTask(subtask.id, true, task.id)}
                            style={[
                              styles.subtaskCard,
                              subtask.is_completed && styles.subtaskCardCompleted,
                            ]}
                            activeOpacity={0.7}
                          >
                            <View style={styles.subtaskCheckbox}>
                              {subtask.is_completed && (
                                <View style={styles.subtaskCheckboxChecked} />
                              )}
                            </View>
                            <Text style={[
                              styles.subtaskText,
                              subtask.is_completed && styles.subtaskTextCompleted,
                            ]}>
                              {subtask.content}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              };
              
              return (
                <>
                  {/* Tareas no completadas con números */}
                  {incompleteTasks.map((task, index) => renderTask(task, index + 1, false))}
                  
                  {/* Tareas completadas sin números */}
                  {completedTasks.map((task, index) => renderTask(task, index + 1, true))}
                </>
              );
            })()
          )}
        </View>
      </ScrollView>

      {/* Overlay para cerrar menú al hacer clic fuera */}
      {menuOpen && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(null)}
        />
      )}

      {/* Modal de edición */}
      <Modal
        visible={editingTask !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setEditingTask(null);
          setEditContent('');
          setEditCategory('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar tarea</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingTask(null);
                  setEditContent('');
                  setEditCategory('');
                }}
                style={styles.modalCloseButton}
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Contenido de la tarea"
              placeholderTextColor={THEME.colors.text.secondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.editLabel}>Categoría (opcional)</Text>
            <View style={styles.editCategoriesGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setEditCategory(
                    editCategory === category.id ? '' : category.id
                  )}
                  style={[
                    styles.editCategoryChip,
                    editCategory === category.id && {
                      backgroundColor: category.color + '20',
                      borderColor: category.color,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.editCategoryChipText,
                    editCategory === category.id && { color: category.color },
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setEditingTask(null);
                  setEditContent('');
                  setEditCategory('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveEdit}
                disabled={!editContent.trim()}
              >
                <Text style={styles.modalButtonSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Confetti celebración */}
      {showConfetti && <ConfettiCelebration />}
      
      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage(null)}
        />
      )}
      
      <Tooltip
        visible={showTooltip}
        title="Tus prioridades de hoy"
        message="Aquí verás tus tareas priorizadas automáticamente según cómo te sientes. Kora adapta el número de tareas según tu energía y emoción. Marca las tareas como completadas cuando las termines."
        onClose={() => setShowTooltip(false)}
      />
      
      {/* Modal de check-in rápido */}
      <QuickCheckInModal
        visible={showQuickCheckIn}
        onClose={() => setShowQuickCheckIn(false)}
      />
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
  },
  moodStat: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
  },
  section: {
    marginBottom: THEME.spacing.md,
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
  tasksContainer: {
    gap: THEME.spacing.sm,
  },
  emptyState: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
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
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  expandButton: {
    padding: THEME.spacing.xs,
    marginRight: THEME.spacing.xs,
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
  subtaskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
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
    padding: THEME.spacing.xs,
    marginLeft: THEME.spacing.xs,
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
  editLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  editCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
  },
  editCategoryChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  editCategoryChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
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
});
