import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { ONBOARDING_PAYWALL_PARAMS } from '@/lib/finishOnboarding';

/** Rutas tipadas del stack de onboarding. */
export const ONBOARDING_AREAS_ROUTE = '/onboarding/areas' as Href;
export const ONBOARDING_ACTIVITIES_ROUTE = '/onboarding/activities' as Href;
export const ONBOARDING_CAPTURE_ROUTE = '/onboarding/capture' as Href;
export const ONBOARDING_EMOTION_ROUTE = '/onboarding/emotion' as Href;

/** Paywall post-onboarding (skip o check-in completo) → tabs. */
export function goToOnboardingPaywall(): void {
  router.replace({
    pathname: '/paywall',
    params: ONBOARDING_PAYWALL_PARAMS,
  });
}
