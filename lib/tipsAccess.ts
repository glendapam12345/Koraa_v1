import type { AppLocale } from '@/lib/i18n';
import { TIPS_CATALOG_EN } from '@/lib/i18n/locales/tipsCatalog.en';
import { TIPS_CATALOG_ES } from '@/lib/i18n/locales/tipsCatalog.es';
import type { TipCategoryId } from '@/lib/tipsTypes';

/** Consejos visibles por categoría en plan gratis (debe coincidir con la pantalla de categoría). */
export const FREE_TIPS_LIMIT = 3;

function catalogForLocale(locale: AppLocale) {
  return locale === 'en' ? TIPS_CATALOG_EN : TIPS_CATALOG_ES;
}

export function getCatalogCountByCategory(
  locale: AppLocale = 'es',
): Record<TipCategoryId, number> {
  const counts: Record<TipCategoryId, number> = {
    mindset: 0,
    rest: 0,
    action: 0,
    productivity: 0,
  };
  for (const tip of catalogForLocale(locale)) {
    counts[tip.category] += 1;
  }
  return counts;
}

/** Conteo que debe mostrarse en tarjetas de categoría (honesto con plan gratis). */
export function getDisplayTipsCountByCategory(
  locale: AppLocale,
  isSubscribed: boolean,
): Record<TipCategoryId, number> {
  const totals = getCatalogCountByCategory(locale);
  if (isSubscribed) return totals;
  return {
    mindset: Math.min(totals.mindset, FREE_TIPS_LIMIT),
    rest: Math.min(totals.rest, FREE_TIPS_LIMIT),
    action: Math.min(totals.action, FREE_TIPS_LIMIT),
    productivity: Math.min(totals.productivity, FREE_TIPS_LIMIT),
  };
}

export function getLockedTipsInCategory(
  category: TipCategoryId,
  locale: AppLocale,
  isSubscribed: boolean,
): number {
  if (isSubscribed) return 0;
  const total = getCatalogCountByCategory(locale)[category];
  return Math.max(0, total - FREE_TIPS_LIMIT);
}
