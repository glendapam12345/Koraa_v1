import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';

/** Color de acento sugerido para un proyecto según su área de vida. */
export function getLifeAreaAccentColor(ref: LifeAreaRef, index = 0): string {
  const themeKey: LifeAreaKey | 'other' | 'loose' = isCustomLifeAreaRef(ref) ? 'other' : ref;
  return frontThemeForKey(themeKey, index).accent;
}
