import { Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const LOOP_STEP_KEYS = {
  1: 'koraaGuide.step1Label',
  2: 'koraaGuide.step2Label',
  3: 'koraaGuide.step3Label',
  4: 'koraaGuide.step4Label',
} as const;

type OnboardingCheckInProgressProps = {
  step?: number;
  total?: number;
  /** Paso del loop Suelta → Siente → Se adapta → Un paso. */
  loopStep?: 1 | 2 | 3 | 4;
};

/** Progreso quieto — una línea, sin barras ni puntos ruidosos. */
export function OnboardingCheckInProgress({
  step = 1,
  total = 2,
  loopStep,
}: OnboardingCheckInProgressProps) {
  const { t } = useI18n();
  const label = loopStep
    ? t(LOOP_STEP_KEYS[loopStep] as TranslationKey)
    : t('onboarding.checkInProgress', { current: step, total });
  const a11y = loopStep
    ? t('koraaGuide.stepsA11y')
    : t('onboarding.checkInProgressA11y', { current: step, total });

  return (
    <Text style={styles.label} accessibilityRole="text" accessibilityLabel={a11y}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 0.3,
  },
});
