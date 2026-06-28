import { useEffect } from 'react';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { AppLoadingGate } from '@/components/AppLoadingGate';
import { ONBOARDING_AREAS_ROUTE } from '@/lib/onboardingNavigation';

/** Legacy: redirige al paso de áreas del onboarding. */
export default function OnboardingProjectsRedirect() {
  const { t } = useI18n();

  useEffect(() => {
    router.replace(ONBOARDING_AREAS_ROUTE);
  }, []);

  return <AppLoadingGate message={t('boot.loadingDay')} />;
}
