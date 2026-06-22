import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Calendar, Clock, Flag, ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { DateSelector } from '@/components/tasks/DateSelector';
import { TaskEffortPicker } from '@/components/tasks/TaskEffortPicker';
import { TaskDurationStepper } from '@/components/vnext/TaskDurationStepper';
import { VnextSelectableChip } from '@/components/vnext/VnextSelectableChip';
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm';
import type { Task } from '@/components/tasks/TaskCard';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';
import { getPerceivedEffort, loadTaskEffortMap } from '@/lib/taskPerceivedEffort';
import {
  effortToDefaultMinutes,
  getTaskPlanningMeta,
  loadTaskPlanningMetaMap,
} from '@/lib/taskPlanningMeta';
import { getProjectEmoji } from '@/lib/projectEmoji';
import { energyFromEffort, type TaskPlanEditPayload } from '@/lib/vnext/saveTaskPlanEdit';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import {
  listActiveLifeAreas,
  type ResolvedLifeArea,
} from '@/lib/lifeAreas/userLifeAreas';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { TranslationKey } from '@/lib/i18n';
import {
  CAPTURE_PRIORITY_ORDER,
  capturePriorityToIsPriority,
  type CapturePriority,
} from '@/lib/review/capturePriority';
import { formatProjectDueDate } from '@/lib/projectProgress';

type TaskPlanEditSheetProps = {
  visible: boolean;
  task: Task | null;
  projects?: { id: string; name: string }[];
  userId?: string;
  onProjectCreated?: (project: { id: string; name: string }) => void;
  onSave: (payload: TaskPlanEditPayload) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
};

const PRIORITY_LABEL_KEYS: Record<CapturePriority, TranslationKey> = {
  low: 'vaciar.capturePriorityLow',
  medium: 'vaciar.capturePriorityMedium',
  high: 'vaciar.capturePriorityHigh',
  urgent: 'vaciar.capturePriorityUrgent',
};

function resolveTaskPriority(task: Task): CapturePriority {
  if (task.is_priority) return 'high';
  return 'medium';
}

export function TaskPlanEditSheet({
  visible,
  task,
  projects = [],
  userId: userIdProp,
  onProjectCreated,
  onSave,
  onDelete,
  onClose,
  saving = false,
}: TaskPlanEditSheetProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = userIdProp ?? user?.id;
  const { config: lifeAreasConfig } = useUserLifeAreas(userId);
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState(projects);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState<string>(PROJECT_COLORS[0]);
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectLifeArea, setNewProjectLifeArea] = useState<LifeAreaRef>('other');
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [lifeAreaKey, setLifeAreaKey] = useState<LifeAreaRef | null>(null);
  const [capturePriority, setCapturePriority] = useState<CapturePriority>('medium');
  const [effort, setEffort] = useState<TaskEffort | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [notes, setNotes] = useState('');
  const [metaReady, setMetaReady] = useState(false);
  const [activePicker, setActivePicker] = useState<'date' | 'duration' | 'priority' | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalProjects(projects);
    }
  }, [visible, projects]);

  useEffect(() => {
    if (!visible || !task) return;

    setContent(task.content);
    setScheduledDate(task.scheduled_date ?? null);
    setProjectId(task.project_id ?? null);
    setLifeAreaKey((task.life_area_key as LifeAreaRef | null) ?? null);
    setCapturePriority(resolveTaskPriority(task));
    setEffort(task.perceivedEffort ?? getPerceivedEffort(task.id) ?? null);
    const planning = getTaskPlanningMeta(task.id);
    setEstimatedMinutes(
      planning.estimatedMinutes || effortToDefaultMinutes(task.perceivedEffort ?? undefined),
    );
    setNotes(planning.notes);
    setActivePicker(null);
    setShowMoreOptions(false);
    setShowCreateProject(false);
    setCreateProjectError(null);
    setCreatingProject(false);
    setMetaReady(true);

    let cancelled = false;
    void (async () => {
      await Promise.all([loadTaskEffortMap(), loadTaskPlanningMetaMap()]);
      if (cancelled) return;
      const perceived = getPerceivedEffort(task.id) ?? task.perceivedEffort ?? null;
      const loadedPlanning = getTaskPlanningMeta(task.id);
      setEffort(perceived);
      setEstimatedMinutes(
        loadedPlanning.estimatedMinutes || effortToDefaultMinutes(perceived ?? undefined),
      );
      setNotes(loadedPlanning.notes);
    })();
    return () => {
      cancelled = true;
      setMetaReady(false);
    };
  }, [task, visible]);

  const resetCreateProjectForm = () => {
    setShowCreateProject(false);
    setNewProjectName('');
    setNewProjectColor(PROJECT_COLORS[0]);
    setNewProjectDueDate('');
    setNewProjectLifeArea('other');
    setCreateProjectError(null);
    setCreatingProject(false);
  };

  const handleCreateProject = async () => {
    if (!userId) return;

    setCreatingProject(true);
    setCreateProjectError(null);
    try {
      const result = await createProjectForUser({
        userId,
        name: newProjectName,
        color: newProjectColor,
        dueDateRaw: newProjectDueDate,
        lifeAreaKey: newProjectLifeArea,
        existingNames: localProjects.map((entry) => entry.name),
        locale,
      });

      if (!result.ok) {
        setCreateProjectError(createProjectErrorMessage(result.reason, locale));
        return;
      }

      const created = { id: result.project.id, name: result.project.name };
      setLocalProjects((current) => [...current, created]);
      setProjectId(created.id);
      setLifeAreaKey(null);
      onProjectCreated?.(created);
      resetCreateProjectForm();
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeletePress = () => {
    if (!onDelete) return;
    Alert.alert(t('vnext.taskEditDeleteTitle'), t('vnext.taskEditDeleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('vnext.taskEditDeleteConfirm'),
        style: 'destructive',
        onPress: () => void onDelete(),
      },
    ]);
  };

  const isPriority = capturePriorityToIsPriority(capturePriority);
  const canSave = Boolean(task && content.trim() && metaReady && !saving);

  const selectableAreas: ResolvedLifeArea[] = listActiveLifeAreas(
    lifeAreasConfig,
    (key) => t(`lifeAreas.${key}` as TranslationKey),
    (presetCustomId) => t(`lifeAreasPreset.${presetCustomId}` as TranslationKey),
    lifeAreaKey,
  );

  const durationLabel = t('vaciar.previewDurationMinutes', { count: estimatedMinutes });
  const priorityLabel = t(PRIORITY_LABEL_KEYS[capturePriority]);
  const datePillLabel = scheduledDate
    ? formatProjectDueDate(scheduledDate, locale)
    : t('vaciar.previewDateBtn');

  const togglePicker = (picker: 'date' | 'duration' | 'priority') => {
    setActivePicker((current) => (current === picker ? null : picker));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTap}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('components.editTaskModalCloseA11y')}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, THEME.spacing.md) }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('vnext.taskEditTitle')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <X size={22} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              bounces={false}
            >
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={setContent}
                placeholder={t('components.editTaskPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                multiline
              />

              <View style={styles.quickPills}>
                <TouchableOpacity
                  style={[styles.quickPill, activePicker === 'date' && styles.quickPillActive]}
                  onPress={() => togglePicker('date')}
                  activeOpacity={0.85}
                >
                  <Calendar size={14} color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.quickPillText} numberOfLines={1}>
                    {datePillLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickPill, activePicker === 'duration' && styles.quickPillActive]}
                  onPress={() => togglePicker('duration')}
                  activeOpacity={0.85}
                >
                  <Clock size={14} color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.quickPillText} numberOfLines={1}>
                    {durationLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickPill, activePicker === 'priority' && styles.quickPillActive]}
                  onPress={() => togglePicker('priority')}
                  activeOpacity={0.85}
                >
                  <Flag size={14} color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.quickPillText} numberOfLines={1}>
                    {priorityLabel}
                  </Text>
                </TouchableOpacity>
              </View>

              {activePicker === 'date' ? (
                <View style={styles.pickerWrap}>
                  <DateSelector
                    selectedDate={scheduledDate}
                    onSelect={setScheduledDate}
                    compact
                    hideLabel
                  />
                </View>
              ) : null}

              {activePicker === 'duration' ? (
                <View style={styles.pickerWrap}>
                  <TaskDurationStepper
                    minutes={estimatedMinutes}
                    onChange={setEstimatedMinutes}
                    compact
                  />
                </View>
              ) : null}

              {activePicker === 'priority' ? (
                <View style={styles.pickerWrap}>
                  <View style={styles.chipRow}>
                    {CAPTURE_PRIORITY_ORDER.map((priority) => (
                      <VnextSelectableChip
                        key={priority}
                        label={t(PRIORITY_LABEL_KEYS[priority])}
                        emoji={priority === 'urgent' ? '🔥' : priority === 'high' ? '⭐' : undefined}
                        selected={capturePriority === priority}
                        onPress={() => setCapturePriority(priority)}
                      />
                    ))}
                  </View>
                  {capturePriority === 'urgent' ? (
                    <Text style={styles.urgentHint}>{t('vaciar.capturePriorityUrgentHint')}</Text>
                  ) : null}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.moreToggle}
                onPress={() => setShowMoreOptions((v) => !v)}
                activeOpacity={0.85}
              >
                <Text style={styles.moreToggleText}>{t('vnext.taskEditMoreOptions')}</Text>
                {showMoreOptions ? (
                  <ChevronUp size={16} color={THEME.colors.calm.lavenderDeep} />
                ) : (
                  <ChevronDown size={16} color={THEME.colors.calm.lavenderDeep} />
                )}
              </TouchableOpacity>

              {showMoreOptions ? (
                <>
                  {userId ? (
                    <View style={styles.section}>
                      <Text style={styles.label}>{t('vnext.taskEditFront')}</Text>
                      <Text style={styles.hint}>{t('vnext.taskEditFrontHint')}</Text>
                      {showCreateProject ? (
                        <ProjectCreateForm
                          embedded
                          name={newProjectName}
                          color={newProjectColor}
                          dueDate={newProjectDueDate}
                          lifeAreaKey={newProjectLifeArea}
                          error={createProjectError}
                          saving={creatingProject}
                          onNameChange={setNewProjectName}
                          onColorChange={setNewProjectColor}
                          onDueDateChange={setNewProjectDueDate}
                          onLifeAreaChange={setNewProjectLifeArea}
                          onCancel={resetCreateProjectForm}
                          onSubmit={() => void handleCreateProject()}
                        />
                      ) : (
                        <View style={styles.chipRow}>
                          <VnextSelectableChip
                            label={t('projectsUi.looseTitle')}
                            selected={!projectId}
                            onPress={() => {
                              setProjectId(null);
                            }}
                          />
                          {localProjects.map((project) => (
                            <VnextSelectableChip
                              key={project.id}
                              label={project.name}
                              emoji={getProjectEmoji(project.name)}
                              selected={projectId === project.id}
                              onPress={() => {
                                setProjectId(project.id);
                                setLifeAreaKey(null);
                              }}
                            />
                          ))}
                          <TouchableOpacity
                            style={styles.newProjectChip}
                            onPress={() => setShowCreateProject(true)}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel={t('projects.createProjectA11y')}
                          >
                            <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
                            <Text style={styles.newProjectChipText}>{t('projects.newProject')}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ) : null}

                  {!projectId ? (
                    <View style={styles.section}>
                      <Text style={styles.label}>{t('vnext.taskEditLifeArea')}</Text>
                      <Text style={styles.hint}>{t('vnext.taskEditLifeAreaHint')}</Text>
                      <View style={styles.chipRow}>
                        {selectableAreas.map((area) => (
                          <VnextSelectableChip
                            key={area.ref}
                            label={area.name}
                            emoji={area.emoji}
                            selected={
                              lifeAreaKey === area.ref ||
                              (lifeAreaKey == null && area.ref === 'other')
                            }
                            onPress={() => setLifeAreaKey(area.ref)}
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.section}>
                    <TaskEffortPicker value={effort} onChange={setEffort} variant="segment" />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>{t('vnext.taskEditNotes')}</Text>
                    <TextInput
                      style={[styles.input, styles.notesInput]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder={t('vnext.taskEditNotesPlaceholder')}
                      placeholderTextColor={THEME.colors.text.tertiary}
                      multiline
                    />
                  </View>

                  {onDelete ? (
                    <TouchableOpacity
                      onPress={handleDeletePress}
                      style={styles.deleteBtn}
                      accessibilityRole="button"
                    >
                      <Text style={styles.deleteText}>{t('vnext.taskEditDelete')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}
            </ScrollView>

            <CalmPrimaryButton
              label={t('common.save')}
              onPress={() => {
                if (!task || !canSave) return;
                void onSave({
                  taskId: task.id,
                  content: content.trim(),
                  scheduledDate,
                  projectId,
                  effort,
                  isPriority,
                  lifeAreaKey: projectId ? null : lifeAreaKey,
                  planning: {
                    estimatedMinutes,
                    energyRequired: energyFromEffort(effort),
                    notes: notes.trim(),
                  },
                });
              }}
              disabled={!canSave}
              loading={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  keyboard: {
    justifyContent: 'flex-end',
    maxHeight: '82%',
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    flex: 1,
  },
  closeBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollBody: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
  },
  section: {
    gap: 8,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    minHeight: 44,
    maxHeight: 88,
    lineHeight: 22,
  },
  notesInput: {
    minHeight: 64,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  quickPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
  },
  quickPillActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  quickPillText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    flexShrink: 1,
    lineHeight: 16,
  },
  pickerWrap: {
    gap: THEME.spacing.xs,
  },
  urgentHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    minHeight: 36,
  },
  moreToggleText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  newProjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    borderStyle: 'dashed',
    minHeight: 36,
  },
  newProjectChipText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  deleteText: {
    ...THEME.typography.body,
    color: THEME.colors.semantic.danger,
    fontFamily: THEME.fonts.heading.medium,
  },
});
