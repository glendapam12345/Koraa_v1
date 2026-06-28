import type { AppLocale } from '@/lib/i18n';
import { TIPS_CATALOG_EN } from '@/lib/i18n/locales/tipsCatalog.en';
import { TIPS_CATALOG_ES } from '@/lib/i18n/locales/tipsCatalog.es';
import type { ScoredTip } from '@/lib/tipsPersonalization';

function catalogForLocale(locale: AppLocale) {
  return locale === 'en' ? TIPS_CATALOG_EN : TIPS_CATALOG_ES;
}

/** Resuelve IDs del brief diario a entradas del catálogo (marcadas para mí). */
export function resolveTipsByIds(tipIds: string[], locale: AppLocale): ScoredTip[] {
  const byId = new Map(catalogForLocale(locale).map((tip) => [tip.id, tip]));
  const resolved: ScoredTip[] = [];

  for (const id of tipIds) {
    const tip = byId.get(id);
    if (!tip) continue;
    resolved.push({ ...tip, score: 10, forYou: true });
  }

  return resolved;
}
