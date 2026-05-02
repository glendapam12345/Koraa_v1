import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, RefreshControl, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Tooltip } from '@/components/Tooltip';
import { Toast } from '@/components/Toast';
import { FlowIndicator } from '@/components/FlowIndicator';
import { supabase, getErrorMessage, isNetworkError, getSchemaSetupMessage } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { track } from '@/lib/analytics';
import { detectCategory } from '@/lib/categoryDetection';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { DateSelector } from '@/components/tasks/DateSelector';
import { useAuth } from '@/contexts/AuthContext';
import { X, Star, Plus, ChevronDown, ChevronUp, Sparkles, Mic, FolderKanban, ChevronRight } from 'lucide-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

const VACIAR_OPTIONAL_HINT_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_optional_hint_dismissed_v1_${userId}`;

// Categorías cuando el usuario elige "No" a proyecto (mismas que en Hoy)
const CATEGORY_OPTIONS: { key: string; label: string }[] = [
  { key: 'hogar', label: 'Hogar' },
  { key: 'trabajo', label: 'Trabajo' },
  { key: 'personal', label: 'Personal' },
  { key: 'salud', label: 'Salud' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'marca', label: 'Marca' },
  { key: 'otros', label: 'Otros' },
];

function trackTaskCreated(args: {
  priority: boolean;
  projectId: string | null;
  scheduledDate: string | null;
  hasSubtasks: boolean;
  offline?: boolean;
}) {
  void track('task_created', {
    priority: args.priority,
    has_project: Boolean(args.projectId),
    has_date: Boolean(args.scheduledDate),
    has_subtasks: args.hasSubtasks,
    ...(args.offline !== undefined ? { offline: args.offline } : {}),
  });
}

export default function VaciarScreen() {
  const insets = useSafeAreaInsets();
  const { suggestion, date: dateParam, projectId: projectIdParam } = useLocalSearchParams<{
    suggestion?: string;
    date?: string;
    projectId?: string;
  }>();
  const [taskInput, setTaskInput] = useState('');
  const taskInputRef = useRef<TextInput>(null);
  const [isPriority, setIsPriority] = useState(false);
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [recentTasks, setRecentTasks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [optionalHintDismissed, setOptionalHintDismissed] = useState(false);
  const [optionalHintExpanded, setOptionalHintExpanded] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recentTaskSuggestions, setRecentTaskSuggestions] = useState<string[]>([]);
  /** true = asignar a proyecto, false = solo categoría, null = no ha elegido */
  const [assignToProject, setAssignToProject] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('otros');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  void setIsListening;
  void setShowDatePicker;
  void showDatePicker;
  const [, setProjectCount] = useState<number | null>(null);
  const [opcionesExpanded, setOpcionesExpanded] = useState(false);
  const { user } = useAuth();

  // Pre-llenar input si hay sugerencia desde Tips; fecha desde Semana; proyecto desde detalle de proyecto
  useEffect(() => {
    if (suggestion) {
      setTaskInput(suggestion);
    }
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    }
    if (projectIdParam && typeof projectIdParam === 'string' && projectIdParam.length >= 10) {
      setAssignToProject(true);
      setSelectedProjectId(projectIdParam);
    }
  }, [suggestion, dateParam, projectIdParam]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const addSubtask = () => {
    // Validar límite máximo de subtareas
    if (subtasks.length >= 20) {
      showToast('No puedes agregar más de 20 subtareas por tarea', 'error');
      return;
    }
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

  const loadProjectCount = useCallback(async () => {
    if (!user) {
      setProjectCount(null);
      return;
    }
    const { count, error } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (!error && count != null) setProjectCount(count);
    else setProjectCount(0);
  }, [user]);

  // Recargar banner y conteo de proyectos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      checkTodayCheckIn();
      checkIfFirstTime();
      loadProjectCount();
    }, [loadProjectCount])
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
        logger.error('Error verificando tareas:', error);
        // No mostrar toast para errores no críticos de verificación
        return;
      }

      const userHasTasks = (data?.length || 0) > 0;
      setHasTasks(userHasTasks);

      let hintDismissedInStorage = false;
      try {
        hintDismissedInStorage =
          (await AsyncStorage.getItem(VACIAR_OPTIONAL_HINT_DISMISSED_KEY(user.id))) === '1';
      } catch {
        hintDismissedInStorage = false;
      }
      setOptionalHintDismissed(hintDismissedInStorage);

      // Tooltip modal: si aún no hay tareas, solo si ya cerraron la tarjeta de "opcional"
      // (evita solaparse con el hint inline la primera vez).
      if (!userHasTasks) {
        setShowTooltip(hintDismissedInStorage);
      } else {
        setShowTooltip(false);
      }
    } catch (error) {
      logger.error('Error inesperado:', error);
    }
  };

  const dismissOptionalHint = async () => {
    if (user?.id) {
      try {
        await AsyncStorage.setItem(VACIAR_OPTIONAL_HINT_DISMISSED_KEY(user.id), '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setOptionalHintDismissed(true);
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
        logger.error('Error cargando sugerencias:', error);
        // No mostrar toast para errores no críticos de sugerencias
        return;
      }

      if (data) {
        // Extraer tareas únicas (sin duplicados exactos)
        const uniqueTasks = Array.from(new Set(data.map(t => t.content.trim())));
        setRecentTaskSuggestions(uniqueTasks.slice(0, 3)); // Máximo 3 sugerencias
      }
    } catch (error) {
      logger.error('Error inesperado:', error);
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
        logger.error('Error verificando check-in:', error);
        // No mostrar toast para errores no críticos de verificación
        return;
      }

      setHasCheckInToday(!!data);
    } catch (error) {
      logger.error('Error inesperado:', error);
    }
  };

  const handleAddTask = async () => {
    // Validar que la tarea principal no esté vacía
    if (!taskInput.trim()) {
      showToast('Por favor ingresa una tarea', 'info');
      return;
    }
    if (assignToProject === true && !selectedProjectId) {
      showToast('Selecciona un proyecto o créalo antes de guardar.', 'info');
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

      const detectedCategory = detectCategory(taskInput.trim());
      const categoryToSave = assignToProject === false ? selectedCategory : (detectedCategory || 'otros');
      const projectIdToSave = assignToProject === true ? selectedProjectId : null;

      const { data: mainTask, error: mainTaskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          content: taskInput.trim(),
          category: categoryToSave,
          is_priority: isPriority,
          is_completed: false,
          parent_task_id: null,
          project_id: projectIdToSave,
          scheduled_date: selectedDate,
        })
        .select()
        .single();

      // Si hay error de red, guardar offline
      if (mainTaskError) {
        if (isNetworkError(mainTaskError)) {
          // Guardar offline
          const { saveTaskOffline } = await import('@/lib/offlineStorage');
          // Guardar tarea principal y obtener su ID generado
          const mainTaskId = await saveTaskOffline({
            content: taskInput.trim(),
            category: categoryToSave,
            is_priority: isPriority,
            is_completed: false,
            parent_task_id: null,
            project_id: projectIdToSave,
            scheduled_date: selectedDate,
          });

          if (hasSubtasks) {
            const validSubtasks = subtasks.filter(st => st.trim());
            for (const subtask of validSubtasks) {
              const stCat = detectCategory(subtask.trim()) || categoryToSave;
              await saveTaskOffline({
                content: subtask.trim(),
                category: stCat,
                is_priority: false,
                is_completed: false,
                parent_task_id: mainTaskId,
                project_id: projectIdToSave,
              });
            }
          }

          setRecentTasks([taskInput.trim(), ...recentTasks.slice(0, 4)]);
          setTaskInput('');
          setIsPriority(false);
          setHasSubtasks(false);
          setSubtasks(['']);
          setAssignToProject(null);
          setSelectedCategory('otros');
          setSelectedProjectId(null);
          setSelectedDate(null);

          trackTaskCreated({
            priority: isPriority,
            projectId: projectIdToSave,
            scheduledDate: selectedDate,
            hasSubtasks: hasSubtasks && subtasks.some((st) => st.trim()),
            offline: true,
          });

          showToast('Tarea guardada offline. Se sincronizará cuando haya conexión.', 'info');
          setIsSaving(false);
          return;
        } else {
          const schemaType = getSchemaSetupMessage(mainTaskError);
          const isProjectOrScheduledSchema = schemaType === 'project_id' || schemaType === 'scheduled_date';
          if (isProjectOrScheduledSchema) {
            const { data: fallbackTask, error: fallbackError } = await supabase
              .from('tasks')
              .insert({
                user_id: user.id,
                content: taskInput.trim(),
                category: categoryToSave,
                is_priority: isPriority,
                is_completed: false,
                parent_task_id: null,
              })
              .select()
              .single();
            if (fallbackError) {
              logger.error('Error guardando tarea (fallback):', fallbackError);
              showToast(`No se pudo guardar la tarea: ${getErrorMessage(fallbackError)}`, 'error');
              setIsSaving(false);
              return;
            }
            if (hasSubtasks && fallbackTask) {
              const validSubtasks = subtasks.filter(st => st.trim());
              const subtasksToInsert = validSubtasks.map(subtask => ({
                user_id: user.id,
                content: subtask.trim(),
                category: detectCategory(subtask.trim()),
                is_priority: false,
                is_completed: false,
                parent_task_id: fallbackTask.id,
              }));
              await supabase.from('tasks').insert(subtasksToInsert);
            }
            setRecentTasks([taskInput.trim(), ...recentTasks.slice(0, 4)]);
            setTaskInput('');
            setIsPriority(false);
            setHasSubtasks(false);
            setSubtasks(['']);
            setAssignToProject(null);
            setSelectedCategory('otros');
            setSelectedProjectId(null);
            setSelectedDate(null);

            trackTaskCreated({
              priority: isPriority,
              projectId: projectIdToSave,
              scheduledDate: selectedDate,
              hasSubtasks: hasSubtasks && subtasks.some((st) => st.trim()),
            });

            showToast('Tarea guardada. Para proyectos y fechas: ejecuta la migración en Supabase (Dashboard → SQL Editor).', 'success');
            setIsSaving(false);
            return;
          }
          logger.error('Error guardando tarea principal:', mainTaskError);
          const errorMessage = getErrorMessage(mainTaskError);
          showToast(`No se pudo guardar la tarea: ${errorMessage}`, 'error');
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
            category: detectCategory(subtask.trim()) || categoryToSave,
            is_priority: false,
            is_completed: false,
            parent_task_id: mainTask.id,
            project_id: projectIdToSave,
            scheduled_date: selectedDate,
          }));

          const { error: subtasksError } = await supabase
            .from('tasks')
            .insert(subtasksToInsert);

          if (subtasksError) {
            logger.error('Error guardando subtareas:', subtasksError);
            // Intentar eliminar la tarea principal si fallan las subtareas
            await supabase.from('tasks').delete().eq('id', mainTask.id);
            const errorMessage = getErrorMessage(subtasksError);
            showToast(`No se pudieron guardar las subtareas: ${errorMessage}`, 'error');
            setIsSaving(false);
            return;
          }
        }
      }

      trackTaskCreated({
        priority: isPriority,
        projectId: projectIdToSave,
        scheduledDate: selectedDate,
        hasSubtasks: hasSubtasks && subtasks.some((st) => st.trim()),
      });

      setHasTasks(true);

      setRecentTasks([taskInput.trim(), ...recentTasks.slice(0, 4)]);
      setTaskInput('');
      setIsPriority(false);
      setHasSubtasks(false);
      setSubtasks(['']);
      setAssignToProject(null);
      setSelectedCategory('otros');
      setSelectedProjectId(null);
      setSelectedDate(null);

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
      logger.error('Error inesperado:', error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
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
      logger.error('Error al refrescar:', error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
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
          contentContainerStyle={[styles.content, { paddingTop: insets.top + THEME.spacing.lg, paddingBottom: THEME.spacing.xl * 2 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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

        {hasTasks === false && !optionalHintDismissed && (
          <View style={styles.optionalHintCard}>
            <TouchableOpacity
              style={styles.optionalHintHeader}
              onPress={() => setOptionalHintExpanded((e) => !e)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={
                optionalHintExpanded
                  ? 'Contraer nota sobre opciones opcionales'
                  : 'Expandir nota sobre proyecto, fecha y subtareas'
              }
            >
              <Text style={styles.optionalHintTitle}>Todo lo demás es opcional</Text>
              {optionalHintExpanded ? (
                <ChevronUp size={20} color={THEME.colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={THEME.colors.text.secondary} />
              )}
            </TouchableOpacity>
            {optionalHintExpanded ? (
              <View style={styles.optionalHintBodyWrap}>
                <Text style={styles.optionalHintBody}>
                  Proyecto, categoría, fecha, subtareas y prioridad puedes elegirlos cuando quieras. Puedes escribir y
                  pulsar Soltar.
                </Text>
                <Text style={[styles.optionalHintBody, styles.optionalHintBodySecond]}>
                  Para ordenar tu día según tu estado, haz después tu check-in en Sentir.
                </Text>
                <TouchableOpacity
                  onPress={() => void dismissOptionalHint()}
                  style={styles.optionalHintDismissBtn}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Entendido, ocultar esta nota"
                >
                  <Text style={styles.optionalHintDismissText}>Entendido</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.optionalHintCollapsedWrap}>
                <Text style={styles.optionalHintCollapsedLine}>
                  Proyecto, fecha y más → opcionales
                </Text>
                <TouchableOpacity
                  onPress={() => void dismissOptionalHint()}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Entendido, ocultar esta nota"
                >
                  <Text style={styles.optionalHintDismissTextCompact}>Entendido</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Banner informativo: después de agregar tareas, ve a Sentir */}
        {hasCheckInToday === false && hasCheckInToday !== null && (
          <TouchableOpacity
            style={styles.checkInBanner}
            onPress={() => router.push('/(tabs)/sentir')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Siguiente paso: Registra cómo te sientes"
            accessibilityHint="Abre la pantalla para registrar tu estado emocional del día"
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkInBannerGradient}
            >
              <Sparkles size={20} color={THEME.colors.onGradient} />
              <View style={styles.checkInBannerContent}>
                <Text style={styles.checkInBannerText}>
                  Siguiente paso: Registra cómo te sientes
                </Text>
                <Text style={styles.checkInBannerSubtext}>
                  Después de agregar tus tareas, ve a &quot;Sentir&quot; para que Koraa las priorice según tu estado
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            ref={taskInputRef}
            style={styles.input}
            value={taskInput}
            onChangeText={setTaskInput}
            placeholder="Escribe la tarea o idea que quieres soltar..."
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
            accessibilityLabel="Campo de texto para agregar tarea"
            accessibilityHint="Escribe o dicta la tarea que necesitas hacer hoy"
          />
          {/* Botón de entrada por voz */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceInput}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Entrada por voz"
              accessibilityHint="Abre información sobre cómo usar el teclado de voz del sistema"
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
                  accessibilityRole="button"
                  accessibilityLabel={`Usar sugerencia: ${suggestion}`}
                  accessibilityHint="Toca para usar esta tarea reciente como sugerencia"
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ¿Asignar a un proyecto? Sí / No */}
        {taskInput.trim() ? (
          <View style={styles.assignSection}>
            <Text style={styles.assignQuestion}>¿Asignar esta tarea a un proyecto?</Text>
            <View style={styles.assignButtonsRow}>
              <TouchableOpacity
                style={[styles.assignButton, styles.assignButtonYes, assignToProject === true && styles.assignButtonYesSelected]}
                onPress={() => {
                  setAssignToProject(true);
                  setSelectedCategory('otros');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Sí, asignar a un proyecto"
              >
                <Text style={[styles.assignButtonText, assignToProject === true ? styles.assignButtonTextSelectedYes : null]}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.assignButton, styles.assignButtonNo, assignToProject === false && styles.assignButtonNoSelected]}
                onPress={() => {
                  setAssignToProject(false);
                  setSelectedProjectId(null);
                  setHasSubtasks(false);
                  setSubtasks(['']);
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="No, solo categoría"
              >
                <Text
                  style={[
                    styles.assignButtonText,
                    assignToProject === false ? styles.assignButtonTextSelectedYes : null,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>

            {assignToProject === false && (
              <View style={styles.categorySection}>
                <Text style={styles.categorySectionLabel}>Elige categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsWrap}>
                  {CATEGORY_OPTIONS.map((opt) => {
                    const isSelected = selectedCategory === opt.key;
                    const color = THEME.colors.category[opt.key as keyof typeof THEME.colors.category] ?? THEME.colors.text.secondary;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.categoryChip, isSelected && { backgroundColor: color, borderColor: color }]}
                        onPress={() => setSelectedCategory(opt.key)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Categoría ${opt.label}${isSelected ? ', seleccionada' : ''}`}
                      >
                        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {assignToProject === true && user && (
              <View style={styles.projectBlock}>
                <ProjectSelector
                  selectedProjectId={selectedProjectId}
                  onSelect={setSelectedProjectId}
                  userId={user.id}
                  showLabel={false}
                  assignMode={true}
                  onBeforeOpenModal={() => {
                    Keyboard.dismiss();
                    taskInputRef.current?.blur();
                  }}
                  onError={(message) => showToast(message, 'error')}
                  onSuccess={(projectName) => showToast(`Proyecto «${projectName}» creado`, 'success')}
                />
                <TouchableOpacity
                  style={[styles.subtasksToggle, hasSubtasks && styles.subtasksToggleActive]}
                  onPress={() => {
                    setHasSubtasks(!hasSubtasks);
                    if (!hasSubtasks) setSubtasks(['']);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="switch"
                  accessibilityLabel={hasSubtasks ? 'Pasos activado' : 'Agregar pasos'}
                  accessibilityState={{ checked: hasSubtasks }}
                >
                  {hasSubtasks ? <ChevronUp size={20} color={THEME.colors.gradient.blue} /> : <ChevronDown size={20} color={THEME.colors.text.secondary} />}
                  <Text style={[styles.subtasksToggleText, hasSubtasks && styles.subtasksToggleTextActive]}>
                    Agregar pasos (subtareas)
                  </Text>
                </TouchableOpacity>
                {hasSubtasks && (
                  <View style={styles.subtasksContainer}>
                    {subtasks.map((subtask, index) => (
                      <View key={index} style={styles.subtaskRow}>
                        <View style={styles.subtaskInputContainer}>
                          <TextInput
                            style={styles.subtaskInput}
                            value={subtask}
                            onChangeText={(value) => updateSubtask(index, value)}
                            placeholder={`Paso ${index + 1}`}
                            placeholderTextColor={THEME.colors.text.secondary}
                            maxLength={300}
                          />
                        </View>
                        {subtasks.length > 1 && (
                          <TouchableOpacity style={styles.removeSubtaskButton} onPress={() => removeSubtask(index)} activeOpacity={0.7}>
                            <X size={18} color={THEME.colors.text.secondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity style={styles.addSubtaskButton} onPress={addSubtask} activeOpacity={0.7}>
                      <Plus size={18} color={THEME.colors.gradient.blue} />
                      <Text style={styles.addSubtaskText}>Agregar otro paso</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}

        {/* Box aparte: Ver proyectos y tareas sin proyecto */}
        {taskInput.trim() && user ? (
          <TouchableOpacity
            style={styles.verProyectosBox}
            onPress={() => router.push('/proyectos')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Ver proyectos y tareas sin proyecto"
          >
            <View style={styles.verProyectosBoxInner}>
              <View style={styles.verProyectosBoxIconWrap}>
                <FolderKanban size={22} color={THEME.colors.gradient.blue} strokeWidth={1.8} />
              </View>
              <View style={styles.verProyectosBoxTextWrap}>
                <Text style={styles.verProyectosBoxTitle}>Ver proyectos y tareas sin proyecto</Text>
                <Text style={styles.verProyectosBoxHint}>Abre la lista de proyectos y tareas sueltas</Text>
              </View>
              <ChevronRight size={22} color={THEME.colors.gradient.blue} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Opciones: fecha y prioridad (colapsable) */}
        {taskInput.trim() ? (
          <View style={styles.opcionesSection}>
            <TouchableOpacity
              style={styles.opcionesHeader}
              onPress={() => setOpcionesExpanded((e) => !e)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={opcionesExpanded ? 'Cerrar opciones' : 'Abrir opciones de fecha y prioridad'}
            >
              <View>
                <Text style={styles.opcionesHeaderText}>Opciones</Text>
                <Text style={styles.opcionesHeaderHint}>Fecha, prioridad</Text>
              </View>
              {opcionesExpanded ? <ChevronUp size={20} color={THEME.colors.text.secondary} /> : <ChevronDown size={20} color={THEME.colors.text.secondary} />}
            </TouchableOpacity>
            {opcionesExpanded && (
              <View style={styles.opcionesContent}>
                <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} />
                <TouchableOpacity
                  style={[styles.priorityToggle, isPriority && styles.priorityToggleActive]}
                  onPress={() => setIsPriority(!isPriority)}
                  activeOpacity={0.7}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isPriority }}
                >
                  <Star size={20} color={isPriority ? THEME.colors.gradient.pink : THEME.colors.text.secondary} fill={isPriority ? THEME.colors.gradient.pink : 'none'} />
                  <Text style={[styles.priorityToggleText, isPriority && styles.priorityToggleTextActive]}>Marcar como prioridad</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

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
        message="Aquí puedes escribir todas tus tareas sin pensar en categorías o prioridades. Solo suelta lo que tienes en mente. Después, haz tu check-in diario para que Koraa las priorice automáticamente."
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
  optionalHintCard: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    backgroundColor: THEME.colors.fill[100],
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  optionalHintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  optionalHintTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  optionalHintBodyWrap: {
    marginTop: THEME.spacing.sm,
  },
  optionalHintBody: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  optionalHintBodySecond: {
    marginTop: THEME.spacing.xs,
  },
  optionalHintDismissBtn: {
    alignSelf: 'flex-end',
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
  },
  optionalHintDismissText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  optionalHintCollapsedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  optionalHintCollapsedLine: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  optionalHintDismissTextCompact: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  sectionHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  assignSection: {
    marginBottom: THEME.spacing.md,
  },
  assignQuestion: {
    ...THEME.typography.body,
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  assignButtonsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  assignButton: {
    flex: 1,
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  assignButtonYes: {
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  assignButtonYesSelected: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  assignButtonNo: {
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
  },
  assignButtonNoSelected: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  assignButtonText: {
    ...THEME.typography.body,
    fontSize: 16,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  assignButtonTextSelectedYes: {
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  categorySection: {
    marginBottom: THEME.spacing.md,
  },
  categorySectionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  categoryChipsWrap: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs + 2,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[100],
  },
  categoryChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  categoryChipTextSelected: {
    color: THEME.colors.fill[100],
  },
  projectBlock: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  verProyectosBox: {
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[100],
    ...THEME.shadows.card,
    overflow: 'hidden',
  },
  verProyectosBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.md,
  },
  verProyectosBoxIconWrap: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.standard + 2,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
  },
  verProyectosBoxTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  verProyectosBoxTitle: {
    ...THEME.typography.body,
    fontSize: 16,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  verProyectosBoxHint: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  opcionesSection: {
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    backgroundColor: THEME.colors.fill[200],
  },
  opcionesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  opcionesHeaderText: {
    ...THEME.typography.body,
    fontSize: 15,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  opcionesHeaderHint: {
    ...THEME.typography.caption,
    fontSize: 12,
    color: THEME.colors.text.tertiary,
    marginTop: 2,
  },
  opcionesContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
  inputContainer: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    minHeight: 120,
    fontSize: 16,
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
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  priorityToggleActive: {
    backgroundColor: THEME.colors.gradient.pink + '12',
    borderColor: THEME.colors.gradient.pink + '40',
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
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  subtasksToggleActive: {
    backgroundColor: THEME.colors.gradient.blue + '12',
    borderColor: THEME.colors.gradient.blue + '40',
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
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  checkInBannerSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
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
