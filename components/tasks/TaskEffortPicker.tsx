import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

type TaskEffortPickerProps = {
  value: TaskEffort | null;
  onChange: (value: TaskEffort | null) => void;
};

const OPTIONS: { id: TaskEffort; labelKey: 'vaciar.effortLight' | 'vaciar.effortMedium' | 'vaciar.effortHeavy' }[] = [
  { id: 'light', labelKey: 'vaciar.effortLight' },
  { id: 'medium', labelKey: 'vaciar.effortMedium' },
  { id: 'heavy', labelKey: 'vaciar.effortHeavy' },
];

export function TaskEffortPicker({ value, onChange }: TaskEffortPickerProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('vaciar.effortLabel')}</Text>
      <Text style={styles.hint}>{t('vaciar.effortHint')}</Text>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t('vaciar.effortLabel')}>
        {OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(selected ? null : option.id)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(option.labelKey)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  hint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  chip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
  },
  chipSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  chipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  chipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
