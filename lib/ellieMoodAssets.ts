import { Asset } from 'expo-asset';
import type { EllieMood } from '@/lib/elliePersonality';

/** PNGs de Ellie por mood — compartidos en coach, onboarding y preload. */
export const ELLIE_MOOD_ASSETS: Record<EllieMood, number> = {
  default: require('@/assets/images/ellie-mascot.png'),
  breathing: require('@/assets/images/ellie-mood-breathing.png'),
  sleepy: require('@/assets/images/ellie-mood-sleepy.png'),
  happy: require('@/assets/images/ellie-mood-happy.png'),
  grateful: require('@/assets/images/ellie-mood-grateful.png'),
  focus: require('@/assets/images/ellie-mood-focus.png'),
  comforting: require('@/assets/images/ellie-mood-comforting.png'),
  proud: require('@/assets/images/ellie-mood-proud.png'),
  cozy: require('@/assets/images/ellie-mood-cozy.png'),
  curious: require('@/assets/images/ellie-mood-curious.png'),
};

let preloadPromise: Promise<void> | null = null;

/** Descarga/decodifica todos los retratos de Ellie en background (Hoy, onboarding). */
export function preloadEllieMoodAssets(): Promise<void> {
  if (!preloadPromise) {
    const modules = [...new Set(Object.values(ELLIE_MOOD_ASSETS))];
    preloadPromise = Promise.all(
      modules.map((moduleId) =>
        Asset.fromModule(moduleId)
          .downloadAsync()
          .catch(() => undefined),
      ),
    ).then(() => undefined);
  }
  return preloadPromise;
}
