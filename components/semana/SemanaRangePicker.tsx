import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

  const shortLabelFor = (mode: SemanaRangeMode) => {
    switch (mode) {
      case 'day':
        return t('semana.rangeDay');
      case 'week':
        return t('semana.rangeWeek');
      case 'twoWeeks':
        return t('semana.rangeTwoWeeksShort');
      case 'month':
        return t('semana.rangeMonth');
      default:
        return mode;
    }
  };

  const a11yLabelFor = (mode: SemanaRangeMode) => {
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
    <View style={styles.row}>
      {RANGE_OPTIONS.map((mode) => {
        const locked = !isSubscribed && isPremiumRangeMode(mode);
        const selected = value === mode;

        return (
          <TouchableOpacity
            key={mode}
            style={[
              styles.chip,
              selected && styles.chipSelected,
              locked && styles.chipLocked,
            ]}
            onPress={() => {
              if (locked) {
                onLockedPress();
                return;
              }
              onChange(mode);
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={
              locked ? t('semana.rangeLockedA11y', { range: a11yLabelFor(mode) }) : a11yLabelFor(mode)
            }
            accessibilityHint={locked ? t('semana.navPremiumHint') : undefined}
          >
            {locked ? (
              <Lock size={11} color={THEME.colors.calm.lavenderDeep} style={styles.lockIcon} />
            ) : null}
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected, locked && styles.chipTextLocked]}
              numberOfLines={1}
            >
              {shortLabelFor(mode)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 6,
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
    backgroundColor: THEME.colors.calm.card,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  lockIcon: {
    marginRight: 3,
  },
  chipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  chipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  chipTextLocked: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
