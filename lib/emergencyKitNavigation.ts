import type { Router } from 'expo-router';
import { router as defaultRouter } from 'expo-router';
import { openPaywall } from '@/lib/paywallNavigation';
import type { EmergencyKitSessionState } from '@/lib/emergencyKit/types';

type RouterPush = Pick<Router, 'push'>;

type OpenEmergencyKitOptions = {
  /** Si true y hay sesión guardada, abre la sesión anterior sin pasar por selección. */
  resume?: boolean;
};

/** Abre Emergency Kit si hay Premium; si no, paywall con retorno a /emergency-kit. */
export function openEmergencyKit(
  isSubscribed: boolean,
  lastSession: EmergencyKitSessionState | null | undefined,
  router: RouterPush = defaultRouter,
  options?: OpenEmergencyKitOptions,
): void {
  if (!isSubscribed) {
    openPaywall(router, '/emergency-kit');
    return;
  }

  if (options?.resume && lastSession) {
    router.push({
      pathname: '/emergency-kit/session',
      params: {
        eventId: lastSession.eventId,
        customText: lastSession.customText ?? '',
      },
    });
    return;
  }

  router.push('/emergency-kit');
}
