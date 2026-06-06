import type { DayData } from '@/components/ProgressChart';
import type { TranslationKey } from '@/lib/i18n';
import type { TipsUserContext } from '@/lib/tipsTypes';

export type TipsActionHeroRoute = '/(tabs)' | '/(tabs)/semana';

export type TipsActionHeroContent = {
  messageKey: TranslationKey;
  messageParams?: Record<string, string | number>;
  ctaKey: TranslationKey;
  route: TipsActionHeroRoute;
};

export function getTipsActionHero(
  ctx: TipsUserContext,
  weekData: DayData[],
): TipsActionHeroContent {
  const emotion = ctx.emotion.toLowerCase();
  const energy = ctx.energyLevel;

  const recentCheckIns = weekData.filter((d) => d.hasCheckIn);
  const lowEnergyDays = recentCheckIns.filter((d) => (d.energyLevel ?? 3) <= 2).length;
  const abrumadaDays = recentCheckIns.filter((d) => d.emotion?.toLowerCase() === 'abrumada').length;

  if (emotion === 'abrumada' && (energy <= 2 || lowEnergyDays >= 3 || abrumadaDays >= 2)) {
    return {
      messageKey: 'tips.actionHeroAbrumada',
      messageParams: { days: Math.max(lowEnergyDays, abrumadaDays, 1) },
      ctaKey: 'tips.actionHeroCtaHoy',
      route: '/(tabs)',
    };
  }

  if (emotion === 'enfocada' && energy >= 4) {
    return {
      messageKey: 'tips.actionHeroFocused',
      ctaKey: 'tips.actionHeroCtaHoy',
      route: '/(tabs)',
    };
  }

  if (energy <= 2) {
    return {
      messageKey: 'tips.actionHeroLowEnergy',
      ctaKey: 'tips.actionHeroCtaHoy',
      route: '/(tabs)',
    };
  }

  if (energy >= 4) {
    return {
      messageKey: 'tips.actionHeroHighEnergy',
      ctaKey: 'tips.actionHeroCtaHoy',
      route: '/(tabs)',
    };
  }

  return {
    messageKey: 'tips.actionHeroDefault',
    messageParams: { energy },
    ctaKey: 'tips.actionHeroCtaHoy',
    route: '/(tabs)',
  };
}
