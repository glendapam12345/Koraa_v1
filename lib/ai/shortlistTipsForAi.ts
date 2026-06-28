import type { AppLocale } from '@/lib/i18n';
import { getPersonalizedTips } from '@/lib/tipsPersonalization';
import type { TipsUserContext } from '@/lib/tipsTypes';
import type { TipCandidate } from '@/lib/ai/types';

const DEFAULT_SHORTLIST_SIZE = 12;

/** Top tips del catálogo (scoring local) para que la IA elija 2–3 IDs válidos. */
export function shortlistTipsForAi(
  ctx: TipsUserContext,
  locale: AppLocale,
  limit = DEFAULT_SHORTLIST_SIZE,
): TipCandidate[] {
  return getPersonalizedTips(ctx, locale)
    .slice(0, limit)
    .map((tip) => ({
      id: tip.id,
      category: tip.category,
      title: tip.title,
    }));
}
