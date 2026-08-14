import { Text } from 'react-native';
import { router } from 'expo-router';
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
      <OnboardingEllieCoach message={t('onboarding.ellie.howItWorks')} mood="happy" size={56} />
      <Text style={onboardingTypography.title}>{t('koraaGuide.title')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('koraaGuide.subtitle')}</Text>
      <OnboardingFlowSteps hideIntro />
    </OnboardingScreenShell>
  );
}
