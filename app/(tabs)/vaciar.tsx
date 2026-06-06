import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '@/constants/theme';
import { Tooltip } from '@/components/Tooltip';
import { Toast } from '@/components/Toast';
import { TaskCaptureOrganize } from '@/components/tasks/TaskCaptureOrganize';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { TasksFlowCard } from '@/components/tasks/TasksFlowCard';
import { FlowIndicator, resolveFlowStep } from '@/components/FlowIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsLibraryLink } from '@/components/projects/ProjectsLibraryLink';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { useI18n } from '@/contexts/I18nContext';
import { X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { useVaciarHints } from '@/hooks/useVaciarHints';
import { useVaciarTaskSave } from '@/hooks/useVaciarTaskSave';
import { TaskEffortPicker } from '@/components/tasks/TaskEffortPicker';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

export default function VaciarScreen() {
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
  const [optionalHintExpanded, setOptionalHintExpanded] = useState(false);
  const [organizePanelExpanded, setOrganizePanelExpanded] = useState(false);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  void setShowDatePicker;
  void showDatePicker;
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
  const {
    hasTasks,
    setHasTasks,
    optionalHintDismissed,
    flowCardDismissed,
    dictateHintDismissed,
    showTooltip,
    setShowTooltip,
    loadHintState,
    dismissFlowCard,
    dismissDictateHint,
    dismissOptionalHint,
  } = useVaciarHints(user?.id);

  const resetTaskForm = useCallback(() => {
    setTaskInput('');
    setHasSubtasks(false);
    setSubtasks(['']);
    setAssignToProject(false);
    setSelectedCategory('otros');
    setSelectedProjectId(null);
    setSelectedDate(null);
    setEffortFeel(null);
  }, []);

  const handleTaskSaved = useCallback(
    async ({ savedTitle }: { savedTitle: string }) => {
      setHasTasks(true);
      setRecentTasks((prev) => [savedTitle, ...prev.slice(0, 4)]);
      resetTaskForm();
      await loadRecentTaskSuggestions();
      if (showTooltip) setShowTooltip(false);
    },
    [loadRecentTaskSuggestions, resetTaskForm, setHasTasks, setShowTooltip, showTooltip],
  );

  const { isSaving, saveTask } = useVaciarTaskSave({
    hasCheckInToday,
    showToast,
    onSaved: handleTaskSaved,
  });

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

      <CalmScreen
        topInset="lg"
        gap={THEME.layout.sectionGap}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentStyle={{ paddingBottom: THEME.spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.calm.lavenderDeep}
          />
        }
      >
        <ScreenHeader title={t('vaciar.title')} subtitle={t('vaciar.subtitle')} />
        <Text style={styles.valueProp}>{t('vaciar.valueProp')}</Text>

        <FlowIndicator
          currentStep={resolveFlowStep({
            hasCheckIn: hasCheckInToday === true,
            hasTasks: hasTasks === true,
          })}
        />

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
        {hasTasks === true && hasCheckInToday === false && hasCheckInToday !== null ? (
          <TouchableOpacity
            style={styles.checkInLinkWrap}
            onPress={() => router.push(CHECK_IN_ROUTE)}
            activeOpacity={0.75}
            accessibilityRole="link"
            accessibilityLabel={t('vaciar.nextStepFeelLink')}
            accessibilityHint={t('vaciarExtra.a11yNextStepFeelHint')}
          >
            <Text style={styles.checkInLink}>{t('vaciar.nextStepFeelLink')}</Text>
          </TouchableOpacity>
        ) : null}

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

        {taskInput.trim() ? (
          <TaskEffortPicker value={effortFeel} onChange={setEffortFeel} />
        ) : null}

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

        {taskInput.trim() && user ? (
          <TaskCaptureOrganize
            userId={user.id}
            taskTitle={taskInput.trim()}
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
            onProjectChange={setSelectedProjectId}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            hasSubtasks={hasSubtasks}
            onHasSubtasksChange={(value) => {
              setHasSubtasks(value);
              if (value) setSubtasks(['']);
            }}
            subtasks={subtasks}
            onSubtasksChange={setSubtasks}
            onAddSubtask={addSubtask}
            onRemoveSubtask={removeSubtask}
            onBlurInput={() => taskInputRef.current?.blur()}
            onProjectError={(message) => showToast(message, 'error')}
            onProjectCreated={(name) =>
              showToast(t('vaciar.projectCreated', { name }), 'success')
            }
          />
        ) : null}

        <CalmPrimaryButton
          label={isSaving ? t('vaciar.saving') : t('vaciar.saveTask')}
          onPress={handleAddTask}
          disabled={!taskInput.trim() || isSaving}
          loading={isSaving}
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
      </CalmScreen>

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
    backgroundColor: THEME.colors.calm.background,
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
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
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
