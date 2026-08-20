import { router, type Href } from 'expo-router';
import { HOY_TAB_PATH } from '@/lib/hoyTabPath';

export { HOY_TAB_PATH } from '@/lib/hoyTabPath';
export type { HoyTabPath as HoyTabHref } from '@/lib/hoyTabPath';

/** Cast route for Expo Router (typed routes map Hoy to `/`). */
export const HOY_TAB_HREF = HOY_TAB_PATH as Href;

export function goToHoyTab(): void {
  router.navigate(HOY_TAB_HREF);
}

export function replaceToHoyTab(params?: Record<string, string>): void {
  if (params && Object.keys(params).length > 0) {
    router.replace({ pathname: HOY_TAB_PATH, params } as unknown as Href);
    return;
  }
  router.replace(HOY_TAB_HREF);
}

export function pushToHoyTab(params?: Record<string, string>): void {
  if (params && Object.keys(params).length > 0) {
    router.push({ pathname: HOY_TAB_PATH, params } as unknown as Href);
    return;
  }
  router.navigate(HOY_TAB_HREF);
}
