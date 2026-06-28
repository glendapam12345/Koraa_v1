import type { AppLocale } from '@/lib/i18n';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
import { inferCaptureItemLifeArea } from '@/lib/review/inferCaptureItemLifeArea';
import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';

export const ONBOARDING_CAPTURE_MAX_ITEMS = 8;

export function buildOnboardingCaptureItems(
  rawInput: string,
  locale: AppLocale,
  config: UserLifeAreasConfig,
): VaciarBatchItem[] {
  return parseCaptureToInboxItems(rawInput, locale)
    .slice(0, ONBOARDING_CAPTURE_MAX_ITEMS)
    .map((item) => ({
      ...item,
      assignToProject: false,
      selectedCategory: '',
      selectedProjectId: null,
      lifeAreaKey: inferCaptureItemLifeArea(item.content, config),
    }));
}

export function countOnboardingCaptureItems(rawInput: string, locale: AppLocale): number {
  return parseCaptureToInboxItems(rawInput, locale).length;
}
