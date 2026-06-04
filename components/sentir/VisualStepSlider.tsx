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
};

export function VisualStepSlider({ value, onChange, label }: VisualStepSliderProps) {
  const { t } = useI18n();
  const activeLevel = ENERGY_LEVELS.find((l) => l.id === value);
  const valueLabel = activeLevel ? t(activeLevel.key) : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trackOuter} accessibilityRole="adjustable">
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
                <View style={[styles.stepDot, selected && styles.stepDotSelected]} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Text style={styles.valueLabel}>{valueLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: THEME.spacing.md,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
  },
  trackOuter: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
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
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
  },
  stepDotSelected: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
    transform: [{ scale: 1.15 }],
  },
  valueLabel: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
});
