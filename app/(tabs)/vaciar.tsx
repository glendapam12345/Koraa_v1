import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Tooltip } from '@/components/Tooltip';
import { Toast } from '@/components/Toast';
import { FlowIndicator } from '@/components/FlowIndicator';
import { supabase, isNetworkError, getSchemaSetupMessage } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { track } from '@/lib/analytics';
import { getLocalDateString } from '@/lib/dateLocal';
import { detectCategory } from '@/lib/categoryDetection';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { DateSelector } from '@/components/tasks/DateSelector';
import { TasksFlowCard } from '@/components/tasks/TasksFlowCard';
import { prioritizeTasksForCheckIn } from '@/lib/checkInService';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsLibraryLink } from '@/components/projects/ProjectsLibraryLink';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { categoryKeys, type CategoryKey } from '@/lib/i18n/locales/features/categories';
import { X, Plus, ChevronDown, ChevronUp, Sparkles, FolderKanban, Calendar } from 'lucide-react-native';

const VACIAR_OPTIONAL_HINT_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_optional_hint_dismissed_v1_${userId}`;

const VACIAR_FLOW_CARD_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_flow_card_dismissed_v1_${userId}`;

const VACIAR_DICTATE_HINT_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_dictate_hint_dismissed_v1_${userId}`;

const CATEGORY_OPTIONS: { key: CategoryKey }[] = categoryKeys.map((key) => ({ key }));

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
  const { t, locale } = useI18n();
  const { suggestion, date: dateParam, projectId: projectIdParam } = useLocalSearchParams<{
    suggestion?: string;
    date?: string;
    projectId?: string;
  }>();
  const [taskInput, setTaskInput] = useState('');
  const taskInputRef = useRef<TextInput>(null);
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [recentTasks, setRecentTasks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [optionalHintDismissed, setOptionalHintDismissed] = useState(false);
  const [flowCardDismissed, setFlowCardDismissed] = useState(false);
  const [optionalHintExpanded, setOptionalHintExpanded] = useState(false);
  const [organizePanelExpanded, setOrganizePanelExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [dictateHintDismissed, setDictateHintDismissed] = useState(false);
  const [recentTaskSuggestions, setRecentTaskSuggestions] = useState<string[]>([]);
  /** true = asignar a proyecto, false = solo categoría, null = no ha elegido */
  const [assignToProject, setAssignToProject] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('otros');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  void setShowDatePicker;
  void showDatePicker;
  const [, setProjectCount] = useState<number | null>(null);
  const [moreOptionsExpanded, setMoreOptionsExpanded] = useState(false);
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
      showToast(t('vaciar.maxSubtasks'), 'error');
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

      let flowCardDismissedInStorage = false;
      try {
        flowCardDismissedInStorage =
          (await AsyncStorage.getItem(VACIAR_FLOW_CARD_DISMISSED_KEY(user.id))) === '1';
      } catch {
        flowCardDismissedInStorage = false;
      }
      setFlowCardDismissed(flowCardDismissedInStorage);

      let dictateHintDismissedInStorage = false;
      try {
        dictateHintDismissedInStorage =
          (await AsyncStorage.getItem(VACIAR_DICTATE_HINT_DISMISSED_KEY(user.id))) === '1';
      } catch {
        dictateHintDismissedInStorage = false;
      }
      setDictateHintDismissed(dictateHintDismissedInStorage);

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

  const dismissFlowCard = async () => {
    if (user?.id) {
      try {
        await AsyncStorage.setItem(VACIAR_FLOW_CARD_DISMISSED_KEY(user.id), '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setFlowCardDismissed(true);
  };

  const reprioritizeAfterTaskSave = async (userId: string) => {
    const today = getLocalDateString();
    const { data: checkIn, error } = await supabase
      .from('daily_check_ins')
      .select('emotion, energy_level, available_time, focus_level')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error || !checkIn) return;

    await prioritizeTasksForCheckIn(userId, {
      energyLevel: checkIn.energy_level,
      emotion: checkIn.emotion,
      availableTime: checkIn.available_time,
      focusLevel: checkIn.focus_level,
      locale,
    });
  };

  const dismissDictateHint = async () => {
    if (user?.id) {
      try {
        await AsyncStorage.setItem(VACIAR_DICTATE_HINT_DISMISSED_KEY(user.id), '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setDictateHintDismissed(true);
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

      const today = getLocalDateString();
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
      showToast(t('vaciar.enterTask'), 'info');
      return;
    }
    if (assignToProject === true && !selectedProjectId) {
      showToast(t('vaciar.selectProject'), 'info');
      return;
    }

    // Validar longitud máxima de la tarea principal
    if (taskInput.trim().length > 300) {
      showToast(t('vaciar.taskTooLong'), 'error');
      return;
    }

    // Validar subtareas si están habilitadas
    if (hasSubtasks) {
      const validSubtasks = subtasks.filter(st => st.trim());
      if (validSubtasks.length === 0) {
        showToast(t('vaciar.addSubtaskOrDisable'), 'info');
        return;
      }
      
      // Validar longitud de cada subtarea
      for (const subtask of validSubtasks) {
        if (subtask.trim().length > 300) {
          showToast(t('vaciar.subtaskTooLong'), 'error');
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast(t('errors.notAuthenticated'), 'error');
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
          is_priority: false,
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
            is_priority: false,
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
          setHasSubtasks(false);
          setSubtasks(['']);
          setAssignToProject(null);
          setSelectedCategory('otros');
          setSelectedProjectId(null);
          setSelectedDate(null);
          setMoreOptionsExpanded(false);

          trackTaskCreated({
            priority: false,
            projectId: projectIdToSave,
            scheduledDate: selectedDate,
            hasSubtasks: hasSubtasks && subtasks.some((st) => st.trim()),
            offline: true,
          });

          showToast(t('vaciar.savedOffline'), 'info');
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
                is_priority: false,
                is_completed: false,
                parent_task_id: null,
              })
              .select()
              .single();
            if (fallbackError) {
              logger.error('Error guardando tarea (fallback):', fallbackError);
              showToast(t('errors.saveTaskFailed'), 'error');
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
            setHasSubtasks(false);
            setSubtasks(['']);
            setAssignToProject(null);
            setSelectedCategory('otros');
            setSelectedProjectId(null);
            setSelectedDate(null);
            setMoreOptionsExpanded(false);

            trackTaskCreated({
              priority: false,
              projectId: projectIdToSave,
              scheduledDate: selectedDate,
              hasSubtasks: hasSubtasks && subtasks.some((st) => st.trim()),
            });

            showToast(t('vaciar.savedPartial'), 'success');
            setIsSaving(false);
            return;
          }
          logger.error('Error guardando tarea principal:', mainTaskError);
          showToast(t('errors.saveTaskFailed'), 'error');
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
            showToast(t('vaciar.savedSubtasksError'), 'error');
            setIsSaving(false);
            return;
          }
        }
      }

      trackTaskCreated({
        priority: false,
        projectId: projectIdToSave,
        scheduledDate: selectedDate,
        hasSubtasks: hasSubtasks && subtasks.some((st) => st.trim()),
      });

      setHasTasks(true);

      setRecentTasks([taskInput.trim(), ...recentTasks.slice(0, 4)]);
      setTaskInput('');
      setHasSubtasks(false);
      setSubtasks(['']);
      setAssignToProject(null);
      setSelectedCategory('otros');
      setSelectedProjectId(null);
      setSelectedDate(null);
      setMoreOptionsExpanded(false);

      await loadRecentTaskSuggestions();
      
      // Cerrar tooltip después de agregar primera tarea
      if (showTooltip) {
        setShowTooltip(false);
      }

      const subtaskCount = subtasks.filter((st) => st.trim()).length;
      const message = hasSubtasks
        ? t('vaciarExtra.toastWithSubtasks', {
            count: subtaskCount,
            priority: t('vaciarExtra.toastWithSubtasksSuccess'),
          })
        : t('vaciarExtra.toastAdded');

      let reprioritized = false;
      if (hasCheckInToday) {
        try {
          await reprioritizeAfterTaskSave(user.id);
          reprioritized = true;
        } catch (reprioritizeError) {
          logger.error('Error repriorizando tras guardar tarea:', reprioritizeError);
        }
      }

      showToast(
        reprioritized
          ? t('vaciar.reprioritizedToast')
          : hasCheckInToday
            ? message
            : t('vaciarExtra.toastAddedGoFeel'),
        reprioritized || !hasCheckInToday ? 'info' : 'success',
      );
    } catch (error) {
      logger.error('Error inesperado:', error);
      showToast(t('errors.saveTaskFailed'), 'error');
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
      showToast(t('errors.updateFailed'), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const showOrganizePanel = useMemo(
    () =>
      !flowCardDismissed ||
      Boolean(user) ||
      (hasTasks === false && !optionalHintDismissed) ||
      (recentTaskSuggestions.length > 0 && !taskInput.trim()),
    [
      flowCardDismissed,
      user,
      hasTasks,
      optionalHintDismissed,
      recentTaskSuggestions.length,
      taskInput,
    ],
  );

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

        <Text style={styles.title}>{t('vaciar.title')}</Text>
        <Text style={styles.titleAccent}>{t('vaciar.titleAccent')}</Text>
        <Text style={styles.subtitle}>{t('vaciar.subtitle')}</Text>

        {showOrganizePanel ? (
          <View style={styles.organizePanelWrap}>
            <TouchableOpacity
              style={styles.organizePanelToggle}
              onPress={() => setOrganizePanelExpanded((e) => !e)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                organizePanelExpanded ? t('vaciar.organizePanelHide') : t('vaciar.organizePanelTitle')
              }
              accessibilityHint={t('vaciar.organizePanelHint')}
              accessibilityState={{ expanded: organizePanelExpanded }}
            >
              <Text style={styles.organizePanelToggleText}>
                {organizePanelExpanded ? t('vaciar.organizePanelHide') : t('vaciar.organizePanelTitle')}
              </Text>
              {organizePanelExpanded ? (
                <ChevronUp size={20} color={THEME.colors.gradient.blue} />
              ) : (
                <ChevronDown size={20} color={THEME.colors.gradient.blue} />
              )}
            </TouchableOpacity>
            {!organizePanelExpanded ? (
              <Text style={styles.organizePanelCollapsedHint}>{t('vaciar.organizePanelHint')}</Text>
            ) : null}
            {organizePanelExpanded ? (
              <View style={styles.organizePanelContent}>
                {!flowCardDismissed ? (
                  <TasksFlowCard onDismiss={() => void dismissFlowCard()} />
                ) : null}
                {user ? <ProjectsLibraryLink /> : null}
                {hasTasks === false && !optionalHintDismissed ? (
                  <View style={styles.optionalHintCard}>
                    <TouchableOpacity
                      style={styles.optionalHintHeader}
                      onPress={() => setOptionalHintExpanded((e) => !e)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={
                        optionalHintExpanded
                          ? t('vaciarExtra.a11yCollapseOptional')
                          : t('vaciarExtra.a11yExpandOptional')
                      }
                    >
                      <Text style={styles.optionalHintTitle}>{t('vaciar.optionalTitle')}</Text>
                      {optionalHintExpanded ? (
                        <ChevronUp size={20} color={THEME.colors.text.secondary} />
                      ) : (
                        <ChevronDown size={20} color={THEME.colors.text.secondary} />
                      )}
                    </TouchableOpacity>
                    {optionalHintExpanded ? (
                      <View style={styles.optionalHintBodyWrap}>
                        <Text style={styles.optionalHintBody}>{t('vaciar.optionalBody')}</Text>
                        <Text style={[styles.optionalHintBody, styles.optionalHintBodySecond]}>
                          {t('vaciar.optionalBodySecond')}
                        </Text>
                        <TouchableOpacity
                          onPress={() => void dismissOptionalHint()}
                          style={styles.optionalHintDismissBtn}
                          activeOpacity={0.75}
                          accessibilityRole="button"
                          accessibilityLabel={t('vaciarExtra.a11yDismissOptional')}
                        >
                          <Text style={styles.optionalHintDismissText}>{t('vaciar.dismiss')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.optionalHintCollapsedWrap}>
                        <Text style={styles.optionalHintCollapsedLine}>{t('vaciar.optionalCollapsed')}</Text>
                        <TouchableOpacity
                          onPress={() => void dismissOptionalHint()}
                          activeOpacity={0.75}
                          accessibilityRole="button"
                          accessibilityLabel={t('vaciarExtra.a11yDismissOptional')}
                        >
                          <Text style={styles.optionalHintDismissTextCompact}>{t('vaciar.dismiss')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : null}
                {recentTaskSuggestions.length > 0 && !taskInput.trim() ? (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>{t('vaciar.suggestionsTitle')}</Text>
                    <View style={styles.suggestionsGrid}>
                      {recentTaskSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionChip}
                          onPress={() => setTaskInput(suggestion)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={t('vaciarExtra.a11yUseSuggestion', { suggestion })}
                          accessibilityHint={t('vaciarExtra.a11yUseSuggestionHint')}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Banner: con tareas guardadas, el siguiente paso es Sentir */}
        {hasTasks === true && hasCheckInToday === false && hasCheckInToday !== null && (
          <TouchableOpacity
            style={styles.checkInBanner}
            onPress={() => router.push('/(tabs)/sentir')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('vaciarExtra.a11yNextStepFeel')}
            accessibilityHint={t('vaciarExtra.a11yNextStepFeelHint')}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkInBannerGradient}
            >
              <Sparkles size={20} color={THEME.colors.onGradient} />
              <View style={styles.checkInBannerContent}>
                <Text style={styles.checkInBannerText}>{t('vaciar.nextStepFeel')}</Text>
                <Text style={styles.checkInBannerSubtext}>{t('vaciar.nextStepFeelSub')}</Text>
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
            placeholder={t('vaciar.placeholder')}
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
            accessibilityLabel={t('vaciarExtra.a11yTaskField')}
            accessibilityHint={t('vaciarExtra.a11yTaskFieldHint')}
          />
        </View>

        {Platform.OS !== 'web' && !dictateHintDismissed ? (
          <View style={styles.dictateHintRow}>
            <Text style={styles.dictateHintText}>{t('vaciarExtra.dictateHint')}</Text>
            <TouchableOpacity
              onPress={() => void dismissDictateHint()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('vaciarExtra.a11yDismissDictateHint')}
            >
              <X size={16} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Sugerencias movidas al panel Organizar (opcional) */}

        {taskInput.trim() ? (
          <View style={styles.quickCaptureRow}>
            <TouchableOpacity
              style={[
                styles.optionalExtrasCard,
                moreOptionsExpanded && styles.optionalExtrasCardExpanded,
              ]}
              onPress={() => setMoreOptionsExpanded((e) => !e)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                moreOptionsExpanded ? t('vaciar.lessOptions') : t('vaciar.moreOptions')
              }
              accessibilityHint={t('vaciarExtra.a11yOpenOptionsHint')}
            >
              <View style={styles.optionalExtrasIcons}>
                <View style={styles.optionalExtrasIconBubble}>
                  <FolderKanban size={16} color={THEME.colors.gradient.blue} />
                </View>
                <View style={styles.optionalExtrasIconBubble}>
                  <Calendar size={16} color={THEME.colors.gradient.pink} />
                </View>
              </View>
              <View style={styles.optionalExtrasTextWrap}>
                <Text style={styles.optionalExtrasTitle}>
                  {moreOptionsExpanded ? t('vaciar.lessOptions') : t('vaciar.moreOptions')}
                </Text>
                {!moreOptionsExpanded ? (
                  <Text style={styles.optionalExtrasSub}>{t('vaciar.moreOptionsSub')}</Text>
                ) : null}
              </View>
              {moreOptionsExpanded ? (
                <ChevronUp size={20} color={THEME.colors.gradient.blue} />
              ) : (
                <ChevronDown size={20} color={THEME.colors.gradient.blue} />
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {taskInput.trim() && !moreOptionsExpanded ? (
          <Text style={styles.quickCaptureHint}>{t('vaciar.quickCaptureHint')}</Text>
        ) : null}

        {/* ¿Asignar a un proyecto? Sí / No */}
        {taskInput.trim() && moreOptionsExpanded ? (
          <View style={styles.assignSection}>
            <Text style={styles.assignQuestion}>{t('vaciar.assignQuestion')}</Text>
            <View style={styles.assignButtonsRow}>
              <TouchableOpacity
                style={[styles.assignButton, styles.assignButtonYes, assignToProject === true && styles.assignButtonYesSelected]}
                onPress={() => {
                  setAssignToProject(true);
                  setSelectedCategory('otros');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('vaciarExtra.a11yAssignYes')}
              >
                <Text style={[styles.assignButtonText, assignToProject === true ? styles.assignButtonTextSelectedYes : null]}>
                  {t('errors.yes')}
                </Text>
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
                accessibilityLabel={t('vaciarExtra.a11yAssignNo')}
              >
                <Text
                  style={[
                    styles.assignButtonText,
                    assignToProject === false ? styles.assignButtonTextSelectedYes : null,
                  ]}
                >
                  {t('errors.no')}
                </Text>
              </TouchableOpacity>
            </View>

            {assignToProject === false && (
              <View style={styles.categorySection}>
                <Text style={styles.categorySectionLabel}>{t('vaciar.chooseCategory')}</Text>
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
                        accessibilityLabel={`${t(`categories.${opt.key}`)}${isSelected ? t('vaciarExtra.a11ySelected') : ''}`}
                      >
                        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                          {t(`categories.${opt.key}`)}
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
                  onSuccess={(projectName) =>
                    showToast(t('vaciar.projectCreated', { name: projectName }), 'success')
                  }
                />
                <TouchableOpacity
                  style={[styles.subtasksToggle, hasSubtasks && styles.subtasksToggleActive]}
                  onPress={() => {
                    setHasSubtasks(!hasSubtasks);
                    if (!hasSubtasks) setSubtasks(['']);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="switch"
                  accessibilityLabel={hasSubtasks ? t('vaciarExtra.a11ySubtasksOn') : t('vaciarExtra.a11ySubtasksOff')}
                  accessibilityState={{ checked: hasSubtasks }}
                >
                  {hasSubtasks ? <ChevronUp size={20} color={THEME.colors.gradient.blue} /> : <ChevronDown size={20} color={THEME.colors.text.secondary} />}
                  <Text style={[styles.subtasksToggleText, hasSubtasks && styles.subtasksToggleTextActive]}>
                    {t('vaciar.subtasksToggle')}
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
                            placeholder={t('vaciar.subtaskPlaceholder', { n: index + 1 })}
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
                      <Text style={styles.addSubtaskText}>{t('vaciar.addSubtask')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}

        {taskInput.trim() && moreOptionsExpanded ? (
          <View style={styles.opcionesSection}>
            <Text style={styles.opcionesHeaderText}>{t('vaciar.options')}</Text>
            <Text style={styles.opcionesHeaderHint}>{t('vaciar.optionsHint')}</Text>
            <View style={styles.opcionesContent}>
              <DateSelector
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                calendarTaskTitle={taskInput}
                calendarTaskId={`vaciar-draft-${selectedDate ?? 'none'}`}
              />
            </View>
          </View>
        ) : null}

        <GradientButton
          title={isSaving ? t('vaciar.saving') : t('vaciar.saveTask')}
          onPress={handleAddTask}
          disabled={!taskInput.trim() || isSaving}
          accessibilityHint={t('vaciarExtra.a11ySaveTaskHint')}
        />

        {recentTasks.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>{t('vaciar.recentTitle')}</Text>
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
        title={t('vaciar.brainDumpTooltipTitle')}
        message={t('vaciar.brainDumpTooltipMessage')}
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
  organizePanelWrap: {
    marginBottom: THEME.spacing.md,
  },
  organizePanelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
  },
  organizePanelToggleText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  organizePanelCollapsedHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
    lineHeight: 18,
  },
  organizePanelContent: {
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
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
  quickCaptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
    flexShrink: 1,
  },
  priorityChipActive: {
    borderColor: THEME.colors.gradient.pink,
    backgroundColor: THEME.colors.tint.pink.soft,
  },
  priorityChipText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  priorityChipTextActive: {
    color: THEME.colors.gradient.pink,
  },
  optionalExtrasCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
  },
  optionalExtrasCardExpanded: {
    backgroundColor: THEME.colors.fill[200],
    borderColor: THEME.colors.stroke[100],
  },
  optionalExtrasIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  optionalExtrasIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalExtrasTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionalExtrasTitle: {
    ...THEME.typography.body,
    fontSize: 15,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  optionalExtrasSub: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: 2,
    lineHeight: 17,
  },
  quickCaptureHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    marginBottom: THEME.spacing.md,
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
  dictateHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xs,
  },
  dictateHintText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
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
