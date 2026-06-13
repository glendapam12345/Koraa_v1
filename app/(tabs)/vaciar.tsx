import { View, StyleSheet, RefreshControl, Keyboard } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { THEME } from '@/constants/theme';
import { Toast } from '@/components/Toast';
import { VaciarCaptureForm } from '@/components/tasks/VaciarCaptureForm';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsLibraryPanel } from '@/components/projects/ProjectsLibraryPanel';
import { VaciarTabSegments, type VaciarTabSegment } from '@/components/tasks/VaciarTabSegments';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { useVaciarHints } from '@/hooks/useVaciarHints';
import { useVaciarTaskSave } from '@/hooks/useVaciarTaskSave';
import { useTaskCaptureAi } from '@/hooks/useTaskCaptureAi';
import { TaskCaptureAiPreview } from '@/components/tasks/TaskCaptureAiPreview';
import { createTasksFromCapture } from '@/lib/createTasksFromCapture';
import { getLocalDateString } from '@/lib/dateLocal';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

export default function VaciarScreen() {
  const { t, locale } = useI18n();
  const { suggestion, date: dateParam, projectId: projectIdParam, segment: segmentParam } =
    useLocalSearchParams<{
      suggestion?: string;
      date?: string;
      projectId?: string;
      segment?: string;
    }>();
  const [segment, setSegment] = useState<VaciarTabSegment>('capture');
  const [taskInput, setTaskInput] = useState('');
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [recentTaskSuggestions, setRecentTaskSuggestions] = useState<string[]>([]);
  /** true = proyecto, false = tarea suelta con categoría */
  const [assignToProject, setAssignToProject] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('otros');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [effortFeel, setEffortFeel] = useState<TaskEffort | null>(null);
  const [, setProjectCount] = useState<number | null>(null);
  const { user } = useAuth();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const loadRecentTaskSuggestions = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('content')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        logger.error('Error cargando sugerencias:', error);
        return;
      }

      if (data) {
        const uniqueTasks = Array.from(new Set(data.map((row) => row.content.trim())));
        setRecentTaskSuggestions(uniqueTasks.slice(0, 3));
      }
    } catch (error) {
      logger.error('Error inesperado:', error);
    }
  }, []);

  const { hasCheckInToday, refresh: refreshCheckInToday } = useHasCheckInToday(user?.id);
  const { setHasTasks, loadHintState, dictateHintDismissed, dismissDictateHint } =
    useVaciarHints(user?.id);

  const resetTaskForm = useCallback(() => {
    setTaskInput('');
    setHasSubtasks(false);
    setSubtasks(['']);
    setEffortFeel(null);
  }, []);

  const handleTaskSaved = useCallback(
    async (_payload: { savedTitle: string }) => {
      setHasTasks(true);
      resetTaskForm();
      setAssignToProject(false);
      setSelectedProjectId(null);
      setSelectedCategory('otros');
      setSelectedDate(null);
      await loadRecentTaskSuggestions();
    },
    [loadRecentTaskSuggestions, resetTaskForm, setHasTasks],
  );

  const { isSaving, saveTask } = useVaciarTaskSave({
    hasCheckInToday,
    showToast,
    onSaved: handleTaskSaved,
  });

  const { preview, isInterpreting, interpret, clearPreview } = useTaskCaptureAi();
  const [isSavingCapture, setIsSavingCapture] = useState(false);

  const formatPreviewDate = useCallback(
    (dateStr: string | null) => {
      if (!dateStr) return '';
      const monthNames =
        locale === 'en'
          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const todayStr = getLocalDateString();
      if (dateStr === todayStr) return t('components.today');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (dateStr === getLocalDateString(tomorrow)) return t('components.tomorrow');
      const day = dateStr.slice(8);
      const month = monthNames[parseInt(dateStr.slice(5, 7), 10) - 1];
      return `${day} ${month}`;
    },
    [locale, t],
  );

  const handleInterpretAi = useCallback(() => {
    Keyboard.dismiss();
    void interpret(taskInput);
  }, [interpret, taskInput]);

  const handleConfirmAiPreview = useCallback(async () => {
    if (!preview) return;
    setIsSavingCapture(true);
    try {
      const result = await createTasksFromCapture(preview, {
        locale,
        hasCheckInToday: Boolean(hasCheckInToday),
      });
      if (result.status === 'not_authenticated') {
        showToast(t('errors.notAuthenticated'), 'error');
        return;
      }
      if (result.status === 'error') {
        showToast(t('errors.saveTaskFailed'), 'error');
        return;
      }
      clearPreview();
      await handleTaskSaved({ savedTitle: result.savedTitle });
      const msg = t('vaciar.aiSavedBatch', { count: result.tasksCreated });
      showToast(
        result.reprioritized ? `${msg} ${t('vaciar.suggestionsUpdatedToast')}` : msg,
        'success',
      );
    } catch (error) {
      logger.error('Error guardando captura IA:', error);
      showToast(t('errors.saveTaskFailed'), 'error');
    } finally {
      setIsSavingCapture(false);
    }
  }, [clearPreview, handleTaskSaved, hasCheckInToday, locale, preview, showToast, t]);

  const handleApplyAiToForm = useCallback(() => {
    if (!preview) return;
    setTaskInput(preview.main_task.content);
    setSelectedDate(preview.main_task.scheduled_date);
    if (preview.main_task.effort) {
      setEffortFeel(preview.main_task.effort);
    }
    clearPreview();
    if (preview.prep_steps.length > 0) {
      showToast(t('vaciar.aiApplyPartial'), 'info');
    }
  }, [clearPreview, preview, showToast, t]);

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
      setSegment('capture');
    }
    if (suggestion || dateParam) {
      setSegment('capture');
    }
  }, [suggestion, dateParam, projectIdParam]);

  useEffect(() => {
    if (segmentParam === 'projects') {
      setSegment('projects');
    } else if (segmentParam === 'capture') {
      setSegment('capture');
    }
  }, [segmentParam]);

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

  useEffect(() => {
    void refreshCheckInToday();
    void loadHintState();
    void loadRecentTaskSuggestions();
  }, [refreshCheckInToday, loadHintState, loadRecentTaskSuggestions]);

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
      void refreshCheckInToday();
      void loadHintState();
      void loadProjectCount();
    }, [loadProjectCount, refreshCheckInToday, loadHintState]),
  );

  const handleAddTask = () => {
    Keyboard.dismiss();
    void saveTask(
      {
        content: taskInput,
        hasSubtasks,
        subtasks,
        assignToProject,
        selectedCategory,
        selectedProjectId,
        selectedDate,
      },
      { effortFeel },
    );
  };

  // Función para manejar pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshCheckInToday(),
        loadHintState(),
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

  const isCaptureSegment = segment === 'capture';
  const hasTaskText = Boolean(taskInput.trim());
  const saveBlocked =
    !hasTaskText || isSaving || (assignToProject && !selectedProjectId);

  return (
    <View style={styles.container}>
      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage(null)}
        />
      )}

      <View style={styles.screenBody}>
        <CalmScreen
          scroll={!isCaptureSegment}
          topInset={isCaptureSegment ? 'md' : 'lg'}
          gap={isCaptureSegment ? THEME.spacing.sm : THEME.layout.tabSectionGap}
          contentStyle={isCaptureSegment ? styles.captureContent : undefined}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          refreshControl={
            !isCaptureSegment ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={THEME.colors.calm.lavenderDeep}
              />
            ) : undefined
          }
        >
        {!isCaptureSegment ? (
          <ScreenHeader
            title={t('projects.title')}
            subtitle={t('projects.subtitle')}
          />
        ) : (
          <ScreenHeader
            title={t('vaciar.title')}
            subtitle={t('vaciar.captureHint')}
            compact
          />
        )}

        {user ? <VaciarTabSegments value={segment} onChange={setSegment} /> : null}

        {segment === 'capture' && user ? (
          <VaciarCaptureForm
            userId={user.id}
            taskInput={taskInput}
            onTaskInputChange={setTaskInput}
            assignToProject={assignToProject}
            onAssignToProjectChange={(value) => {
              setAssignToProject(value);
              if (!value) {
                setSelectedProjectId(null);
                setHasSubtasks(false);
                setSubtasks(['']);
              } else {
                setSelectedCategory('otros');
              }
            }}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedProjectId={selectedProjectId}
            onProjectChange={(id) => {
              setSelectedProjectId(id);
              setAssignToProject(Boolean(id));
              if (!id) {
                setHasSubtasks(false);
                setSubtasks(['']);
              }
            }}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            hasSubtasks={hasSubtasks}
            onHasSubtasksChange={setHasSubtasks}
            subtasks={subtasks}
            onSubtasksChange={setSubtasks}
            onAddSubtask={addSubtask}
            onRemoveSubtask={removeSubtask}
            isSaving={isSaving}
            saveBlocked={saveBlocked}
            onSave={handleAddTask}
            onProjectError={(message) => showToast(message, 'error')}
            onProjectCreated={(name) =>
              showToast(t('vaciar.projectCreated', { name }), 'success')
            }
            recentSuggestions={recentTaskSuggestions}
            effortFeel={effortFeel}
            onEffortChange={setEffortFeel}
            onInterpretAi={handleInterpretAi}
            isInterpreting={isInterpreting}
            onVoiceNotice={(message) => showToast(message, 'info')}
            dictateHintDismissed={dictateHintDismissed}
            onDismissDictateHint={() => void dismissDictateHint()}
          />
        ) : (
          <ProjectsLibraryPanel
            embedded
            userId={user?.id}
            onGoCapture={() => setSegment('capture')}
            onAddTaskToProject={(projectId) => {
              setSegment('capture');
              if (projectId) {
                setAssignToProject(true);
                setSelectedProjectId(projectId);
              } else {
                setAssignToProject(false);
                setSelectedProjectId(null);
              }
            }}
          />
        )}
        </CalmScreen>
      </View>

      <TaskCaptureAiPreview
        visible={Boolean(preview)}
        capture={preview}
        isSaving={isSavingCapture}
        onConfirm={() => void handleConfirmAiPreview()}
        onApplyToForm={handleApplyAiToForm}
        onClose={clearPreview}
        formatDate={formatPreviewDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  screenBody: {
    flex: 1,
  },
  captureContent: {
    flex: 1,
  },
  valueProp: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 20,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
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
    ...THEME.surfaces.panel,
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
    ...THEME.surfaces.elevated,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
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
    ...THEME.surfaces.chip,
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
    ...THEME.surfaces.panel,
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
    ...THEME.surfaces.chip,
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
    ...THEME.surfaces.chip,
    borderWidth: 2,
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
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.pill,
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
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
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
    borderTopColor: THEME.colors.calm.border,
  },
  inputContainer: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    minHeight: 120,
    fontSize: 16,
  },
  inputCompact: {
    minHeight: 80,
  },
  recentContainer: {
    marginTop: THEME.spacing.lg,
  },
  recentTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  recentItem: {
    ...THEME.surfaces.muted,
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
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
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
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
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
    ...THEME.surfaces.panel,
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
  checkInLinkWrap: {
    alignSelf: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  checkInLink: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
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
    gap: THEME.spacing.xs,
  },
  suggestionsTitle: {
    ...THEME.typography.sectionTitle,
    fontSize: 16,
    lineHeight: 22,
    color: THEME.colors.text.main,
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
    ...THEME.surfaces.chip,
  },
  suggestionText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
  },
  flowGuide: {
    ...THEME.surfaces.panel,
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
