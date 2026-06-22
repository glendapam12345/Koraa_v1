import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { SemanaRangeMode } from '@/lib/semana/rangeMode';
import { isPremiumRangeMode } from '@/lib/semana/rangeMode';

const RANGE_OPTIONS: SemanaRangeMode[] = ['day', 'week', 'twoWeeks', 'month'];

type SemanaRangePickerProps = {
  value: SemanaRangeMode;
  isSubscribed: boolean;
  onChange: (mode: SemanaRangeMode) => void;
  onLockedPress: () => void;
};

export function SemanaRangePicker({
  value,
  isSubscribed,
  onChange,
  onLockedPress,
}: SemanaRangePickerProps) {
  const { t } = useI18n();

  const labelFor = (mode: SemanaRangeMode) => {
    switch (mode) {
      case 'day':
        return t('semana.rangeDay');
      case 'week':
        return t('semana.rangeWeek');
      case 'twoWeeks':
        return t('semana.rangeTwoWeeks');
      case 'month':
        return t('semana.rangeMonth');
      default:
        return mode;
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {RANGE_OPTIONS.map((mode) => {
        const locked = !isSubscribed && isPremiumRangeMode(mode);
        const selected = value === mode;

        return (
          <TouchableOpacity
            key={mode}
            style={[styles.chip, selected && styles.chipSelected, locked && styles.chipLocked]}
            onPress={() => {
              if (locked) {
                onLockedPress();
                return;
              }
              onChange(mode);
            }}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: locked }}
            accessibilityLabel={
              locked ? t('semana.rangeLockedA11y', { range: labelFor(mode) }) : labelFor(mode)
            }
          >
            {locked ? (
              <Lock size={12} color={THEME.colors.text.tertiary} style={styles.lockIcon} />
            ) : null}
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{labelFor(mode)}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 36,
  },
  chipSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  chipLocked: {
    opacity: 0.85,
  },
  lockIcon: {
    marginRight: 4,
  },
  chipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
  chipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
