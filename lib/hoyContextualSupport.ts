import type { DayData } from '@/lib/checkInDayData';
import type { TranslationKey } from '@/lib/i18n';
import { getTipsActionHero } from '@/lib/tipsActionHero';
import type { TipsUserContext } from '@/lib/tipsTypes';

export type HoySupportAction =
  | { type: 'tips' }
  | { type: 'session'; minutes: number };

export type HoyContextualContent = {
  messageKey: TranslationKey;
  messageParams?: Record<string, string | number>;
  ctaKey: TranslationKey;
  action: HoySupportAction;
};

const HOY_MESSAGE_BY_TIPS: Partial<Record<TranslationKey, TranslationKey>> = {
  'tips.actionHeroAbrumada': 'hoy.supportAbrumada',
  'tips.actionHeroFocused': 'hoy.supportFocused',
  'tips.actionHeroLowEnergy': 'hoy.supportLowEnergy',
  'tips.actionHeroHighEnergy': 'hoy.supportHighEnergy',
  'tips.actionHeroDefault': 'hoy.supportDefault',
};

export function getHoyContextualSupport(
  ctx: TipsUserContext,
  weekData: DayData[] = [],
): HoyContextualContent {
  const tipsHero = getTipsActionHero(ctx, weekData);
  const messageKey =
    HOY_MESSAGE_BY_TIPS[tipsHero.messageKey] ?? 'hoy.supportDefault';

  if (tipsHero.action.type === 'pause') {
    return {
      messageKey,
      messageParams: tipsHero.messageParams,
      ctaKey: 'hoy.supportCtaPause',
      action: { type: 'tips' },
    };
  }

  if (tipsHero.messageKey === 'tips.actionHeroHighEnergy') {
    return {
      messageKey,
      ctaKey: 'hoy.supportCtaSession',
      action: { type: 'session', minutes: 5 },
    };
  }

  if (tipsHero.messageKey === 'tips.actionHeroFocused') {
    return {
      messageKey,
      ctaKey: 'hoy.supportCtaSession',
      action: { type: 'session', minutes: 5 },
    };
  }

  return {
    messageKey,
    messageParams: tipsHero.messageParams,
    ctaKey: 'hoy.supportCtaMore',
    action: { type: 'tips' },
  };
}
