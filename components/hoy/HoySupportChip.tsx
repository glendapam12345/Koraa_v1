import { type ReactNode } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';

type HoySupportChipProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  a11y: string;
};

export function HoySupportChip({ icon, label, onPress, a11y }: HoySupportChipProps) {
  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      {icon}
      <Text style={styles.chipLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    minHeight: 36,
  },
  chipLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
