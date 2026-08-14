import { Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type OnboardingCheckInProgressProps = {
  step: number;
  total?: number;
};

/** Progreso quieto — una línea, sin barras ni puntos ruidosos. */
export function OnboardingCheckInProgress({ step, total = 2 }: OnboardingCheckInProgressProps) {
  const { t } = useI18n();

  return (
    <Text
      style={styles.label}
      accessibilityRole="text"
      accessibilityLabel={t('onboarding.checkInProgressA11y', { current: step, total })}
    >
      {t('onboarding.checkInProgress', { current: step, total })}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.sm,
  },
});
