import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Pressable,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, FolderKanban, Plus, Calendar, Clock, Flag } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm';
import { DateSelector } from '@/components/tasks/DateSelector';
import { TaskEffortPicker } from '@/components/tasks/TaskEffortPicker';
import { TaskDurationStepper } from '@/components/vnext/TaskDurationStepper';
import { VnextSelectableChip } from '@/components/vnext/VnextSelectableChip';
import { createVaciarTask } from '@/lib/vaciarCreateTask';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { getLocalDateString, getEndOfWeekLocalDateString } from '@/lib/dateLocal';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { listActiveLifeAreas } from '@/lib/lifeAreas/userLifeAreas';
import type { TranslationKey } from '@/lib/i18n';
import {
  CAPTURE_PRIORITY_ORDER,
  capturePriorityToIsPriority,
  type CapturePriority,
} from '@/lib/review/capturePriority';
import { setTaskPlanningMeta } from '@/lib/taskPlanningMeta';
import { setTaskEffort, type TaskEffort } from '@/lib/taskPerceivedEffort';
import { energyFromEffort } from '@/lib/vnext/saveTaskPlanEdit';
import { formatProjectDueDate } from '@/lib/projectProgress';

const UI_ACCENT = THEME.colors.calm.lavenderDeep;
const EMPTY_QUICK_ADD_PROJECTS: QuickAddProjectOption[] = [];

const PRIORITY_LABEL_KEYS: Record<CapturePriority, TranslationKey> = {
  low: 'vaciar.capturePriorityLow',
  medium: 'vaciar.capturePriorityMedium',
  high: 'vaciar.capturePriorityHigh',
  urgent: 'vaciar.capturePriorityUrgent',
};

export type ProjectQuickAddTarget =
  | { mode: 'project'; id: string; name: string; color: string }
  | {
      mode: 'loose';
      lifeAreaRef?: LifeAreaRef;
      areaLabel?: string;
      areaEmoji?: string;
      initialContent?: string;
    }
  | { mode: 'day'; date: string; dayLabel: string };

type QuickAddProjectOption = {
  id: string;
  name: string;
  color: string;
};

type ProjectQuickAddTaskModalProps = {
  visible: boolean;
  target: ProjectQuickAddTarget | null;
  userId?: string;
  hasCheckInToday: boolean;
  projects?: QuickAddProjectOption[];
  onClose: () => void;
  onSaved: (args: { title: string; projectName?: string; dayLabel?: string }) => void;
  onOpenFullCapture?: (projectId: string | null) => void;
};

export function ProjectQuickAddTaskModal({
  visible,
  target,
  userId,
  hasCheckInToday,
  projects = EMPTY_QUICK_ADD_PROJECTS,
  onClose,
  onSaved,
  onOpenFullCapture,
}: ProjectQuickAddTaskModalProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState<QuickAddProjectOption[]>(projects);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState<string>(PROJECT_COLORS[0]);
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectLifeArea, setNewProjectLifeArea] = useState<LifeAreaRef>('other');
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lifeAreaKey, setLifeAreaKey] = useState<LifeAreaRef | null>(null);
  const [capturePriority, setCapturePriority] = useState<CapturePriority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [effort, setEffort] = useState<TaskEffort | null>(null);
  const [activePlanPicker, setActivePlanPicker] = useState<'date' | 'duration' | 'priority' | null>(
    null,
  );

  const { config: lifeAreasConfig } = useUserLifeAreas(userId);
  const selectableAreas = listActiveLifeAreas(
    lifeAreasConfig,
    (key) => t(`lifeAreas.${key}` as TranslationKey),
    (presetCustomId) => t(`lifeAreasPreset.${presetCustomId}` as TranslationKey),
    lifeAreaKey ?? (target?.mode === 'loose' ? target.lifeAreaRef : undefined),
  );

  const today = getLocalDateString();
  const weekEnd = getEndOfWeekLocalDateString();
  const isThisWeek = selectedDate === weekEnd && selectedDate !== today;

  useEffect(() => {
    if (visible) {
      setLocalProjects(projects);
    }
  }, [visible, projects]);

  useEffect(() => {
    if (!visible) {
      setContent('');
      setSelectedDate(null);
      setSelectedProjectId(null);
      setShowCreateProject(false);
      setNewProjectName('');
      setNewProjectColor(PROJECT_COLORS[0]);
      setNewProjectDueDate('');
      setNewProjectLifeArea('other');
      setCreateProjectError(null);
      setCreatingProject(false);
      setSaving(false);
      setLifeAreaKey(null);
      setCapturePriority('medium');
      setEstimatedMinutes(45);
      setEffort(null);
      setActivePlanPicker(null);
      return;
    }

    if (target?.mode === 'loose') {
      setContent(target.initialContent ?? '');
      setLifeAreaKey(target.lifeAreaRef ?? null);
      setSelectedDate(null);
      setCapturePriority('medium');
      setEstimatedMinutes(45);
      setEffort(null);
      setActivePlanPicker(null);
    }
  }, [visible, target]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

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

      const created = {
        id: result.project.id,
        name: result.project.name,
        color: result.project.color,
      };
      setLocalProjects((current) => [...current, created]);
      setSelectedProjectId(created.id);
      resetCreateProjectForm();
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed || !target) return;

    setSaving(true);
    try {
      const isProject = target.mode === 'project';
      const isDay = target.mode === 'day';
      const isLoose = target.mode === 'loose';
      const dayProjectId = isDay ? selectedProjectId : null;
      const loosePriority = isLoose ? capturePriorityToIsPriority(capturePriority) : false;
      const result = await createVaciarTask(
        {
          content: trimmed,
          hasSubtasks: false,
          subtasks: [],
          assignToProject: isProject || Boolean(dayProjectId),
          selectedCategory: 'otros',
          selectedProjectId: isProject ? target.id : dayProjectId,
          selectedDate: isDay ? target.date : selectedDate,
          isPriority: isLoose ? loosePriority : undefined,
          lifeAreaKey: isLoose ? lifeAreaKey : null,
        },
        { locale, hasCheckInToday },
      );

      if (result.status === 'not_authenticated') {
        Alert.alert(t('errors.notAuthenticated'));
        return;
      }
      if (result.status === 'error') {
        Alert.alert(t('errors.saveTaskFailed'));
        return;
      }

      if (isLoose && result.taskId) {
        if (effort) {
          await setTaskEffort(result.taskId, effort);
        }
        await setTaskPlanningMeta(result.taskId, {
          estimatedMinutes,
          energyRequired: energyFromEffort(effort),
          notes: '',
        });
      }

      const projectName =
        isProject
          ? target.name
          : dayProjectId
            ? localProjects.find((entry) => entry.id === dayProjectId)?.name
            : undefined;

      onSaved({
        title: result.savedTitle,
        projectName,
        dayLabel: isDay ? target.dayLabel : undefined,
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  if (!target) return null;

  const isProject = target.mode === 'project';
  const isDay = target.mode === 'day';
  const isLoose = target.mode === 'loose';
  const projectColor = isProject ? target.color : UI_ACCENT;
  const bottomInset = Math.max(insets.bottom, THEME.spacing.md);
  const showLegacyDatePills = !isDay && !isLoose;

  const datePillLabel = selectedDate
    ? formatProjectDueDate(selectedDate, locale)
    : t('vaciar.previewDateBtn');
  const durationLabel = t('vaciar.previewDurationMinutes', { count: estimatedMinutes });
  const priorityLabel = t(PRIORITY_LABEL_KEYS[capturePriority]);

  const togglePlanPicker = (picker: 'date' | 'duration' | 'priority') => {
    setActivePlanPicker((current) => (current === picker ? null : picker));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel={t('components.closeA11y')} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}
        >
          <View style={[styles.sheet, { paddingBottom: bottomInset }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {isProject
                    ? t('projects.quickAddTitle', { name: target.name })
                    : isDay
                      ? t('semana.quickAddDayTitle', { day: target.dayLabel })
                      : t('projects.quickAddLooseTitle')}
                </Text>
                <Text style={styles.subtitle}>
                  {isProject
                    ? t('projects.quickAddPrompt')
                    : isDay
                      ? t('semana.quickAddDayPrompt')
                      : t('projects.quickAddLoosePrompt')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                accessibilityLabel={t('components.closeA11y')}
              >
                <X size={22} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {isProject ? (
              <View style={[styles.projectChip, { borderLeftColor: projectColor }]}>
                <FolderKanban size={18} color={projectColor} />
                <Text style={styles.projectChipText} numberOfLines={2}>
                  {target.name}
                </Text>
              </View>
            ) : isDay ? (
              <View style={styles.looseContext}>
                <Text style={styles.looseContextEmoji}>📅</Text>
                <Text style={styles.looseContextText}>
                  {t('semana.quickAddDayChip', { day: target.dayLabel })}
                </Text>
              </View>
            ) : target.areaLabel ? (
              <View style={styles.looseContext}>
                <Text style={styles.looseContextEmoji}>{target.areaEmoji ?? '🌿'}</Text>
                <Text style={styles.looseContextText}>
                  {t('projects.quickAddLooseAreaHint', { area: target.areaLabel })}
                </Text>
              </View>
            ) : isLoose ? (
              <Text style={styles.looseHint}>{t('projects.quickAddLoosePlanHint')}</Text>
            ) : (
              <Text style={styles.looseHint}>{t('projects.quickAddLooseHint')}</Text>
            )}

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={content}
                  onChangeText={setContent}
                  placeholder={t('vaciar.placeholderShort')}
                  placeholderTextColor={THEME.colors.text.tertiary}
                  multiline
                  maxLength={300}
                  autoFocus
                  accessibilityLabel={t('vaciarExtra.a11yTaskField')}
                />
              </View>

              {isLoose ? (
                <>
                  <View style={styles.planSection}>
                    <Text style={styles.planLabel}>{t('vnext.taskEditLifeArea')}</Text>
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

                  <View style={styles.quickPills}>
                    <TouchableOpacity
                      style={[styles.quickPill, activePlanPicker === 'date' && styles.quickPillActive]}
                      onPress={() => togglePlanPicker('date')}
                      activeOpacity={0.85}
                    >
                      <Calendar size={14} color={THEME.colors.calm.lavenderDeep} />
                      <Text style={styles.quickPillText} numberOfLines={1}>
                        {datePillLabel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.quickPill,
                        activePlanPicker === 'duration' && styles.quickPillActive,
                      ]}
                      onPress={() => togglePlanPicker('duration')}
                      activeOpacity={0.85}
                    >
                      <Clock size={14} color={THEME.colors.calm.lavenderDeep} />
                      <Text style={styles.quickPillText} numberOfLines={1}>
                        {durationLabel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.quickPill,
                        activePlanPicker === 'priority' && styles.quickPillActive,
                      ]}
                      onPress={() => togglePlanPicker('priority')}
                      activeOpacity={0.85}
                    >
                      <Flag size={14} color={THEME.colors.calm.lavenderDeep} />
                      <Text style={styles.quickPillText} numberOfLines={1}>
                        {priorityLabel}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {activePlanPicker === 'date' ? (
                    <View style={styles.pickerWrap}>
                      <DateSelector
                        selectedDate={selectedDate}
                        onSelect={setSelectedDate}
                        compact
                        hideLabel
                      />
                    </View>
                  ) : null}

                  {activePlanPicker === 'duration' ? (
                    <View style={styles.pickerWrap}>
                      <TaskDurationStepper
                        minutes={estimatedMinutes}
                        onChange={setEstimatedMinutes}
                        compact
                      />
                    </View>
                  ) : null}

                  {activePlanPicker === 'priority' ? (
                    <View style={styles.pickerWrap}>
                      <View style={styles.chipRow}>
                        {CAPTURE_PRIORITY_ORDER.map((priority) => (
                          <VnextSelectableChip
                            key={priority}
                            label={t(PRIORITY_LABEL_KEYS[priority])}
                            emoji={
                              priority === 'urgent' ? '🔥' : priority === 'high' ? '⭐' : undefined
                            }
                            selected={capturePriority === priority}
                            onPress={() => setCapturePriority(priority)}
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.planSection}>
                    <TaskEffortPicker value={effort} onChange={setEffort} variant="segment" />
                  </View>
                </>
              ) : null}

              {showLegacyDatePills ? (
                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>{t('vaciar.fieldDate')}</Text>
                  <View style={styles.dateRow}>
                    <TouchableOpacity
                      style={[styles.datePill, selectedDate === today && styles.datePillOn]}
                      onPress={() => setSelectedDate(today)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[styles.datePillText, selectedDate === today && styles.datePillTextOn]}
                      >
                        {t('vaciar.whenToday')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.datePill, isThisWeek && styles.datePillOn]}
                      onPress={() => setSelectedDate(weekEnd)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.datePillText, isThisWeek && styles.datePillTextOn]}>
                        {t('vaciar.whenThisWeek')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.datePill, selectedDate === null && styles.datePillOn]}
                      onPress={() => setSelectedDate(null)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.datePillText,
                          selectedDate === null && styles.datePillTextOn,
                        ]}
                      >
                        {t('vaciar.whenNoRush')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {isDay ? (
                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>{t('semana.quickAddDayProjectSection')}</Text>
                  {showCreateProject && userId ? (
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
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        style={[styles.datePill, selectedProjectId === null && styles.datePillOn]}
                        onPress={() => setSelectedProjectId(null)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.datePillText,
                            selectedProjectId === null && styles.datePillTextOn,
                          ]}
                        >
                          {t('semana.quickAddDayNoProject')}
                        </Text>
                      </TouchableOpacity>
                      {localProjects.map((project) => {
                        const active = selectedProjectId === project.id;
                        return (
                          <TouchableOpacity
                            key={project.id}
                            style={[styles.datePill, active && styles.datePillOn]}
                            onPress={() => setSelectedProjectId(project.id)}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.datePillText, active && styles.datePillTextOn]}>
                              {project.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {userId ? (
                        <TouchableOpacity
                          style={[styles.datePill, styles.datePillNew]}
                          onPress={() => setShowCreateProject(true)}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={t('projects.createProjectA11y')}
                        >
                          <Plus size={14} color={UI_ACCENT} />
                          <Text style={[styles.datePillText, styles.datePillNewText]}>
                            {t('projects.newProject')}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </View>
              ) : null}

              {onOpenFullCapture ? (
                <TouchableOpacity
                  style={styles.moreLink}
                  onPress={() => {
                    const projectId =
                      target.mode === 'project'
                        ? target.id
                        : target.mode === 'day'
                          ? selectedProjectId
                          : null;
                    handleClose();
                    onOpenFullCapture(projectId);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.moreLinkText}>{t('projects.quickAddMoreOptions')}</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <CalmPrimaryButton
                label={
                  saving
                    ? t('vaciar.saving')
                    : isProject
                      ? t('projects.quickAddSaveShort')
                      : isDay
                        ? t('semana.quickAddDaySave')
                        : t('projects.quickAddSaveLoose')
                }
                onPress={() => void handleSave()}
                loading={saving}
                disabled={!content.trim() || saving}
                large
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: THEME.colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoid: {
    width: '100%',
    maxHeight: '92%',
  },
  sheet: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
    maxHeight: '100%',
    gap: THEME.spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 28,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 3,
    alignSelf: 'stretch',
  },
  projectChipText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 18,
  },
  looseContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  looseContextEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  looseContextText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    flexShrink: 1,
    lineHeight: 18,
  },
  looseHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.xs,
  },
  inputWrap: {
    alignSelf: 'stretch',
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    minHeight: 96,
    maxHeight: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    lineHeight: 22,
  },
  dateSection: {
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  dateLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  datePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    minHeight: 36,
    justifyContent: 'center',
  },
  datePillOn: {
    backgroundColor: UI_ACCENT,
    borderColor: UI_ACCENT,
  },
  datePillNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderStyle: 'dashed',
    borderColor: UI_ACCENT,
    backgroundColor: THEME.colors.calm.lavender,
  },
  datePillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  datePillTextOn: {
    color: THEME.colors.onGradient,
  },
  datePillNewText: {
    color: UI_ACCENT,
    fontFamily: THEME.fonts.heading.bold,
  },
  moreLink: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  moreLinkText: {
    ...THEME.typography.small,
    color: UI_ACCENT,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 16,
  },
  planSection: {
    gap: THEME.spacing.xs,
  },
  planLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
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
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    maxWidth: '100%',
  },
  quickPillActive: {
    borderColor: UI_ACCENT,
    backgroundColor: THEME.colors.calm.lavender,
  },
  quickPillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flexShrink: 1,
    lineHeight: 16,
  },
  pickerWrap: {
    gap: THEME.spacing.xs,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
    paddingTop: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[100],
    alignSelf: 'stretch',
  },
});
