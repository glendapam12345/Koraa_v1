import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

type TaskEffortPickerProps = {
  value: TaskEffort | null;
  onChange: (value: TaskEffort | null) => void;
  /** Fila de 3 segmentos iguales (editor de plan). */
  variant?: 'wrap' | 'segment';
};

const OPTIONS: { id: TaskEffort; labelKey: 'vaciar.effortLight' | 'vaciar.effortMedium' | 'vaciar.effortHeavy' }[] = [
  { id: 'light', labelKey: 'vaciar.effortLight' },
  { id: 'medium', labelKey: 'vaciar.effortMedium' },
  { id: 'heavy', labelKey: 'vaciar.effortHeavy' },
];

export function TaskEffortPicker({
  value,
  onChange,
  variant = 'wrap',
}: TaskEffortPickerProps) {
  const { t } = useI18n();
  const isSegment = variant === 'segment';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('vaciar.effortLabel')}</Text>
      <Text style={styles.hint}>{t('vaciar.effortHint')}</Text>
      <View
        style={[styles.row, isSegment && styles.rowSegment]}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('vaciar.effortLabel')}
      >
        {OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.chip,
                isSegment && styles.chipSegment,
                selected && styles.chipSelected,
              ]}
              onPress={() => onChange(selected ? null : option.id)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(option.labelKey)}
            >
              <Text
                style={[
                  styles.chipText,
                  isSegment && styles.chipTextSegment,
                  selected && styles.chipTextSelected,
                ]}
              >
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
  rowSegment: {
    flexWrap: 'nowrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
  },
  chipSegment: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.rounded,
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
  chipTextSegment: {
    ...THEME.typography.meta,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
