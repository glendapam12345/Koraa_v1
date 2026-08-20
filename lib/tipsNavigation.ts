import type { Router } from 'expo-router';
import type { TipsUserContext, TipCategoryId } from '@/lib/tipsTypes';
import { replaceToHoyTab } from '@/lib/tabNavigation';

type RouterPush = Pick<Router, 'push' | 'back' | 'replace' | 'canGoBack'>;

export function openTipsCategory(
  router: RouterPush,
  category: TipCategoryId,
  context?: Pick<TipsUserContext, 'emotion' | 'energyLevel'>,
  focusTipId?: string,
): void {
  router.push({
    pathname: '/tips/[category]',
    params: {
      category,
      emotion: (context?.emotion ?? 'tranquila').toLowerCase(),
      energy: String(context?.energyLevel ?? 3),
      ...(focusTipId ? { focusTipId } : {}),
    },
  });
}

/** Vuelve a la pantalla anterior o a Hoy si no hay historial. */
export function tipsGoBack(router: RouterPush): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  replaceToHoyTab();
}
