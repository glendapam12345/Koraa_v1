import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type StepBadgeProps = {
  step: number;
  label: string;
  active?: boolean;
};

export function StepBadge({ step, label, active = true }: StepBadgeProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.badge, active && styles.badgeActive]}>
        <Text style={[styles.badgeNum, active && styles.badgeNumActive]}>{step}</Text>
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  badgeNum: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
  },
  badgeNumActive: {
    color: THEME.colors.onGradient,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
  },
  labelActive: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
});
