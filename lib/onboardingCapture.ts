import type { AppLocale } from '@/lib/i18n';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { parseUserLifeAreasFromPreferences } from '@/lib/lifeAreas/userLifeAreas';
import { batchItemToDraft } from '@/lib/vaciarBatchDraft';
import { createVaciarTask } from '@/lib/vaciarCreateTask';
import { track } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { ensureOneHoyStepFromCapture } from '@/lib/ensureOneHoyStepFromCapture';
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

export type OnboardingCaptureSaveResult = {
  error: Error | null;
  savedCount: number;
  attemptedCount: number;
  partialFailure: boolean;
};

export async function saveOnboardingCaptureForUser(
  userId: string,
  rawInput: string,
  locale: AppLocale,
): Promise<OnboardingCaptureSaveResult> {
  const { data, error: profileError } = await fetchProfilePreferences(userId);
  if (profileError) {
    return { error: new Error(profileError.message), savedCount: 0, attemptedCount: 0, partialFailure: false };
  }

  const config = parseUserLifeAreasFromPreferences(data?.other_preferences ?? {});
  const favoriteActivities = data?.favorite_activities ?? [];
  const items = buildOnboardingCaptureItems(rawInput, locale, config, favoriteActivities);
  const attemptedCount = items.length;
  if (attemptedCount === 0) {
    return { error: null, savedCount: 0, attemptedCount: 0, partialFailure: false };
  }

  let savedCount = 0;

  for (const item of items) {
    const result = await createVaciarTask(batchItemToDraft(item), {
      locale,
      hasCheckInToday: false,
    });

    if (result.status === 'not_authenticated') {
      if (savedCount === 0) {
        return {
          error: new Error('not_authenticated'),
          savedCount: 0,
          attemptedCount,
          partialFailure: false,
        };
      }
      logger.warn('onboardingCapture: sesión perdida tras guardar parcialmente');
      return { error: null, savedCount, attemptedCount, partialFailure: true };
    }

    if (result.status === 'error') {
      logger.warn('onboardingCapture: fallo al guardar tarea', item.content.slice(0, 40));
      if (savedCount === 0) {
        return { error: new Error('save_failed'), savedCount: 0, attemptedCount, partialFailure: false };
      }
      return { error: null, savedCount, attemptedCount, partialFailure: true };
    }

    savedCount += 1;
  }

  if (savedCount > 0) {
    void track('onboarding_capture_saved', { count: savedCount });
    await ensureOneHoyStepFromCapture(userId);
  }

  return { error: null, savedCount, attemptedCount, partialFailure: false };
}
