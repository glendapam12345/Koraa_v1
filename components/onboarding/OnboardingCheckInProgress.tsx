import { Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type OnboardingCheckInProgressProps = {
  step: 1 | 2 | 3 | 4;
};

export function OnboardingCheckInProgress({ step }: OnboardingCheckInProgressProps) {
  const { t } = useI18n();

  return (
    <Text
      style={styles.label}
      accessibilityRole="text"
      accessibilityLabel={t('onboarding.checkInProgressA11y', { current: step, total: 4 })}
    >
      {t('onboarding.checkInProgress', { current: step, total: 4 })}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
});
