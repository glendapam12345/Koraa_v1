import { PenTool, Heart, Sparkles } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { TranslationKey } from '@/lib/i18n';

export type KoraaGuideStep = {
  labelKey: TranslationKey;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  Icon: LucideIcon;
};

/** Tres pasos del flujo core: Tareas → check-in → pasos sugeridos en Hoy. */
export const KORAA_GUIDE_STEPS: KoraaGuideStep[] = [
  {
    labelKey: 'koraaGuide.step1Label',
    titleKey: 'onboarding.howItWorks.step1Title',
    bodyKey: 'onboarding.howItWorks.step1Body',
    Icon: PenTool,
  },
  {
    labelKey: 'koraaGuide.step2Label',
    titleKey: 'onboarding.howItWorks.step2Title',
    bodyKey: 'onboarding.howItWorks.step2Body',
    Icon: Heart,
  },
  {
    labelKey: 'koraaGuide.step3Label',
    titleKey: 'onboarding.howItWorks.step3Title',
    bodyKey: 'onboarding.howItWorks.step3Body',
    Icon: Sparkles,
  },
];
