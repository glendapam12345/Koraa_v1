import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Tooltip } from '@/components/Tooltip';
import { Toast } from '@/components/Toast';
import { FlowIndicator } from '@/components/FlowIndicator';
import { supabase } from '@/lib/supabase';
import { detectCategory } from '@/lib/categoryDetection';
import { X, Star, Plus, ChevronDown, ChevronUp, Sparkles, Mic } from 'lucide-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

// Categorías ahora son invisibles - se detectan automáticamente en lib/categoryDetection.ts

export default function VaciarScreen() {
  const { suggestion } = useLocalSearchParams<{ suggestion?: string }>();
  const [taskInput, setTaskInput] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [recentTasks, setRecentTasks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recentTaskSuggestions, setRecentTaskSuggestions] = useState<string[]>([]);

  // Pre-llenar input si hay sugerencia desde Tips
  useEffect(() => {
    if (suggestion) {
      setTaskInput(suggestion);
    }
  }, [suggestion]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const removeSubtask = (index: number) => {
    if (subtasks.length > 1) {
      setSubtasks(subtasks.filter((_, i) => i !== index));
    }
  };

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  useEffect(() => {
    checkTodayCheckIn();
    checkIfFirstTime();
    loadRecentTaskSuggestions();
  }, []);

  // Recargar banner cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      checkTodayCheckIn();
      checkIfFirstTime();
    }, [])
  );

  const checkIfFirstTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        console.error('Error verificando tareas:', error);
        return;
      }

      const userHasTasks = (data?.length || 0) > 0;
      setHasTasks(userHasTasks);
      
      // Mostrar tooltip solo si no hay tareas (primera vez)
      if (!userHasTasks) {
        setShowTooltip(true);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  // Cargar sugerencias de tareas recientes para autocompletar
  const loadRecentTaskSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error cargando sugerencias:', error);
        return;
      }

      if (data) {
        // Extraer tareas únicas (sin duplicados exactos)
        const uniqueTasks = Array.from(new Set(data.map(t => t.content.trim())));
        setRecentTaskSuggestions(uniqueTasks.slice(0, 3)); // Máximo 3 sugerencias
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  const checkTodayCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error verificando check-in:', error);
        return;
      }

      setHasCheckInToday(!!data);
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  const handleAddTask = async () => {
    // Validar que la tarea principal no esté vacía
    if (!taskInput.trim()) {
      showToast('Por favor ingresa una tarea', 'info');
      return;
    }

    // Validar longitud máxima de la tarea principal
    if (taskInput.trim().length > 300) {
      showToast('La tarea no puede tener más de 300 caracteres', 'error');
      return;
    }

    // Validar subtareas si están habilitadas
    if (hasSubtasks) {
      const validSubtasks = subtasks.filter(st => st.trim());
      if (validSubtasks.length === 0) {
        showToast('Agrega al menos una subtarea o desactiva las subtareas', 'info');
        return;
      }
      
      // Validar longitud de cada subtarea
      for (const subtask of validSubtasks) {
        if (subtask.trim().length > 300) {
          showToast('Las subtareas no pueden tener más de 300 caracteres', 'error');
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('No estás autenticado', 'error');
        setIsSaving(false);
        return;
      }

      // Detectar categoría automáticamente (invisible para el usuario)
      const detectedCategory = detectCategory(taskInput.trim());
      
      // Crear tarea principal
      const { data: mainTask, error: mainTaskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          content: taskInput.trim(),
          category: detectedCategory,
          is_priority: isPriority,
          is_completed: false,
          parent_task_id: null,
        })
        .select()
        .single();

      // Si hay error de red, guardar offline
      if (mainTaskError) {
        const isNetworkError = mainTaskError.message?.toLowerCase().includes('network') || 
                              mainTaskError.message?.toLowerCase().includes('fetch') ||
                              mainTaskError.message?.toLowerCase().includes('connection');
        
        if (isNetworkError) {
          // Guardar offline
          const { saveTaskOffline } = await import('@/lib/offlineStorage');
          await saveTaskOffline({
            content: taskInput.trim(),
            category: detectedCategory,
            is_priority: isPriority,
            is_completed: false,
            parent_task_id: null,
          });
          
          // Guardar subtareas offline también si existen
          if (hasSubtasks) {
            const validSubtasks = subtasks.filter(st => st.trim());
            for (const subtask of validSubtasks) {
              const subtaskCategory = detectCategory(subtask.trim());
              await saveTaskOffline({
                content: subtask.trim(),
                category: subtaskCategory,
                is_priority: false,
                is_completed: false,
                parent_task_id: null, // Se asociará cuando se sincronice
              });
            }
          }
          
          setRecentTasks([taskInput.trim(), ...recentTasks.slice(0, 4)]);
          setTaskInput('');
          setIsPriority(false);
          setHasSubtasks(false);
          setSubtasks(['']);
          
          showToast('Tarea guardada offline. Se sincronizará cuando haya conexión.', 'info');
          setIsSaving(false);
          return;
        } else {
          console.error('Error guardando tarea principal:', mainTaskError);
          showToast('No se pudo guardar la tarea. Por favor intenta de nuevo', 'error');
          setIsSaving(false);
          return;
        }
      }

      // Crear subtareas si existen
      if (hasSubtasks && mainTask) {
        const validSubtasks = subtasks.filter(st => st.trim());
        if (validSubtasks.length > 0) {
          const subtasksToInsert = validSubtasks.map(subtask => ({
            user_id: user.id,
            content: subtask.trim(),
            category: detectCategory(subtask.trim()), // Detectar categoría automáticamente
            is_priority: false, // Las subtareas no tienen prioridad independiente
            is_completed: false,
            parent_task_id: mainTask.id,
          }));

          const { error: subtasksError } = await supabase
            .from('tasks')
            .insert(subtasksToInsert);

          if (subtasksError) {
            console.error('Error guardando subtareas:', subtasksError);
            // Intentar eliminar la tarea principal si fallan las subtareas
            await supabase.from('tasks').delete().eq('id', mainTask.id);
            showToast('No se pudieron guardar las subtareas. Por favor intenta de nuevo', 'error');
            setIsSaving(false);
            return;
          }
        }
      }

      setRecentTasks([taskInput.trim(), ...recentTasks.slice(0, 4)]);
      setTaskInput('');
      setIsPriority(false);
      setHasSubtasks(false);
      setSubtasks(['']);
      
      // Recargar sugerencias después de agregar tarea
      await loadRecentTaskSuggestions();
      
      // Cerrar tooltip después de agregar primera tarea
      if (showTooltip) {
        setShowTooltip(false);
      }

      const message = hasSubtasks
        ? `Tarea con ${subtasks.filter(st => st.trim()).length} subtareas agregada ${isPriority ? 'como prioridad' : 'exitosamente'}`
        : isPriority
          ? 'Tarea agregada como prioridad y aparecerá en "Hoy"'
          : 'Tarea agregada exitosamente';

      showToast(message, 'success');
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Ocurrió un error inesperado. Por favor intenta de nuevo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Función para manejar pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkTodayCheckIn(),
        checkIfFirstTime(),
      ]);
      // Intentar sincronizar datos offline
      const { syncAll } = await import('@/lib/offlineStorage');
      await syncAll();
    } catch (error) {
      console.error('Error al refrescar:', error);
      showToast('Error al actualizar los datos', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Función para entrada por voz
  const handleVoiceInput = () => {
    if (Platform.OS === 'web') {
      showToast('La entrada por voz no está disponible en web', 'info');
      return;
    }

    // Por ahora, mostrar un alert simple
    // TODO: Implementar reconocimiento de voz real con expo-speech o librería nativa
    Alert.prompt(
      'Entrada por voz',
      'Por ahora, escribe lo que quieres agregar. El reconocimiento de voz completo estará disponible pronto.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Usar teclado de voz',
          onPress: () => {
            // En iOS/Android, esto activará el teclado de voz del sistema
            // El usuario puede usar el dictado del sistema
            showToast('Usa el botón de micrófono del teclado para dictar', 'info');
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage(null)}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.gradient.blue}
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          />
        }
      >
        {/* Indicador de flujo */}
        <FlowIndicator currentStep="vaciar" />

        <Text style={styles.title}>Vacía tu mente en</Text>
        <Text style={styles.titleAccent}>un respiro</Text>

        <Text style={styles.subtitle}>
          Sin estructura. Sin etiquetas.{'\n'}
          Solo escribe lo que necesitas soltar.
        </Text>

        {/* Banner informativo: después de agregar tareas, ve a Sentir */}
        {hasCheckInToday === false && hasCheckInToday !== null && (
          <TouchableOpacity
            style={styles.checkInBanner}
            onPress={() => router.push('/(tabs)/sentir')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkInBannerGradient}
            >
              <Sparkles size={20} color="#FFFFFF" />
              <View style={styles.checkInBannerContent}>
                <Text style={styles.checkInBannerText}>
                  Siguiente paso: Registra cómo te sientes
                </Text>
                <Text style={styles.checkInBannerSubtext}>
                  Después de agregar tus tareas, ve a "Sentir" para que Kora las priorice según tu estado
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={taskInput}
            onChangeText={setTaskInput}
            placeholder="¿Qué necesitas hacer hoy?"
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {/* Botón de entrada por voz */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceInput}
              activeOpacity={0.7}
            >
              <Mic 
                size={20} 
                color={isListening ? THEME.colors.gradient.pink : THEME.colors.text.secondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Sugerencias de tareas recientes */}
        {recentTaskSuggestions.length > 0 && !taskInput.trim() && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Sugerencias rápidas:</Text>
            <View style={styles.suggestionsGrid}>
              {recentTaskSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => setTaskInput(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Categorías ahora son invisibles - se detectan automáticamente */}

        <TouchableOpacity
          style={[
            styles.priorityToggle,
            isPriority && styles.priorityToggleActive,
          ]}
          onPress={() => setIsPriority(!isPriority)}
          activeOpacity={0.7}
        >
          <Star
            size={20}
            color={isPriority ? THEME.colors.gradient.pink : THEME.colors.text.secondary}
            fill={isPriority ? THEME.colors.gradient.pink : 'none'}
          />
          <Text style={[
            styles.priorityToggleText,
            isPriority && styles.priorityToggleTextActive,
          ]}>
            Marcar como prioridad
          </Text>
        </TouchableOpacity>

        {/* Toggle para subtareas */}
        <TouchableOpacity
          style={[
            styles.subtasksToggle,
            hasSubtasks && styles.subtasksToggleActive,
          ]}
          onPress={() => {
            setHasSubtasks(!hasSubtasks);
            if (!hasSubtasks) {
              setSubtasks(['']);
            }
          }}
          activeOpacity={0.7}
        >
          {hasSubtasks ? (
            <ChevronUp size={20} color={THEME.colors.gradient.blue} />
          ) : (
            <ChevronDown size={20} color={THEME.colors.text.secondary} />
          )}
          <Text style={[
            styles.subtasksToggleText,
            hasSubtasks && styles.subtasksToggleTextActive,
          ]}>
            Agregar subtareas
          </Text>
        </TouchableOpacity>

        {/* Campos de subtareas */}
        {hasSubtasks && (
          <View style={styles.subtasksContainer}>
            <Text style={styles.subtasksLabel}>
              Subtareas (divide tu tarea en pasos más pequeños)
            </Text>
            {subtasks.map((subtask, index) => (
              <View key={index} style={styles.subtaskRow}>
                <View style={styles.subtaskInputContainer}>
                  <TextInput
                    style={styles.subtaskInput}
                    value={subtask}
                    onChangeText={(value) => updateSubtask(index, value)}
                    placeholder={`Subtarea ${index + 1}`}
                    placeholderTextColor={THEME.colors.text.secondary}
                  />
                </View>
                {subtasks.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeSubtaskButton}
                    onPress={() => removeSubtask(index)}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={THEME.colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addSubtaskButton}
              onPress={addSubtask}
              activeOpacity={0.7}
            >
              <Plus size={18} color={THEME.colors.gradient.blue} />
              <Text style={styles.addSubtaskText}>Agregar otra subtarea</Text>
            </TouchableOpacity>
          </View>
        )}

        <GradientButton
          title={isSaving ? "Guardando..." : "Soltar"}
          onPress={handleAddTask}
          disabled={!taskInput.trim() || isSaving}
        />

        {recentTasks.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>Recién agregado</Text>
            {recentTasks.map((task, index) => (
              <View key={index} style={styles.recentItem}>
                <Text style={styles.recentText}>{task}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      <Tooltip
        visible={showTooltip}
        title="Vacía tu mente"
        message="Aquí puedes escribir todas tus tareas sin pensar en categorías o prioridades. Solo suelta lo que tienes en mente. Después, haz tu check-in diario para que Kora las priorice automáticamente."
        onClose={() => setShowTooltip(false)}
      />
    </KeyboardAvoidingView>
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
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
  },
  inputContainer: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    minHeight: 120,
  },
  recentContainer: {
    marginTop: THEME.spacing.lg,
  },
  recentTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  recentItem: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  recentText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  priorityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  priorityToggleActive: {
    backgroundColor: THEME.colors.gradient.pink + '15',
    borderColor: THEME.colors.gradient.pink,
  },
  priorityToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  priorityToggleTextActive: {
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtasksToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  subtasksToggleActive: {
    backgroundColor: THEME.colors.gradient.blue + '15',
    borderColor: THEME.colors.gradient.blue,
  },
  subtasksToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  subtasksToggleTextActive: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtasksContainer: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  subtasksLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  subtaskInputContainer: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
  },
  subtaskInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  removeSubtaskButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
  },
  addSubtaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  addSubtaskText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  checkInBanner: {
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  checkInBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  checkInBannerContent: {
    flex: 1,
  },
  checkInBannerText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  checkInBannerSubtext: {
    ...THEME.typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  voiceButton: {
    position: 'absolute',
    right: THEME.spacing.md,
    bottom: THEME.spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.soft,
  },
  suggestionsContainer: {
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  suggestionsTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  suggestionText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
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
