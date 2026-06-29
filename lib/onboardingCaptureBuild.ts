import type { AppLocale } from '@/lib/i18n';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
import { BRAIN_DUMP_PRESET_CUSTOM_IDS } from '@/lib/review/brainDumpAreaPreset';
import { inferCaptureItemLifeArea } from '@/lib/review/inferCaptureItemLifeArea';
import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';

export const ONBOARDING_CAPTURE_MAX_ITEMS = 8;

/** Mezcla actividades frecuentes como ejemplos para inferir área en captura guiada. */
export function enrichAreaConfigWithFavoriteActivities(
  config: UserLifeAreasConfig,
  activities: string[],
): UserLifeAreasConfig {
  const normalized = activities.map((item) => item.trim()).filter(Boolean);
  if (normalized.length === 0) return config;

  const activityBlob = normalized.join(', ');
  const mergeExamples = (existing?: string) => {
    const parts = [existing?.trim(), activityBlob].filter(Boolean);
    return parts.join(', ');
  };

  const personalId = BRAIN_DUMP_PRESET_CUSTOM_IDS.personal;

  return {
    ...config,
    customExamples: {
      ...config.customExamples,
      [personalId]: mergeExamples(config.customExamples?.[personalId]),
    },
  };
}

export function buildOnboardingCaptureItems(
  rawInput: string,
  locale: AppLocale,
  config: UserLifeAreasConfig,
  favoriteActivities: string[] = [],
): VaciarBatchItem[] {
  const enriched = enrichAreaConfigWithFavoriteActivities(config, favoriteActivities);
  return parseCaptureToInboxItems(rawInput, locale)
    .slice(0, ONBOARDING_CAPTURE_MAX_ITEMS)
    .map((item) => ({
      ...item,
      assignToProject: false,
      selectedCategory: '',
      selectedProjectId: null,
      lifeAreaKey: inferCaptureItemLifeArea(item.content, enriched),
    }));
}

export function countOnboardingCaptureItems(rawInput: string, locale: AppLocale): number {
  return parseCaptureToInboxItems(rawInput, locale).length;
}
