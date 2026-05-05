import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Toast } from '@/components/Toast';
import { Focus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { fetchCurrentStreak, isStreakMilestone } from '@/lib/streak';
import { publishCheckInCelebration } from '@/lib/checkInCelebration';
import { markOnboardingCompleted } from '@/lib/onboardingGate';

const FOCUS_OPTIONS = [
  { id: 'Muy distraída', label: 'Muy distraída' },
  { id: 'Algo distraída', label: 'Algo distraída' },
  { id: 'Normal', label: 'Normal' },
  { id: 'Enfocada', label: 'Enfocada' },
  { id: 'Súper enfocada', label: 'Súper enfocada' },
];

export default function FocusScreen() {
  const { emotion, energy, time, from } = useLocalSearchParams<{ emotion: string; energy: string; time: string; from: string }>();
  const { user } = useAuth();
  const [selectedFocus, setSelectedFocus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
  };

  const prioritizeTasksBasedOnCheckIn = async (
    energyLevel: number,
    emotionValue: string,
    availableTime: string,
    focusLevel: string
  ) => {
    if (!user) return;

    try {
      // Importar algoritmo de priorización inteligente
      const { prioritizeTasksIntelligently } = await import('@/lib/smartPrioritization');
      
      // Obtener todas las tareas no completadas con sus subtareas
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error obteniendo tareas:', tasksError);
        return;
      }

      if (!tasks || tasks.length === 0) return;
      const previousPriorityTaskIds = tasks
        .filter((task: { id: string; is_priority: boolean }) => task.is_priority)
        .map((task: { id: string }) => task.id);

      // Organizar tareas con subtareas
      const tasksMap = new Map<string, any>();
      const mainTasks: any[] = [];

      tasks.forEach((task: any) => {
        const taskWithSubtasks = {
          ...task,
          subtasks: [],
        };
        tasksMap.set(task.id, taskWithSubtasks);

        if (!task.parent_task_id) {
          mainTasks.push(taskWithSubtasks);
        }
      });

      // Asignar subtareas a sus padres
      tasks.forEach((task: any) => {
        if (task.parent_task_id) {
          const parent = tasksMap.get(task.parent_task_id);
          const child = tasksMap.get(task.id);
          if (parent && child) {
            parent.subtasks.push(child);
          }
        }
      });

      // Guardar total de tareas antes de priorizar (para validación de valor)
      // Usar AsyncStorage ya que no tenemos tabla user_metadata en Supabase
      const totalTasksBefore = mainTasks.length;
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(
          `prioritization_${user.id}_${today}`,
          JSON.stringify({
            totalTasksBefore,
            date: today,
          })
        );
      } catch (err) {
        console.log('Error guardando metadata (no crítico):', err);
      }

      // Usar algoritmo de priorización inteligente
      const prioritizedTasks = prioritizeTasksIntelligently(mainTasks, {
        energyLevel,
        emotion: emotionValue,
        availableTime,
        focusLevel,
      });

      // Primero, quitar prioridad a todas las tareas
      const { error: unprioritizeError } = await supabase
        .from('tasks')
        .update({ is_priority: false })
        .eq('user_id', user.id)
        .eq('is_completed', false);

      if (unprioritizeError) {
        console.error('Error removiendo prioridad:', unprioritizeError);
        return;
      }

      // Luego, priorizar las tareas seleccionadas por el algoritmo
      if (prioritizedTasks.length > 0) {
        const taskIds = prioritizedTasks.map(t => t.id);
        const { error: prioritizeError } = await supabase
          .from('tasks')
          .update({ is_priority: true })
          .in('id', taskIds);

        if (prioritizeError) {
          console.error('Error priorizando tareas:', prioritizeError);
          // Rollback al estado previo para no dejar al usuario sin prioridades.
          if (previousPriorityTaskIds.length > 0) {
            const { error: rollbackError } = await supabase
              .from('tasks')
              .update({ is_priority: true })
              .in('id', previousPriorityTaskIds);
            if (rollbackError) {
              console.error('Error haciendo rollback de prioridades:', rollbackError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error inesperado en priorización:', error);
    }
  };

  const handleContinue = async () => {
    if (!selectedFocus || !emotion || !energy || !time || !user) return;

    // Validar que energy sea un número válido
    const energyLevel = parseInt(energy);
    if (isNaN(energyLevel) || energyLevel < 1 || energyLevel > 5) {
      showToast('El nivel de energía no es válido', 'error');
      return;
    }

    setIsSaving(true);

    // Timeout de seguridad: resetear estado después de 10 segundos si algo falla
    const safetyTimeout = setTimeout(() => {
      console.warn('Timeout de seguridad: reseteando isSaving');
      setIsSaving(false);
    }, 10000);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Guardar check-in
      // Validar y capitalizar emotion de forma segura
      const emotionCapitalized = emotion && emotion.length > 0
        ? emotion.charAt(0).toUpperCase() + emotion.slice(1)
        : emotion || '';

      // Intentar guardar en Supabase primero
      const { error: checkInError } = await supabase
        .from('daily_check_ins')
        .upsert({
          user_id: user.id,
          date: today,
          emotion: emotionCapitalized,
          energy_level: energyLevel,
          available_time: time,
          focus_level: selectedFocus,
        }, { onConflict: 'user_id,date' });

      let checkInSavedOffline = false;

      // Si hay error de red, guardar offline
      if (checkInError) {
        const isNetworkError = checkInError.message?.toLowerCase().includes('network') || 
                              checkInError.message?.toLowerCase().includes('fetch') ||
                              checkInError.message?.toLowerCase().includes('connection');
        
        if (isNetworkError) {
          // Guardar offline
          const { saveCheckInOffline } = await import('@/lib/offlineStorage');
          await saveCheckInOffline({
            date: today,
            emotion: emotionCapitalized,
            energy_level: energyLevel,
            available_time: time,
            focus_level: selectedFocus,
          });
          checkInSavedOffline = true;
          showToast('Check-in guardado offline. Se sincronizará cuando haya conexión.', 'info');
        } else {
          console.error('Error guardando check-in:', checkInError);
          clearTimeout(safetyTimeout);
          setIsSaving(false);
          showToast('No se pudo guardar tu check-in. Inténtalo de nuevo.', 'error');
          return;
        }
      }

      // Priorizar tareas automáticamente basado en el check-in (no bloquear si falla)
      prioritizeTasksBasedOnCheckIn(energyLevel, emotion, time, selectedFocus).catch((error) => {
        console.error('Error en priorización (no crítico):', error);
        // No bloquear el flujo si la priorización falla
      });

      // Limpiar timeout de seguridad
      clearTimeout(safetyTimeout);

      // Resetear estado de guardado ANTES de navegar
      setIsSaving(false);

      // Pequeño delay para asegurar que la priorización se complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Programar notificaciones diarias después del check-in
      try {
        const { scheduleDailyReminder } = await import('@/hooks/useNotifications');
        await scheduleDailyReminder();
      } catch (err) {
        console.log('Error programando notificaciones (no crítico):', err);
      }

      void track('check_in_completed', {
        source: typeof from === 'string' && from.length > 0 ? from : 'onboarding',
        offline: checkInSavedOffline,
      });

      let celebrationAfterSync: { streak: number; milestone: boolean } | null = null;
      if (!checkInSavedOffline && user) {
        try {
          const streak = await fetchCurrentStreak(supabase, user.id);
          celebrationAfterSync = { streak, milestone: isStreakMilestone(streak) };
        } catch (e) {
          console.warn('fetchCurrentStreak tras check-in:', e);
        }
      }

      // En onboarding, mostrar paywall suave antes de tabs.
      try {
        if (from === 'sentir') {
          router.replace('/(tabs)');
        } else {
          const { error: onboardingError } = await markOnboardingCompleted(user.id);
          if (onboardingError) {
            showToast('No se pudo cerrar onboarding. Inténtalo de nuevo.', 'error');
            return;
          }
          router.replace({ pathname: '/paywall', params: { next: '/(tabs)' } });
        }
      } catch (navError) {
        console.error('Error en navegación:', navError);
        router.replace('/(tabs)');
      }

      if (celebrationAfterSync) {
        const payload = celebrationAfterSync;
        setTimeout(() => publishCheckInCelebration(payload), 450);
      }
    } catch (error) {
      console.error('Error:', error);
      clearTimeout(safetyTimeout);
      setIsSaving(false);
      showToast('Ocurrió un error. Inténtalo de nuevo.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Focus size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <Text style={styles.title}>¿Qué tan</Text>
        <Text style={styles.titleAccent}>enfocada</Text>
        <Text style={styles.subtitle}>te sientes?</Text>

        <View style={styles.optionsContainer}>
          {FOCUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelectedFocus(option.id)}
              style={[
                styles.option,
                selectedFocus === option.id && styles.optionSelected,
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                selectedFocus === option.id && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={isSaving ? "Guardando..." : (from === 'sentir' ? "Guardar" : "Comenzar")}
          onPress={handleContinue}
          disabled={!selectedFocus || isSaving}
        />
      </View>
      
      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage(null)}
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
  content: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
  },
  iconContainer: {
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.lg,
  },
  optionsContainer: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  option: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    ...THEME.shadows.soft,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.bold,
  },
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
});
