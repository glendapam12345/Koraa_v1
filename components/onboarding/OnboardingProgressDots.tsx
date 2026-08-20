import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type OnboardingProgressDotsProps = {
  total: number;
  current: number;
  accessibilityLabel: string;
};

/** Indicador calm de progreso en el onboarding guiado. */
export function OnboardingProgressDots({
  total,
  current,
  accessibilityLabel,
}: OnboardingProgressDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const active = step === current;
        const done = step < current;
        return active ? (
          <LinearGradient
            key={step}
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dotActive}
          />
        ) : (
          <View
            key={step}
            style={[styles.dot, done && styles.dotDone]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: THEME.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.calm.border,
  },
  dotDone: {
    backgroundColor: THEME.colors.calm.lavender,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
});
