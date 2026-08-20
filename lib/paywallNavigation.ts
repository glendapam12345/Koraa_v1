import type { Router } from 'expo-router';
import { HOY_TAB_PATH } from '@/lib/hoyTabPath';

type RouterPush = Pick<Router, 'push'>;

function safeReturnPath(next?: string): string {
  if (!next || next === '/' || next === '/(tabs)') return HOY_TAB_PATH;
  return next.startsWith('/') ? next : HOY_TAB_PATH;
}

/** Abre paywall y vuelve a `next` al cerrar (si se pasa). */
export function openPaywall(router: RouterPush, next?: string): void {
  if (next?.startsWith('/')) {
    router.push({ pathname: '/paywall', params: { next: safeReturnPath(next) } });
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
    return safeReturnPath(options.next);
  }
  // post_hoy y demás: volver a Hoy si se abrió con push
  if (options.canGoBack) return 'back';
  return safeReturnPath(options.next);
}
