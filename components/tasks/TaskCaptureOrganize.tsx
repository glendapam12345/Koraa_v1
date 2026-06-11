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

      <Text style={styles.fieldLabel}>{t('vaciar.fieldProjectOptional')}</Text>
      <Text style={styles.fieldHint}>{t('vaciar.fieldProjectOptionalHint')}</Text>
      <View style={styles.projectBlock}>
        <ProjectSelector
          selectedProjectId={selectedProjectId}
          onSelect={(id) => {
            onProjectChange(id);
            onAssignToProjectChange(Boolean(id));
          }}
          userId={userId}
          showLabel={false}
          assignMode
          onBeforeOpenModal={() => {
            Keyboard.dismiss();
            onBlurInput?.();
          }}
          onError={onProjectError}
          onSuccess={onProjectCreated}
        />
      </View>

      <Text style={styles.fieldLabel}>{t('vaciar.fieldDate')}</Text>
      <Text style={styles.fieldHint}>{t('vaciar.fieldDateHint')}</Text>
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
        selectedDate={selectedDate}
        onSelect={onDateChange}
        calendarTaskTitle={taskTitle}
        calendarTaskId={`capture-${selectedDate ?? 'none'}`}
      />

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
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: 0,
  },
  cardTitle: {
    ...THEME.typography.sectionTitle,
    fontSize: 18,
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
  fieldHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    lineHeight: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
    minHeight: THEME.sizes.touchTarget,
  },
  segmentActive: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  segmentText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  segmentTextActive: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
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
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
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
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  projectRequiredHint: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.pink,
    lineHeight: 18,
  },
  dateQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  dateChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
  },
  dateChipActive: {
    borderColor: THEME.colors.gradient.pink,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  dateChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  dateChipTextActive: {
    color: THEME.colors.gradient.blue,
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
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: THEME.colors.fill[200],
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
