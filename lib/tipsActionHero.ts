import type { DayData } from '@/lib/checkInDayData';
import type { TranslationKey } from '@/lib/i18n';
import type { TipsUserContext } from '@/lib/tipsTypes';
import { HOY_TAB_PATH } from '@/lib/hoyTabPath';

export type TipsActionHeroRoute = typeof HOY_TAB_PATH | '/(tabs)/semana';

export type TipsActionHeroAction =
  | { type: 'route'; route: TipsActionHeroRoute }
  | { type: 'pause' };

export type TipsActionHeroContent = {
  messageKey: TranslationKey;
  messageParams?: Record<string, string | number>;
  ctaKey: TranslationKey;
  action: TipsActionHeroAction;
};

const HEAVY_EMOTIONS = new Set(['abrumada', 'agotada', 'ansiosa']);

function prefersPause(ctx: TipsUserContext): boolean {
  const emotion = ctx.emotion.toLowerCase();
  if (HEAVY_EMOTIONS.has(emotion)) return true;
  return ctx.energyLevel <= 2;
}

function withAction(
  content: Omit<TipsActionHeroContent, 'action' | 'ctaKey'>,
  ctx: TipsUserContext,
): TipsActionHeroContent {
  if (prefersPause(ctx)) {
    return {
      ...content,
      ctaKey: 'tips.actionHeroCtaPause',
      action: { type: 'pause' },
    };
  }
  return {
    ...content,
    ctaKey: 'tips.actionHeroCtaHoy',
    action: { type: 'route', route: HOY_TAB_PATH },
  };
}

export function getTipsActionHero(
  ctx: TipsUserContext,
  weekData: DayData[],
): TipsActionHeroContent {
  const emotion = ctx.emotion.toLowerCase();
  const energy = ctx.energyLevel;

  const recentCheckIns = weekData.filter((d) => d.hasCheckIn);
  const lowEnergyDays = recentCheckIns.filter((d) => (d.energyLevel ?? 3) <= 2).length;
  const abrumadaDays = recentCheckIns.filter((d) => d.emotion?.toLowerCase() === 'abrumada').length;
  const sustainedHeavyWeek = lowEnergyDays >= 3 || abrumadaDays >= 2;
  const heavyWeekDays = Math.max(lowEnergyDays, abrumadaDays, 1);

  if (emotion === 'abrumada') {
    return withAction(
      {
        messageKey: 'tips.actionHeroAbrumada',
        messageParams: { days: heavyWeekDays },
      },
      ctx,
    );
  }

  if (
    (emotion === 'agotada' || emotion === 'ansiosa') &&
    sustainedHeavyWeek
  ) {
    return withAction(
      {
        messageKey: 'tips.actionHeroAbrumada',
        messageParams: { days: heavyWeekDays },
      },
      ctx,
    );
  }

  if (emotion === 'enfocada' && energy >= 4) {
    return withAction({ messageKey: 'tips.actionHeroFocused' }, ctx);
  }

  if (energy <= 2) {
    return withAction({ messageKey: 'tips.actionHeroLowEnergy' }, ctx);
  }

  if (energy >= 4) {
    return {
      messageKey: 'tips.actionHeroHighEnergy',
      ctaKey: 'tips.actionHeroCtaHoy',
      action: { type: 'route', route: HOY_TAB_PATH },
    };
  }

  return withAction(
    {
      messageKey: 'tips.actionHeroDefault',
      messageParams: { energy },
    },
    ctx,
  );
}
