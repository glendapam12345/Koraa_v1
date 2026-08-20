/**
 * Tab Hoy (`app/(tabs)/index.tsx`). Expo Router resolves this as `/(tabs)`, not `/(tabs)/index`.
 * Never navigate to `/` from inside the app — that remounts the boot screen at `app/index.tsx`.
 */
export const HOY_TAB_PATH = '/(tabs)' as const;

export type HoyTabPath = typeof HOY_TAB_PATH;
