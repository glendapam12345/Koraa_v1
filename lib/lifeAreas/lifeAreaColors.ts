import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { CUSTOM_LIFE_AREA_PREFIX, isCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';

/** Color de acento sugerido para un proyecto según su área de vida. */
export function getLifeAreaAccentColor(
  ref: LifeAreaRef,
  index = 0,
  config?: UserLifeAreasConfig,
): string {
  if (config && isCustomLifeAreaRef(ref)) {
    const id = ref.slice(CUSTOM_LIFE_AREA_PREFIX.length);
    const custom = config.custom.find((entry) => entry.id === id);
    if (custom?.color) return custom.color;
  }

  const themeKey: LifeAreaKey | 'other' | 'loose' = isCustomLifeAreaRef(ref) ? 'other' : ref;
  return frontThemeForKey(themeKey, index).accent;
}
