import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FolderKanban } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getLocalDateString, getEndOfWeekLocalDateString } from '@/lib/dateLocal';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

type VaciarCaptureQuickOptionsProps = {
  assignToProject: boolean;
  onAssignToProjectChange: (value: boolean) => void;
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
  effortFeel: TaskEffort | null;
  onEffortChange: (value: TaskEffort | null) => void;
  onOpenFullOptions: () => void;
};

const EFFORT_OPTIONS: { id: TaskEffort; labelKey: 'vaciar.effortLight' | 'vaciar.effortMedium' | 'vaciar.effortHeavy' }[] = [
  { id: 'light', labelKey: 'vaciar.effortLight' },
  { id: 'medium', labelKey: 'vaciar.effortMedium' },
  { id: 'heavy', labelKey: 'vaciar.effortHeavy' },
];

export function VaciarCaptureQuickOptions({
  assignToProject,
  onAssignToProjectChange,
  selectedDate,
  onDateChange,
  effortFeel,
  onEffortChange,
  onOpenFullOptions,
}: VaciarCaptureQuickOptionsProps) {
  const { t } = useI18n();
  const today = getLocalDateString();
  const weekEnd = getEndOfWeekLocalDateString();
  const isThisWeekSelected = selectedDate === weekEnd && selectedDate !== today;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.pill, !assignToProject && styles.pillActive]}
          onPress={() => onAssignToProjectChange(false)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: !assignToProject }}
          accessibilityLabel={t('vaciarExtra.a11yAssignNo')}
        >
          <Text style={[styles.pillText, !assignToProject && styles.pillTextActive]}>
            {t('vaciar.looseTask')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, assignToProject && styles.pillActive]}
          onPress={() => onAssignToProjectChange(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: assignToProject }}
          accessibilityLabel={t('vaciarExtra.a11yAssignYes')}
        >
          <FolderKanban
            size={14}
            color={assignToProject ? THEME.colors.onGradient : THEME.colors.gradient.blue}
          />
          <Text style={[styles.pillText, assignToProject && styles.pillTextActive]}>
            {t('vaciar.inProject')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.pill, selectedDate === today && styles.pillActive]}
          onPress={() => onDateChange(today)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedDate === today }}
          accessibilityLabel={t('vaciarExtra.a11yDateToday')}
        >
          <Text style={[styles.pillText, selectedDate === today && styles.pillTextActive]}>
            {t('vaciar.whenToday')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, isThisWeekSelected && styles.pillActive]}
          onPress={() => onDateChange(weekEnd)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: isThisWeekSelected }}
          accessibilityLabel={t('vaciarExtra.a11yDateThisWeek')}
        >
          <Text style={[styles.pillText, isThisWeekSelected && styles.pillTextActive]}>
            {t('vaciar.whenThisWeek')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, selectedDate === null && styles.pillActive]}
          onPress={() => onDateChange(null)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedDate === null }}
          accessibilityLabel={t('vaciarExtra.a11yDateNoRush')}
        >
          <Text style={[styles.pillText, selectedDate === null && styles.pillTextActive]}>
            {t('vaciar.whenNoRush')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t('vaciar.effortLabel')}>
        {EFFORT_OPTIONS.map((option) => {
          const selected = effortFeel === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.pill, styles.pillFlex, selected && styles.pillActive]}
              onPress={() => onEffortChange(selected ? null : option.id)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(option.labelKey)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {assignToProject ? (
        <TouchableOpacity
          onPress={onOpenFullOptions}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.quickOpenProjectA11y')}
        >
          <Text style={styles.moreLink}>{t('vaciar.quickOpenProject')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onOpenFullOptions}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.quickMoreOptionsA11y')}
        >
          <Text style={styles.moreLink}>{t('vaciar.quickMoreOptions')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    minHeight: 36,
  },
  pillFlex: {
    flex: 1,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  pillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  pillTextActive: {
    color: THEME.colors.onGradient,
  },
  moreLink: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    paddingVertical: 2,
  },
});
