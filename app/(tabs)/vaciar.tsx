import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Tooltip } from '@/components/Tooltip';
import { Toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { X, Star, Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

const CATEGORIES = [
  { id: 'trabajo', label: '💼 Trabajo', color: '#4A90E2' },
  { id: 'salud', label: '❤️ Salud', color: '#FF6B6B' },
  { id: 'personal', label: '👤 Personal', color: '#9B59B6' },
];

export default function VaciarScreen() {
  const [taskInput, setTaskInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
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
    if (!taskInput.trim()) return;

    // Validar subtareas si están habilitadas
    if (hasSubtasks) {
      const validSubtasks = subtasks.filter(st => st.trim());
      if (validSubtasks.length === 0) {
        showToast('Agrega al menos una subtarea o desactiva las subtareas', 'info');
        return;
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

      // Crear tarea principal
      const { data: mainTask, error: mainTaskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          content: taskInput.trim(),
          category: selectedCategory,
          is_priority: isPriority,
          is_completed: false,
          parent_task_id: null,
        })
        .select()
        .single();

      if (mainTaskError) {
        console.error('Error guardando tarea principal:', mainTaskError);
        showToast('No se pudo guardar la tarea. Por favor intenta de nuevo', 'error');
        setIsSaving(false);
        return;
      }

      // Crear subtareas si existen
      if (hasSubtasks && mainTask) {
        const validSubtasks = subtasks.filter(st => st.trim());
        if (validSubtasks.length > 0) {
          const subtasksToInsert = validSubtasks.map(subtask => ({
            user_id: user.id,
            content: subtask.trim(),
            category: selectedCategory, // Heredan la categoría
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
      setSelectedCategory('');
      setIsPriority(false);
      setHasSubtasks(false);
      setSubtasks(['']);
      
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
      >
        <Text style={styles.title}>Vacía tu mente en</Text>
        <Text style={styles.titleAccent}>un respiro</Text>

        <Text style={styles.subtitle}>
          Sin categorías. Sin etiquetas. Sin estructura.{'\n'}
          Solo escribe lo que necesitas soltar.
        </Text>

        {/* Banner si falta check-in */}
        {hasCheckInToday === false && (
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
                  Haz tu check-in diario primero
                </Text>
                <Text style={styles.checkInBannerSubtext}>
                  Para priorizar estas tareas según cómo te sientes
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
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.categoryLabel}>Opcional: Categoría</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.id ? '' : category.id
                )}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && {
                    backgroundColor: category.color + '20',
                    borderColor: category.color,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && { color: category.color },
                ]}>
                  {category.label}
                </Text>
                {selectedCategory === category.id && (
                  <X size={16} color={category.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  categoriesContainer: {
    marginBottom: THEME.spacing.md,
  },
  categoryLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
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
});
