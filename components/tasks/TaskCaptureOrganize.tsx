import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmSegmentedControl } from '@/components/ui/calm/CalmSegmentedControl';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { DateSelector } from '@/components/tasks/DateSelector';
import { TaskEffortPicker } from '@/components/tasks/TaskEffortPicker';
import { categoryKeys, type CategoryKey } from '@/lib/i18n/locales/features/categories';
import { getLocalDateString, getEndOfWeekLocalDateString } from '@/lib/dateLocal';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

const CATEGORY_OPTIONS: { key: CategoryKey }[] = categoryKeys.map((key) => ({ key }));

type TaskCaptureOrganizeProps = {
  /** Sin tarjeta extra: sección dentro de la pantalla de captura. */
  embedded?: boolean;
  userId: string;
  taskTitle: string;
  assignToProject: boolean;
  onAssignToProjectChange: (value: boolean) => void;
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
  selectedProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
  hasSubtasks: boolean;
  onHasSubtasksChange: (value: boolean) => void;
  subtasks: string[];
  onSubtasksChange: (items: string[]) => void;
  onAddSubtask: () => void;
  onRemoveSubtask: (index: number) => void;
  onBlurInput?: () => void;
  onProjectError?: (message: string) => void;
  onProjectCreated?: (name: string) => void;
  effortFeel?: TaskEffort | null;
  onEffortChange?: (value: TaskEffort | null) => void;
};

export function TaskCaptureOrganize({
  embedded = false,
  userId,
  taskTitle,
  assignToProject,
  onAssignToProjectChange,
  selectedCategory,
  onCategoryChange,
  selectedProjectId,
  onProjectChange,
  selectedDate,
  onDateChange,
  hasSubtasks,
  onHasSubtasksChange,
  subtasks,
  onSubtasksChange,
  onAddSubtask,
  onRemoveSubtask,
  onBlurInput,
  onProjectError,
  onProjectCreated,
  effortFeel = null,
  onEffortChange,
}: TaskCaptureOrganizeProps) {
  const { t } = useI18n();
  const [requestProjectOpen, setRequestProjectOpen] = useState(false);
  const today = getLocalDateString();
  const weekEnd = getEndOfWeekLocalDateString();
  const isThisWeekSelected = selectedDate === weekEnd && selectedDate !== today;

  const updateSubtask = (index: number, value: string) => {
    const next = [...subtasks];
    next[index] = value;
    onSubtasksChange(next);
  };

  const inProject = assignToProject && Boolean(selectedProjectId);

  return (
    <View
      style={embedded ? styles.embedded : styles.card}
      accessibilityRole="summary"
      accessibilityLabel={t('vaciarExtra.a11yOrganizeCard')}
    >
      {!embedded ? (
        <>
          <Text style={styles.cardTitle}>{t('vaciar.organizeCardTitle')}</Text>
          <Text style={styles.cardSub}>{t('vaciar.organizeCardSub')}</Text>
        </>
      ) : null}

      <Text style={styles.fieldLabel}>{t('vaciar.fieldProject')}</Text>
      <Text style={styles.fieldHint}>{t('vaciar.fieldProjectHint')}</Text>

      <CalmSegmentedControl
        variant="accent"
        value={assignToProject ? 'project' : 'loose'}
        onChange={(mode) => {
          if (mode === 'loose') {
            onAssignToProjectChange(false);
            onProjectChange(null);
            return;
          }
          onAssignToProjectChange(true);
          if (!selectedProjectId) {
            setRequestProjectOpen(true);
          }
        }}
        segments={[
          {
            id: 'loose',
            label: t('vaciar.looseTask'),
            accessibilityLabel: t('vaciar.looseTask'),
          },
          {
            id: 'project',
            label: t('vaciar.inProject'),
            accessibilityLabel: t('vaciar.inProject'),
          },
        ]}
      />

      {assignToProject ? (
        <View style={styles.projectBlock}>
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onSelect={(id) => {
              onProjectChange(id);
            }}
            userId={userId}
            showLabel={false}
            assignMode
            requestOpen={requestProjectOpen}
            onRequestOpenHandled={() => setRequestProjectOpen(false)}
            onBeforeOpenModal={() => {
              Keyboard.dismiss();
              onBlurInput?.();
            }}
            onError={onProjectError}
            onSuccess={onProjectCreated}
          />
          {!selectedProjectId ? (
            <Text style={styles.projectRequiredHint}>{t('vaciar.projectRequiredHint')}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.sectionDivider} />

      <View style={styles.datePanel}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.fieldLabelInline}>{t('vaciar.fieldDate')}</Text>
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalBadgeText}>{t('vaciar.fieldDateOptionalBadge')}</Text>
          </View>
        </View>
        <Text style={styles.fieldHint}>
          {inProject ? t('vaciar.fieldDateHintInProject') : t('vaciar.fieldDateHint')}
        </Text>
        <View style={styles.dateQuickRow}>
          <TouchableOpacity
            style={[styles.dateChip, selectedDate === today && styles.dateChipActive]}
            onPress={() => onDateChange(today)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedDate === today }}
            accessibilityLabel={t('vaciarExtra.a11yDateToday')}
          >
            <Text style={[styles.dateChipText, selectedDate === today && styles.dateChipTextActive]}>
              {t('vaciar.whenToday')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dateChip, isThisWeekSelected && styles.dateChipActive]}
            onPress={() => onDateChange(weekEnd)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: isThisWeekSelected }}
            accessibilityLabel={t('vaciarExtra.a11yDateThisWeek')}
          >
            <Text style={[styles.dateChipText, isThisWeekSelected && styles.dateChipTextActive]}>
              {t('vaciar.whenThisWeek')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dateChip, selectedDate === null && styles.dateChipActive]}
            onPress={() => onDateChange(null)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedDate === null }}
            accessibilityLabel={t('vaciarExtra.a11yDateNoRush')}
          >
            <Text style={[styles.dateChipText, selectedDate === null && styles.dateChipTextActive]}>
              {t('vaciar.whenNoRush')}
            </Text>
          </TouchableOpacity>
        </View>
        <DateSelector
          compact
          hideLabel
          selectedDate={selectedDate}
          onSelect={onDateChange}
          calendarTaskTitle={taskTitle}
          calendarTaskId={`capture-${selectedDate ?? 'none'}`}
        />
      </View>

      {onEffortChange ? (
        <TaskEffortPicker value={effortFeel} onChange={onEffortChange} />
      ) : null}

      {!inProject ? (
        <>
          <Text style={styles.fieldLabel}>{t('vaciar.chooseCategory')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.chipsRow}
          >
            {CATEGORY_OPTIONS.map((opt) => {
              const isSelected = selectedCategory === opt.key;
              const color =
                THEME.colors.category[opt.key as keyof typeof THEME.colors.category] ??
                THEME.colors.text.secondary;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, isSelected && { backgroundColor: color, borderColor: color }]}
                  onPress={() => onCategoryChange(opt.key)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={t('vaciarExtra.a11yCategory', {
                    name: t(`categories.${opt.key}`),
                  })}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {t(`categories.${opt.key}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      {inProject ? (
        <>
          <TouchableOpacity
            style={[styles.subtasksToggle, hasSubtasks && styles.subtasksToggleActive]}
            onPress={() => onHasSubtasksChange(!hasSubtasks)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: hasSubtasks }}
            accessibilityLabel={hasSubtasks ? t('vaciarExtra.a11ySubtasksOn') : t('vaciarExtra.a11ySubtasksOff')}
          >
            {hasSubtasks ? (
              <ChevronUp size={18} color={THEME.colors.gradient.blue} />
            ) : (
              <ChevronDown size={18} color={THEME.colors.text.secondary} />
            )}
            <Text style={[styles.subtasksToggleText, hasSubtasks && styles.subtasksToggleTextActive]}>
              {t('vaciar.subtasksToggle')}
            </Text>
          </TouchableOpacity>
          {hasSubtasks ? (
            <View style={styles.subtasksWrap}>
              {subtasks.map((subtask, index) => (
                <View key={index} style={styles.subtaskRow}>
                  <TextInput
                    style={styles.subtaskInput}
                    value={subtask}
                    onChangeText={(v) => updateSubtask(index, v)}
                    placeholder={t('vaciar.subtaskPlaceholder', { n: index + 1 })}
                    placeholderTextColor={THEME.colors.text.secondary}
                    maxLength={300}
                    accessibilityLabel={t('vaciarExtra.a11ySubtaskField', { n: index + 1 })}
                  />
                  {subtasks.length > 1 ? (
                    <TouchableOpacity
                      onPress={() => onRemoveSubtask(index)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('vaciarExtra.a11yRemoveSubtask', { n: index + 1 })}
                    >
                      <X size={18} color={THEME.colors.text.secondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addSubtaskBtn}
                onPress={onAddSubtask}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('vaciarExtra.a11yAddSubtask')}
              >
                <Plus size={16} color={THEME.colors.gradient.blue} />
                <Text style={styles.addSubtaskText}>{t('vaciar.addSubtask')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
  },
  embedded: {
    gap: THEME.spacing.xs,
  },
  cardTitle: {
    ...THEME.typography.subheading,
    lineHeight: 24,
    color: THEME.colors.text.main,
    marginBottom: 4,
  },
  cardSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 20,
  },
  fieldLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  fieldLabelInline: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
  },
  fieldHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    lineHeight: 18,
  },
  chipsRow: {
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
  },
  chip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.mist,
  },
  chipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
  },
  chipTextSelected: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  projectBlock: {
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  projectRequiredHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: THEME.colors.calm.border,
    marginVertical: THEME.spacing.md,
  },
  datePanel: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexWrap: 'wrap',
  },
  optionalBadge: {
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  optionalBadgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  dateQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  dateChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    minHeight: 36,
    justifyContent: 'center',
  },
  dateChipActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  dateChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  dateChipTextActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtasksToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
  },
  subtasksToggleActive: {},
  subtasksToggleText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  subtasksToggleTextActive: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtasksWrap: {
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  subtaskInput: {
    flex: 1,
    ...THEME.typography.body,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    color: THEME.colors.text.main,
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  addSubtaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.xs,
  },
  addSubtaskText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
