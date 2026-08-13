import { PenTool, Heart, Sparkles, Star } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { TranslationKey } from '@/lib/i18n';

export type KoraaGuideStep = {
  labelKey: TranslationKey;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  Icon: LucideIcon;
};

/** Cuatro pasos del loop: Suelta → Siente → Se adapta → Un paso. */
export const KORAA_GUIDE_STEPS: KoraaGuideStep[] = [
  {
    labelKey: 'koraaGuide.step1Label',
    titleKey: 'onboarding.flow.step1Title',
    bodyKey: 'onboarding.flow.step1Body',
    Icon: PenTool,
  },
  {
    labelKey: 'koraaGuide.step2Label',
    titleKey: 'onboarding.flow.step2Title',
    bodyKey: 'onboarding.flow.step2Body',
    Icon: Heart,
  },
  {
    labelKey: 'koraaGuide.step3Label',
    titleKey: 'onboarding.flow.step3Title',
    bodyKey: 'onboarding.flow.step3Body',
    Icon: Sparkles,
  },
  {
    labelKey: 'koraaGuide.step4Label',
    titleKey: 'onboarding.flow.step4Title',
    bodyKey: 'onboarding.flow.step4Body',
    Icon: Star,
  },
];
