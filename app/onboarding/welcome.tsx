import { Text } from 'react-native';
import { router } from 'expo-router';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { OnboardingEllieFlowDemo } from '@/components/onboarding/OnboardingEllieFlowDemo';
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
      <Text style={onboardingTypography.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.welcome.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.welcome.subtitle')}</Text>
      <OnboardingEllieFlowDemo />
      <Text style={onboardingTypography.body}>{t('onboarding.welcome.promise')}</Text>
    </OnboardingScreenShell>
  );
}
