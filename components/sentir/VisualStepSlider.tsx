import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const ENERGY_LEVELS: { id: number; key: TranslationKey }[] = [
  { id: 1, key: 'onboarding.energy.veryLow' },
  { id: 2, key: 'onboarding.energy.low' },
  { id: 3, key: 'onboarding.energy.medium' },
  { id: 4, key: 'onboarding.energy.high' },
  { id: 5, key: 'onboarding.energy.veryHigh' },
];

type VisualStepSliderProps = {
  value: number;
  onChange: (level: number) => void;
  label: string;
  size?: 'default' | 'large';
};

export function VisualStepSlider({ value, onChange, label, size = 'default' }: VisualStepSliderProps) {
  const isLarge = size === 'large';
  const { t } = useI18n();
  const activeLevel = ENERGY_LEVELS.find((l) => l.id === value);
  const valueLabel = activeLevel ? t(activeLevel.key) : '';

  return (
    <View style={[styles.wrap, isLarge && styles.wrapLarge]}>
      <Text style={[styles.label, isLarge && styles.labelLarge]}>{label}</Text>
      <View style={[styles.trackOuter, isLarge && styles.trackOuterLarge]} accessibilityRole="adjustable">
        <LinearGradient
          colors={[THEME.colors.gradient.pink, THEME.colors.gradient.blue]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.trackGradient}
        />
        <View style={styles.stepsRow}>
          {ENERGY_LEVELS.map((level) => {
            const selected = value === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={styles.stepHit}
                onPress={() => onChange(level.id)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('onboardingA11y.selectEnergy', { label: t(level.key) })}
                accessibilityState={{ selected }}
              >
                <View
                  style={[
                    styles.stepDot,
                    isLarge && styles.stepDotLarge,
                    selected && styles.stepDotSelected,
                    isLarge && selected && styles.stepDotSelectedLarge,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Text style={[styles.valueLabel, isLarge && styles.valueLabelLarge]}>{valueLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: THEME.spacing.md,
  },
  wrapLarge: {
    marginTop: THEME.spacing.lg,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
  },
  labelLarge: {
    ...THEME.typography.body,
    fontSize: 17,
    marginBottom: THEME.spacing.md,
  },
  trackOuter: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  trackOuterLarge: {
    height: 52,
  },
  trackGradient: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.35,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHitLarge: {
    width: 52,
    height: 52,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
  },
  stepDotLarge: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  stepDotSelected: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
    transform: [{ scale: 1.15 }],
  },
  stepDotSelectedLarge: {
    transform: [{ scale: 1.12 }],
  },
  valueLabel: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
  valueLabelLarge: {
    fontSize: 18,
    marginTop: THEME.spacing.md,
  },
});
