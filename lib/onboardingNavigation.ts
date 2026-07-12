import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { ONBOARDING_PAYWALL_PARAMS } from '@/lib/finishOnboarding';
import { scheduleDeferredOnboardingPaywall } from '@/lib/deferredOnboardingPaywall';

/** Rutas tipadas del stack de onboarding. */
export const ONBOARDING_AREAS_ROUTE = '/onboarding/areas' as Href;
export const ONBOARDING_ACTIVITIES_ROUTE = '/onboarding/activities' as Href;
export const ONBOARDING_CAPTURE_ROUTE = '/onboarding/capture' as Href;
export const ONBOARDING_EMOTION_ROUTE = '/onboarding/emotion' as Href;
export const TABS_ROUTE = '/(tabs)' as Href;

/** Paywall inmediato (legacy / tests). Preferir goToHoyAfterOnboarding. */
export function goToOnboardingPaywall(): void {
  router.replace({
    pathname: '/paywall',
    params: ONBOARDING_PAYWALL_PARAMS,
  });
}

/**
 * Tras onboarding: entra a Hoy y agenda paywall suave (opcional) tras ver el plan.
 */
export async function goToHoyAfterOnboarding(userId: string): Promise<void> {
  await scheduleDeferredOnboardingPaywall(userId);
  router.replace(TABS_ROUTE);
}

/** Abre paywall suave desde Hoy (usuario puede volver atrás). */
export function openPostHoyPaywall(): void {
  router.push({
    pathname: '/paywall',
    params: { next: '/(tabs)', source: 'post_hoy' },
  });
}
