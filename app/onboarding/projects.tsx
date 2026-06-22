import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { AppLoadingGate } from '@/components/AppLoadingGate';
import { ONBOARDING_PAYWALL_PARAMS } from '@/lib/finishOnboarding';

/** Legacy: el paso de áreas ya no forma parte del onboarding. */
export default function OnboardingProjectsRedirect() {
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!user?.id) {
      router.replace('/onboarding/welcome');
      return;
    }
    router.replace({
      pathname: '/paywall',
      params: ONBOARDING_PAYWALL_PARAMS,
    });
  }, [user?.id]);

  return <AppLoadingGate message={t('boot.loadingDay')} />;
}
