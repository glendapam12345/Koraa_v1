import type { Router } from 'expo-router';

type RouterPush = Pick<Router, 'push'>;

/** Abre paywall y vuelve a `next` al cerrar (si se pasa). */
export function openPaywall(router: RouterPush, next?: string): void {
  if (next?.startsWith('/')) {
    router.push({ pathname: '/paywall', params: { next } });
    return;
  }
  router.push('/paywall');
}

export function resolvePaywallDismissRoute(options: {
  next?: string;
  source?: string;
  canGoBack: boolean;
}): 'back' | string {
  if (options.source === 'onboarding') {
    return options.next?.startsWith('/') ? options.next : '/(tabs)';
  }
  if (options.canGoBack) return 'back';
  return options.next?.startsWith('/') ? options.next : '/(tabs)';
}
