import type { TranslationKey } from '@/lib/i18n';

/** Traduce nombres de áreas custom preset (Familia, Personal) según locale. */
export function makePresetCustomAreaLabelGetter(
  t: (key: TranslationKey) => string,
): (presetCustomId: string) => string {
  return (presetCustomId) => t(`lifeAreasPreset.${presetCustomId}` as TranslationKey);
}
