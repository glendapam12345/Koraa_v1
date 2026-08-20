import {
  HOY_TAB_HREF,
  goToHoyTab,
  pushToHoyTab,
  replaceToHoyTab,
} from '@/lib/tabNavigation';

/**
 * Hoy — never `/`. Typed `/` is `app/index.tsx` (boot), which remounts the app
 * and looks like a crash when updating mood or following a check-in link.
 */
export const CHECK_IN_ROUTE = HOY_TAB_HREF;

export function goToCheckIn(params?: Record<string, string>): void {
  if (params && Object.keys(params).length > 0) {
    pushToHoyTab(params);
    return;
  }
  goToHoyTab();
}

export function replaceToCheckIn(params?: Record<string, string>): void {
  replaceToHoyTab(params);
}

export { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
