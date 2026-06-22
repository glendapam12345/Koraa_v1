import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flag } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import {
  CAPTURE_PRIORITY_ORDER,
  type CapturePriority,
} from '@/lib/review/capturePriority';
import type { TranslationKey } from '@/lib/i18n';

const PRIORITY_LABEL_KEYS: Record<CapturePriority, TranslationKey> = {
  low: 'vaciar.capturePriorityLow',
  medium: 'vaciar.capturePriorityMedium',
  high: 'vaciar.capturePriorityHigh',
  urgent: 'vaciar.capturePriorityUrgent',
};

type TaskCapturePriorityPickerProps = {
  value: CapturePriority | null;
  onChange: (value: CapturePriority | null) => void;
};

export function TaskCapturePriorityPicker({
  value,
  onChange,
}: TaskCapturePriorityPickerProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Flag size={14} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.label}>{t('vaciar.fieldPriority')}</Text>
      </View>
      <Text style={styles.hint}>{t('vaciar.fieldPriorityHint')}</Text>
      <View
        style={styles.row}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('vaciar.fieldPriority')}
      >
        {CAPTURE_PRIORITY_ORDER.map((priority) => {
          const selected = value === priority;
          return (
            <TouchableOpacity
              key={priority}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(selected ? null : priority)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(PRIORITY_LABEL_KEYS[priority])}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t(PRIORITY_LABEL_KEYS[priority])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {value === 'urgent' ? (
        <Text style={styles.urgentHint}>{t('vaciar.capturePriorityUrgentHint')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
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
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    minHeight: 36,
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  chipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  chipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  urgentHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
