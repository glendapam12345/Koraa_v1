import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { DateSelector } from '@/components/tasks/DateSelector';
import type { WeekPlannerDay } from '@/lib/lifeAreas/types';

type MoveTaskToDaySheetProps = {
  visible: boolean;
  taskTitle: string;
  days: WeekPlannerDay[];
  currentDayId: string;
  onSelect: (dayId: string) => void;
  onClose: () => void;
};

export function MoveTaskToDaySheet({
  visible,
  taskTitle,
  days,
  currentDayId,
  onSelect,
  onClose,
}: MoveTaskToDaySheetProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('tasksExperience.vision.moveTaskTitle')}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {taskTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {days.map((day) => {
              const isCurrent = day.id === currentDayId;
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.option, isCurrent && styles.optionCurrent]}
                  onPress={() => {
                    if (!isCurrent) onSelect(day.id);
                    onClose();
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  disabled={isCurrent}
                >
                  <Text style={styles.optionLabel}>{day.fullLabel}</Text>
                  <Text style={styles.optionMeta}>{day.summary}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.calendarSection}>
              <Text style={styles.calendarTitle}>{t('semana.movePickCalendar')}</Text>
              <Text style={styles.calendarHint}>{t('semana.movePickCalendarHint')}</Text>
              <DateSelector
                selectedDate={currentDayId}
                onSelect={(date) => {
                  if (!date || date === currentDayId) return;
                  onSelect(date);
                  onClose();
                }}
                compact
                hideLabel
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    borderTopWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: THEME.spacing.md,
    gap: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: THEME.colors.calm.mist,
    gap: 2,
  },
  optionCurrent: {
    opacity: 0.55,
  },
  optionLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  optionMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  calendarSection: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
    gap: THEME.spacing.xs,
  },
  calendarTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  calendarHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
});
