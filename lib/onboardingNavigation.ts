import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { ONBOARDING_PAYWALL_PARAMS } from '@/lib/finishOnboarding';
import { HOY_TAB_PATH, HOY_TAB_HREF } from '@/lib/tabNavigation';

/** Rutas tipadas del stack de onboarding. */
export const ONBOARDING_AREAS_ROUTE = '/onboarding/areas' as Href;
export const ONBOARDING_ACTIVITIES_ROUTE = '/onboarding/activities' as Href;
export const ONBOARDING_CAPTURE_ROUTE = '/onboarding/capture' as Href;
export const ONBOARDING_NAME_ROUTE = '/onboarding/name' as Href;
export const ONBOARDING_EMOTION_ROUTE = '/onboarding/emotion' as Href;
export const ONBOARDING_REMINDERS_ROUTE = '/onboarding/reminders' as Href;
export const TABS_ROUTE = HOY_TAB_PATH;

/** Paywall inmediato (legacy / tests). Preferir goToHoyAfterOnboarding. */
export function goToOnboardingPaywall(): void {
  router.replace({
    pathname: '/paywall',
    params: ONBOARDING_PAYWALL_PARAMS,
  });
}

/** Pregunta opcional de recordatorio, justo antes de Hoy. */
export function goToOnboardingReminders(): void {
  router.replace(ONBOARDING_REMINDERS_ROUTE);
}

/**
 * Tras onboarding: entra a Hoy.
 * Paywall NO se agenda en day-1 (valor primero; premium desde Yo).
 */
export async function goToHoyAfterOnboarding(_userId: string): Promise<void> {
  router.replace(HOY_TAB_HREF);
}

/** Abre paywall suave desde Hoy (usuario puede volver atrás). */
export function openPostHoyPaywall(): void {
  router.push({
    pathname: '/paywall',
    params: { next: HOY_TAB_PATH, source: 'post_hoy' },
  });
}
