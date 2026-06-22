import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { DateSelector } from '@/components/tasks/DateSelector';
import { TaskEffortPicker } from '@/components/tasks/TaskEffortPicker';
import { TaskDurationStepper } from '@/components/vnext/TaskDurationStepper';
import { VnextSelectableChip } from '@/components/vnext/VnextSelectableChip';
import type { Task } from '@/components/tasks/TaskCard';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';
import {
  effortToDefaultMinutes,
  getTaskPlanningMeta,
  loadTaskPlanningMetaMap,
} from '@/lib/taskPlanningMeta';
import { getPerceivedEffort, loadTaskEffortMap } from '@/lib/taskPerceivedEffort';
import { getProjectEmoji } from '@/lib/projectEmoji';
import { energyFromEffort, type TaskPlanEditPayload } from '@/lib/vnext/saveTaskPlanEdit';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import {
  listSelectableLifeAreas,
  type ResolvedLifeArea,
} from '@/lib/lifeAreas/userLifeAreas';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { TranslationKey } from '@/lib/i18n';

type TaskPlanEditSheetProps = {
  visible: boolean;
  task: Task | null;
  projects?: { id: string; name: string }[];
  onSave: (payload: TaskPlanEditPayload) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
};

export function TaskPlanEditSheet({
  visible,
  task,
  projects = [],
  onSave,
  onDelete,
  onClose,
  saving = false,
}: TaskPlanEditSheetProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { config: lifeAreasConfig } = useUserLifeAreas(user?.id);
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [lifeAreaKey, setLifeAreaKey] = useState<LifeAreaRef | null>(null);
  const [isPriority, setIsPriority] = useState(false);
  const [effort, setEffort] = useState<TaskEffort | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [notes, setNotes] = useState('');
  const [metaReady, setMetaReady] = useState(false);

  useEffect(() => {
    if (!visible || !task) return;
    let cancelled = false;
    void (async () => {
      await Promise.all([loadTaskEffortMap(), loadTaskPlanningMetaMap()]);
      if (cancelled) return;
      const perceived = getPerceivedEffort(task.id) ?? task.perceivedEffort ?? null;
      const planning = getTaskPlanningMeta(task.id);
      setContent(task.content);
      setScheduledDate(task.scheduled_date ?? null);
      setProjectId(task.project_id ?? null);
      setLifeAreaKey((task.life_area_key as LifeAreaRef | null) ?? null);
      setIsPriority(task.is_priority);
      setEffort(perceived);
      setEstimatedMinutes(
        planning.estimatedMinutes || effortToDefaultMinutes(perceived ?? undefined),
      );
      setNotes(planning.notes);
      setMetaReady(true);
    })();
    return () => {
      cancelled = true;
      setMetaReady(false);
    };
  }, [task, visible]);

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

  const canSave = Boolean(task && content.trim() && metaReady && !saving);

  const selectableAreas: ResolvedLifeArea[] = listSelectableLifeAreas(
    lifeAreasConfig,
    (key) => t(`lifeAreas.${key}` as TranslationKey),
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('vnext.taskEditTitle')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <X size={22} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>{t('vnext.taskEditName')}</Text>
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={setContent}
                placeholder={t('components.editTaskPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                multiline
              />

              {projects.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.label}>{t('vnext.taskEditFront')}</Text>
                  <View style={styles.chipRow}>
                    <VnextSelectableChip
                      label={t('projectsUi.looseTitle')}
                      selected={!projectId}
                      onPress={() => {
                        setProjectId(null);
                      }}
                    />
                    {projects.slice(0, 6).map((project) => (
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
                  </View>
                </View>
              ) : null}

              {!projectId ? (
                <View style={styles.section}>
                  <Text style={styles.label}>{t('vnext.taskEditLifeArea')}</Text>
                  <View style={styles.chipRow}>
                    {selectableAreas.map((area) => (
                      <VnextSelectableChip
                        key={area.ref}
                        label={area.name}
                        emoji={area.emoji}
                        selected={lifeAreaKey === area.ref}
                        onPress={() => setLifeAreaKey(area.ref)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.label}>{t('vnext.taskEditPriority')}</Text>
                <VnextSelectableChip
                  label={t('vnext.taskEditPriorityOn')}
                  emoji="⭐"
                  selected={isPriority}
                  onPress={() => setIsPriority((value) => !value)}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>{t('vnext.taskEditDuration')}</Text>
                <TaskDurationStepper
                  minutes={estimatedMinutes}
                  onChange={setEstimatedMinutes}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>{t('vnext.taskEditDeadline')}</Text>
                <DateSelector
                  selectedDate={scheduledDate}
                  onSelect={setScheduledDate}
                  compact
                  hideLabel
                />
              </View>

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
              large
              disabled={!canSave}
              loading={saving}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  keyboard: {
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    flex: 1,
  },
  closeBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  section: {
    gap: 8,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    minHeight: 56,
    lineHeight: 22,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
  },
  tagEmoji: {
    fontSize: THEME.typography.body.fontSize,
  },
  tagText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
