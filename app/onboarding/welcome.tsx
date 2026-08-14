import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { OnboardingFlowSteps } from '@/components/onboarding/OnboardingFlowSteps';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { ONBOARDING_NAME_ROUTE } from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';

export default function WelcomeScreen() {
  const { t } = useI18n();

  return (
    <OnboardingScreenShell
      footer={
        <CalmPrimaryButton
          label={t('onboarding.welcome.quickStart')}
          onPress={() => router.push(ONBOARDING_NAME_ROUTE)}
          large
          accessibilityHint={t('onboarding.welcome.quickStartHint')}
        />
      }
    >
      <OnboardingEllieCoach message={t('onboarding.ellie.welcome')} mood="happy" size={64} />
      <Text style={styles.brand}>{t('onboarding.welcome.brand')}</Text>
      <Text style={onboardingTypography.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.welcome.titleAccent')}</Text>
      <Text style={styles.lead}>{t('onboarding.welcome.subtitle')}</Text>
      <OnboardingFlowSteps />
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: THEME.spacing.sm,
  },
  lead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
});
