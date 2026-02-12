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
import { supabase, getErrorMessage } from '@/lib/supabase';
import { detectCategory } from '@/lib/categoryDetection';
import { RefreshCw, ChevronDown, ChevronUp, MoreVertical, Edit, Trash2, X, Sparkles, CheckCircle2, Plus, Flame, Sunrise, Moon } from 'lucide-react-native';
import { router } from 'expo-router';
import { MeditationCircle } from '@/components/MeditationCircle';

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
  const [focusLevel, setFocusLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
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
  const progressWidth = useSharedValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingTasksRef = useRef<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time, focus_level')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando check-in:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        return;
      }

      if (checkIn) {
        setTodayMood(checkIn.emotion.toLowerCase());
        setEnergy(`${checkIn.energy_level}/5`);
        setEnergyLevel(checkIn.energy_level);
        setTime(checkIn.available_time);
        setFocusLevel(checkIn.focus_level || '');
      } else {
        setTodayMood('');
        setEnergy('');
        setEnergyLevel(0);
        setTime('');
        setFocusLevel('');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
        checkIns.forEach((checkIn) => {
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
      console.error('Error cargando racha:', error);
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
        setMorningMeditationDone(meditations.some(m => m.type === 'morning'));
        setEveningMeditationDone(meditations.some(m => m.type === 'evening'));
      }
    } catch (error) {
      console.error('Error cargando meditaciones:', error);
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
        console.error('Error guardando meditación:', error);
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
      console.error('Error inesperado:', error);
      showToast('Ocurrió un error', 'error');
    }
  };

  const handleStartMeditation = (type: 'morning' | 'evening') => {
    setMeditationType(type);
    setShowMeditation(true);
  };

  const loadTasks = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isLoadingTasksRef.current) {
      return;
    }
    
    try {
      isLoadingTasksRef.current = true;
      setLoadingTasks(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        isLoadingTasksRef.current = false;
        setLoadingTasks(false);
        return;
      }

      // Verificar si hay check-in hoy antes de cargar tareas priorizadas
      const today = new Date().toISOString().split('T')[0];
      const { data: checkInData } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      // Si no hay check-in, no cargar tareas priorizadas (mostrar vacío)
      if (!checkInData) {
        setTasks([]);
        setLoadingTasks(false);
        return;
      }

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
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
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
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      isLoadingTasksRef.current = false;
      setLoadingTasks(false);
    }
  }, [showToast]);

  const loadPrioritizationMetadata = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const stored = await AsyncStorage.getItem(`prioritization_${user.id}_${today}`);
      
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today) {
          setTotalTasksBefore(data.totalTasksBefore);
        } else {
          setTotalTasksBefore(null);
        }
      } else {
        setTotalTasksBefore(null);
      }
    } catch (error) {
      console.error('Error cargando metadata:', error);
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
        console.log('Sincronización offline:', error);
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
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        // Revertir cambio optimista
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, is_completed: !newCompletedState } : t
        ));
        return;
      }

      // Si se completa una tarea principal, animar fade out después de un delay
      if (newCompletedState && !isSubtask) {
        // Usar animación más suave con Animated
        const fadeTimeout = setTimeout(() => {
          setTasks(prev => prev.filter(t => t.id !== taskId));
        }, 600); // Delay reducido para mejor UX
        
        // Limpiar timeout si el componente se desmonta (aunque es poco probable)
        // Nota: Este timeout es corto y no crítico, pero es buena práctica limpiarlo
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
                    loadTasks().catch(() => {
                      // Silenciar errores de recarga en background
                    });
                    timeoutRef.current = null;
                  }, 200);
                } catch (error) {
                  console.error('Error actualizando tarea principal:', error);
                  // Revertir cambio optimista si falla
                  setTasks(prevTasks => prevTasks.map(t => {
                    if (t.id === parentTaskId && t.subtasks) {
                      const revertedSubtasks = t.subtasks.map(st =>
                        st.id === taskId ? { ...st, is_completed: !newCompletedState } : st
                      );
                      return {
                        ...t,
                        subtasks: revertedSubtasks,
                        is_completed: !allSubtasksCompleted,
                      };
                    }
                    return t;
                  }));
                  const errorMessage = getErrorMessage(error);
                  showToast(`Error: ${errorMessage}`, 'error');
                }
              })();
            } else if (!allSubtasksCompleted && wasParentCompleted) {
              // Desmarcar tarea principal si se desmarcó una subtarea
              (async () => {
                try {
                  const { error: updateError } = await supabase
                    .from('tasks')
                    .update({
                      is_completed: false,
                      completed_at: null,
                    })
                    .eq('id', parentTaskId);

                  if (updateError) {
                    throw updateError;
                  }

                  // Limpiar timeout anterior si existe
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                  timeoutRef.current = setTimeout(() => {
                    loadTasks().catch(() => {
                      // Silenciar errores de recarga en background
                    });
                    timeoutRef.current = null;
                  }, 200);
                } catch (error) {
                  console.error('Error actualizando tarea principal:', error);
                  // Revertir cambio optimista si falla
                  setTasks(prevTasks => prevTasks.map(t => {
                    if (t.id === parentTaskId && t.subtasks) {
                      const revertedSubtasks = t.subtasks.map(st =>
                        st.id === taskId ? { ...st, is_completed: !newCompletedState } : st
                      );
                      return {
                        ...t,
                        subtasks: revertedSubtasks,
                        is_completed: allSubtasksCompleted,
                      };
                    }
                    return t;
                  }));
                  const errorMessage = getErrorMessage(error);
                  showToast(`Error: ${errorMessage}`, 'error');
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
      
      // No recargar inmediatamente - la actualización optimista ya se hizo
      // Solo recargar si hay subtareas para sincronizar estado de tarea principal
      if (!isSubtask || !parentTaskId) {
        // Recargar en background para sincronizar (sin bloquear UI)
        setTimeout(() => {
          loadTasks().catch(() => {
            // Silenciar errores de recarga en background
          });
        }, 500);
      }
      
      // Mostrar toast de éxito con mensajes más engaging
      if (newCompletedState) {
        const completedCount = tasks.filter(t => t.is_completed).length + 1;
        const totalCount = tasks.length;
        const progressPercentage = Math.round((completedCount / totalCount) * 100);
        
        // Mensajes motivacionales según progreso
        let message = '¡Tarea completada!';
        if (progressPercentage >= 50 && progressPercentage < 100) {
          message = `¡Vas bien! ${progressPercentage}% completado ✨`;
        } else if (progressPercentage === 100) {
          message = '¡Día completo! Descansa y disfruta 🌟';
        }
        
        showToast(message, 'success');
        // Haptic feedback para aumentar engagement
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        showToast('Tarea marcada como pendiente', 'info');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

  // Categorías ahora son invisibles - se detectan automáticamente

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditContent(task.content);
    setMenuOpen(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editContent.trim()) return;

    try {
      // Detectar categoría automáticamente basada en el contenido editado
      const detectedCategory = detectCategory(editContent.trim());
      
      const { error } = await supabase
        .from('tasks')
        .update({
          content: editContent.trim(),
          category: detectedCategory || editingTask.category || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error actualizando tarea:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        return;
      }

      // Actualización optimista - actualizar estado local inmediatamente
      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            content: editContent.trim(),
            category: detectedCategory || editingTask.category || '',
          };
        }
        // Actualizar también en subtareas si existe
        if (t.subtasks) {
          const updatedSubtasks = t.subtasks.map(st =>
            st.id === editingTask.id ? {
              ...st,
              content: editContent.trim(),
              category: detectedCategory || editingTask.category || '',
            } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      }));

        // Recargar en background para sincronizar (sin bloquear UI)
        // Limpiar timeout anterior si existe
        if (backgroundLoadTimeoutRef.current) {
          clearTimeout(backgroundLoadTimeoutRef.current);
        }
        backgroundLoadTimeoutRef.current = setTimeout(() => {
          if (!isLoadingTasksRef.current) {
            isLoadingTasksRef.current = true;
            loadTasks()
              .catch(() => {
                // Silenciar errores de recarga en background
              })
              .finally(() => {
                isLoadingTasksRef.current = false;
                backgroundLoadTimeoutRef.current = null;
              });
          }
        }, 300);

      setEditingTask(null);
      setEditContent('');
      showToast('Tarea actualizada correctamente', 'success');
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
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
                console.error('Error eliminando tarea:', error);
                const errorMessage = getErrorMessage(error);
                showToast(errorMessage, 'error');
                setMenuOpen(null);
                return;
              }

              // Actualización optimista - remover de la lista inmediatamente
              setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
              setMenuOpen(null);
              showToast('Tarea eliminada correctamente', 'success');
            } catch (error) {
              console.error('Error inesperado:', error);
              const errorMessage = getErrorMessage(error);
              showToast(errorMessage, 'error');
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
        const smartPrioritization = require('@/lib/smartPrioritization');
        if (smartPrioritization?.generatePrioritizationExplanation) {
          const explanation = smartPrioritization.generatePrioritizationExplanation(
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
        }
      } catch (error) {
        console.log('Error generando explicación inteligente:', error);
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

  const explanation = useMemo(() => getPriorityExplanation(), [getPriorityExplanation]);

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
        {/* Racha sutil en la parte superior */}
        {!loading && currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Flame size={18} color="#FF6B6B" />
            <Text style={styles.streakText}>{currentStreak}</Text>
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
                  <Sunrise size={28} color={morningMeditationDone ? '#999' : THEME.colors.fill[100]} />
                  <Text style={[
                    styles.meditationButtonText,
                    morningMeditationDone && styles.meditationButtonTextDone
                  ]}>
                    {morningMeditationDone ? 'Mañana completada' : 'Iniciar el día'}
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
                  <Moon size={28} color={eveningMeditationDone ? '#999' : THEME.colors.fill[100]} />
                  <Text style={[
                    styles.meditationButtonText,
                    eveningMeditationDone && styles.meditationButtonTextDone
                  ]}>
                    {eveningMeditationDone ? 'Noche completada' : 'Terminar el día'}
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

        {/* Guía visual del flujo completo cuando no hay check-in */}
        {!loading && !todayMood && (
          <>
            <View style={styles.flowGuideCard}>
              <Text style={styles.flowGuideCardTitle}>Tu flujo de trabajo</Text>
              <View style={styles.flowStepsContainer}>
                <View style={styles.flowStep}>
                  <View style={[styles.flowStepNumber, styles.flowStepNumberActive]}>
                    <Text style={[styles.flowStepNumberText, styles.flowStepNumberTextActive]}>1</Text>
                  </View>
                  <Text style={styles.flowStepLabel}>Vaciar</Text>
                  <Text style={styles.flowStepDescription}>Agrega tus tareas</Text>
                </View>
                <View style={styles.flowArrow}>
                  <Text style={styles.flowArrowText}>→</Text>
                </View>
                <View style={styles.flowStep}>
                  <View style={styles.flowStepNumber}>
                    <Text style={styles.flowStepNumberText}>2</Text>
                  </View>
                  <Text style={styles.flowStepLabel}>Sentir</Text>
                  <Text style={styles.flowStepDescription}>Registra cómo te sientes</Text>
                </View>
                <View style={styles.flowArrow}>
                  <Text style={styles.flowArrowText}>→</Text>
                </View>
                <View style={styles.flowStep}>
                  <View style={styles.flowStepNumber}>
                    <Text style={styles.flowStepNumberText}>3</Text>
                  </View>
                  <Text style={styles.flowStepLabel}>Accionar</Text>
                  <Text style={styles.flowStepDescription}>Tus tareas priorizadas</Text>
                </View>
              </View>
            </View>

            {/* Botón principal: ¿Cómo te sientes hoy? */}
            <TouchableOpacity
              style={styles.mainRegisterButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/sentir');
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainRegisterButtonGradient}
              >
                <View style={styles.mainRegisterIcon}>
                  <Sparkles size={64} color={THEME.colors.fill[100]} />
                </View>
                <Text style={styles.mainRegisterText}>
                  ¿Cómo te sientes hoy?
                </Text>
                <Text style={styles.mainRegisterSubtext}>
                  Toca para registrar y organizar tu día
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Si hay check-in pero no hay tareas */}
        {!loading && todayMood && tasks.length === 0 && (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              Ya registraste cómo te sientes hoy
            </Text>
            <Text style={styles.emptyStateEmotion}>
              {todayMood.charAt(0).toUpperCase() + todayMood.slice(1)}
            </Text>
            <Text style={styles.emptyStateMessage}>
              Agrega tus tareas para que Kora las priorice según cómo te sientes
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.pink, THEME.colors.gradient.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.secondaryButtonGradient}
              >
                <Plus size={24} color="#FFFFFF" />
                <View style={styles.secondaryButtonContent}>
                  <Text style={styles.secondaryButtonText}>
                    Vacía tus pendientes
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Si hay check-in y tareas: mostrar tarjeta de mood normal */}
        {!loading && todayMood && tasks.length > 0 && (
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
                  {todayMood.charAt(0).toUpperCase() + todayMood.slice(1)}
                </Text>
              </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                loadTasks();
                loadTodayCheckIn();
              }}
              accessibilityRole="button"
              accessibilityLabel="Actualizar información"
              accessibilityHint="Recarga el check-in y las tareas del día"
            >
              <RefreshCw size={20} color={THEME.colors.fill[100]} />
            </TouchableOpacity>
            </View>
            {energy || time || focusLevel ? (
              <View style={styles.moodStats}>
                {energy && (
                  <View style={styles.moodStatItem}>
                    <Text style={styles.moodStatLabel}>Energía</Text>
                    <Text style={styles.moodStatValue}>{energy}</Text>
                  </View>
                )}
                {time && (
                  <View style={styles.moodStatItem}>
                    <Text style={styles.moodStatLabel}>Tiempo disponible</Text>
                    <Text style={styles.moodStatValue}>{time}</Text>
                  </View>
                )}
                {focusLevel && (
                  <View style={styles.moodStatItem}>
                    <Text style={styles.moodStatLabel}>Enfoque</Text>
                    <Text style={styles.moodStatValue}>{focusLevel}</Text>
                  </View>
                )}
              </View>
            ) : null}
            
            {/* Botón para actualizar check-in */}
            <TouchableOpacity
              style={styles.updateCheckInButton}
              onPress={() => router.push('/(tabs)/sentir')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Actualizar cómo me siento"
              accessibilityHint="Abre la pantalla para actualizar tu estado emocional del día"
            >
              <Text style={styles.updateCheckInButtonText}>
                Actualizar cómo me siento
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <View style={styles.section}>
          {/* Indicador de flujo - solo si hay check-in */}
          {!loading && todayMood && (
            <FlowIndicator currentStep="accionar" />
          )}
          
          {/* Mensaje explicativo con razonamiento emocional - solo si hay check-in y tareas */}
          {todayMood && tasks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{explanation.title}</Text>
              
              {/* Validación de valor: Comparación antes/después - Mejorado para engagement */}
              {totalTasksBefore !== null && totalTasksBefore > 0 && (
                <View style={styles.valueCard}>
                  <View style={styles.valueHeader}>
                    <Sparkles size={20} color={THEME.colors.gradient.blue} />
                    <Text style={styles.valueTitle}>Tu día organizado</Text>
                  </View>
                  <View style={styles.valueRow}>
                    <Text style={styles.valueLabel}>Tareas totales:</Text>
                    <Text style={styles.valueNumber}>{totalTasksBefore}</Text>
                  </View>
                  <View style={styles.valueRow}>
                    <Text style={styles.valueLabel}>Priorizadas para hoy:</Text>
                    <Text style={styles.valueNumberHighlight}>{tasks.length}</Text>
                  </View>
                  {totalTasksBefore > tasks.length ? (
                    <Text style={styles.valueMessage}>
                      Reducimos {totalTasksBefore - tasks.length} tarea{totalTasksBefore - tasks.length !== 1 ? 's' : ''} para enfocarte en lo esencial según cómo te sientes hoy
                    </Text>
                  ) : (
                    <Text style={styles.valueMessage}>
                      Todas tus tareas son relevantes para hoy. ¡Perfecto! 🎯
                    </Text>
                  )}
                </View>
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
            </>
          )}


          {/* Guía contextual cuando hay tareas pero no hay check-in */}
          {!todayMood && incompleteTasks.length > 0 && (
            <View style={styles.flowGuide}>
              <Text style={styles.flowGuideText}>
                💡 Ve a <Text style={styles.flowGuideAccent}>Sentir</Text> para que Kora priorice estas tareas según cómo te sientes hoy
              </Text>
            </View>
          )}

          {/* Resumen diario - Mejorado para engagement */}
          {todayMood && totalPriorityTasks > 0 && (
            <View style={[styles.summaryCard, styles.engagementCard]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Emoción</Text>
                  <Text style={styles.summaryValue}>
                    {todayMood ? todayMood.charAt(0).toUpperCase() + todayMood.slice(1) : '-'}
                  </Text>
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
            <View style={styles.loadingContainer}>
              {/* Skeleton loaders para tareas */}
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonTask}>
                  <View style={styles.skeletonCheckbox} />
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonLine} />
                    <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
                  </View>
                </View>
              ))}
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
                      accessibilityRole="button"
                      accessibilityLabel={isCompleted ? `Tarea completada: ${task.content}` : `Tarea ${index + 1}: ${task.content}`}
                      accessibilityHint={hasSubtasks ? "Doble toque para expandir o colapsar subtareas" : "Doble toque para marcar como completada"}
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
                          accessibilityRole="button"
                          accessibilityLabel={isExpanded ? "Colapsar subtareas" : "Expandir subtareas"}
                          accessibilityHint={`Tiene ${totalSubtasks} subtareas, ${completedSubtasks} completadas`}
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
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: task.is_completed }}
                        accessibilityLabel={task.is_completed ? "Marcar como no completada" : "Marcar como completada"}
                        accessibilityHint={`Tarea: ${task.content}`}
                      >
                        {task.is_completed && <View style={styles.taskCheckboxChecked} />}
                      </TouchableOpacity>
                      
                      <View style={styles.taskContent}>
                        {/* Badge de tipo de tarea */}
                        <View style={styles.taskTypeContainer}>
                          {hasSubtasks ? (
                            <View style={[styles.taskTypeBadge, styles.projectBadge]}>
                              <Text style={styles.taskTypeIcon}>📁</Text>
                              <Text style={styles.taskTypeText}>Proyecto</Text>
                            </View>
                          ) : task.parent_task_id ? (
                            <View style={[styles.taskTypeBadge, styles.subtaskBadge]}>
                              <Text style={styles.taskTypeIcon}>└</Text>
                              <Text style={styles.taskTypeText}>Subtarea</Text>
                            </View>
                          ) : (
                            <View style={[styles.taskTypeBadge, styles.taskBadge]}>
                              <Text style={styles.taskTypeIcon}>✓</Text>
                              <Text style={styles.taskTypeText}>Tarea</Text>
                            </View>
                          )}
                        </View>

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
                        accessibilityRole="button"
                        accessibilityLabel="Opciones de tarea"
                        accessibilityHint="Abre menú para editar o eliminar esta tarea"
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
                          accessibilityRole="button"
                          accessibilityLabel="Editar tarea"
                        >
                          <Edit size={18} color={THEME.colors.text.main} />
                          <Text style={styles.menuItemText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.menuItem, styles.menuItemDanger]}
                          onPress={() => handleDeleteTask(task)}
                          accessibilityRole="button"
                          accessibilityLabel="Eliminar tarea"
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
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: subtask.is_completed }}
                            accessibilityLabel={subtask.is_completed ? `Subtarea completada: ${subtask.content}` : `Subtarea: ${subtask.content}`}
                            accessibilityHint="Doble toque para marcar como completada"
                          >
                            <View style={styles.subtaskCheckbox}>
                              {subtask.is_completed && (
                                <View style={styles.subtaskCheckboxChecked} />
                              )}
                            </View>
                            <View style={styles.subtaskContent}>
                              {/* Badge de subtarea */}
                              <View style={styles.subtaskTypeContainer}>
                                <View style={[styles.taskTypeBadge, styles.subtaskBadge]}>
                                  <Text style={styles.taskTypeIcon}>└</Text>
                                  <Text style={styles.taskTypeText}>Subtarea</Text>
                                </View>
                              </View>
                              <Text style={[
                                styles.subtaskText,
                                subtask.is_completed && styles.subtaskTextCompleted,
                              ]}>
                                {subtask.content}
                              </Text>
                            </View>
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

            {/* Categoría se detecta automáticamente - invisible para el usuario */}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setEditingTask(null);
                  setEditContent('');
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

      {/* Modal de meditación */}
      <MeditationCircle
        visible={showMeditation}
        onComplete={handleMeditationComplete}
        onClose={() => setShowMeditation(false)}
        type={meditationType}
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
  tasksContainer: {
    gap: THEME.spacing.sm,
  },
  loadingContainer: {
    gap: THEME.spacing.sm,
  },
  skeletonTask: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  skeletonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.stroke[100],
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 4,
    width: '100%',
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
  flowStepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  flowStep: {
    flex: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  flowStepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.fill[200],
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
  flowStepNumberText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
  flowStepNumberTextActive: {
    color: THEME.colors.fill[100],
  },
  flowStepLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    fontSize: 13,
    marginBottom: THEME.spacing.xs / 2,
    textAlign: 'center',
  },
  flowStepDescription: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  flowArrow: {
    paddingHorizontal: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs * 2,
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
