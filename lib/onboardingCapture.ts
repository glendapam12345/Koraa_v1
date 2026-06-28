import type { AppLocale } from '@/lib/i18n';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { parseUserLifeAreasFromPreferences } from '@/lib/lifeAreas/userLifeAreas';
import { batchItemToDraft } from '@/lib/vaciarBatchDraft';
import { createVaciarTask } from '@/lib/vaciarCreateTask';
import { track } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import {
  buildOnboardingCaptureItems,
  countOnboardingCaptureItems,
  ONBOARDING_CAPTURE_MAX_ITEMS,
} from '@/lib/onboardingCaptureBuild';

export {
  buildOnboardingCaptureItems,
  countOnboardingCaptureItems,
  ONBOARDING_CAPTURE_MAX_ITEMS,
};

export async function saveOnboardingCaptureForUser(
  userId: string,
  rawInput: string,
  locale: AppLocale,
): Promise<{ error: Error | null; savedCount: number }> {
  const { data, error: profileError } = await fetchProfilePreferences(userId);
  if (profileError) {
    return { error: new Error(profileError.message), savedCount: 0 };
  }

  const config = parseUserLifeAreasFromPreferences(data?.other_preferences ?? {});
  const items = buildOnboardingCaptureItems(rawInput, locale, config);
  if (items.length === 0) {
    return { error: null, savedCount: 0 };
  }

  let savedCount = 0;

  for (const item of items) {
    const result = await createVaciarTask(batchItemToDraft(item), {
      locale,
      hasCheckInToday: false,
    });

    if (result.status === 'not_authenticated') {
      return { error: new Error('not_authenticated'), savedCount };
    }

    if (result.status === 'error') {
      logger.warn('onboardingCapture: fallo al guardar tarea', item.content.slice(0, 40));
      if (savedCount === 0) {
        return { error: new Error('save_failed'), savedCount: 0 };
      }
      break;
    }

    savedCount += 1;
  }

  if (savedCount > 0) {
    void track('onboarding_capture_saved', { count: savedCount });
  }

  return { error: null, savedCount };
}
