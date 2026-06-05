import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import { FolderKanban, Plus, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { DateSelector } from '@/components/tasks/DateSelector';
import { categoryKeys, type CategoryKey } from '@/lib/i18n/locales/features/categories';
import { getLocalDateString, getEndOfWeekLocalDateString } from '@/lib/dateLocal';

const CATEGORY_OPTIONS: { key: CategoryKey }[] = categoryKeys.map((key) => ({ key }));

type TaskCaptureOrganizeProps = {
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
};

export function TaskCaptureOrganize({
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

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={t('vaciarExtra.a11yOrganizeCard')}
    >
      <Text style={styles.cardTitle}>{t('vaciar.organizeCardTitle')}</Text>
      <Text style={styles.cardSub}>{t('vaciar.organizeCardSub')}</Text>

      <Text style={styles.fieldLabel}>{t('vaciar.fieldProject')}</Text>
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, !assignToProject && styles.segmentActive]}
          onPress={() => onAssignToProjectChange(false)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: !assignToProject }}
          accessibilityLabel={t('vaciarExtra.a11yAssignNo')}
        >
          <Text style={[styles.segmentText, !assignToProject && styles.segmentTextActive]}>
            {t('vaciar.looseTask')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, assignToProject && styles.segmentActive]}
          onPress={() => onAssignToProjectChange(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: assignToProject }}
          accessibilityLabel={t('vaciarExtra.a11yAssignYes')}
        >
          <FolderKanban size={16} color={assignToProject ? THEME.colors.onGradient : THEME.colors.gradient.blue} />
          <Text style={[styles.segmentText, assignToProject && styles.segmentTextActive]}>
            {t('vaciar.inProject')}
          </Text>
        </TouchableOpacity>
      </View>

      {!assignToProject ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
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
                accessibilityLabel={t('vaciarExtra.a11yCategory', { name: t(`categories.${opt.key}`) })}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {t(`categories.${opt.key}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.projectBlock}>
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onSelect={onProjectChange}
            userId={userId}
            showLabel
            assignMode
            onBeforeOpenModal={() => {
              Keyboard.dismiss();
              onBlurInput?.();
            }}
            onError={onProjectError}
            onSuccess={onProjectCreated}
          />
        </View>
      )}

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

      {assignToProject ? (
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
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  cardTitle: {
    ...THEME.typography.h3,
    fontSize: 16,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
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
    ...THEME.typography.body,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    color: THEME.colors.text.main,
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
