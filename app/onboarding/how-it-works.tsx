import { Text } from 'react-native';
import { router } from 'expo-router';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { OnboardingFlowSteps } from '@/components/onboarding/OnboardingFlowSteps';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { useAuth } from '@/contexts/AuthContext';
import { ONBOARDING_NAME_ROUTE } from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';

export default function HowItWorksScreen() {
  const { user } = useAuth();
  const { t } = useI18n();

  const goToName = () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    router.push(ONBOARDING_NAME_ROUTE);
  };

  return (
    <OnboardingScreenShell
      footer={
        <CalmPrimaryButton
          label={t('onboarding.howItWorks.startCheckIn')}
          onPress={goToName}
          large
          accessibilityHint={t('onboardingA11y.howItWorksCheckInHint')}
        />
      }
    >
      <OnboardingEllieCoach message={t('onboarding.ellie.howItWorks')} mood="grateful" size={56} />
      <Text style={onboardingTypography.title}>{t('onboarding.howItWorks.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.howItWorks.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.howItWorks.subtitle')}</Text>
      <OnboardingFlowSteps />
    </OnboardingScreenShell>
  );
}
