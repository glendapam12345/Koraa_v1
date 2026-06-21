import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type HoyStepBadgeProps = {
  step: 1 | 2 | 3;
};

export function HoyStepBadge({ step }: HoyStepBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{step}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 14,
  },
});
