import { track } from '@/lib/analytics';
import { queueCheckInCelebration } from '@/lib/checkInCelebration';
import { saveDailyCheckInAndPrioritize } from '@/lib/checkInService';
import { getDisplayName } from '@/lib/displayName';
import { seedDefaultLifeAreasForUser } from '@/lib/finishOnboarding';
import { markFirstSessionTourSeen } from '@/lib/firstSessionTour';
import { goToHoyAfterOnboarding } from '@/lib/onboardingNavigation';
import { markPrioritiesReadyToast } from '@/lib/prioritiesReadyToast';
import { markQuickOnboardingGuideSeen } from '@/lib/quickOnboardingGuide';
import type { AppLocale } from '@/lib/i18n';
import type { User } from '@supabase/supabase-js';

/** Defaults suaves: time/focus se afinan después en Hoy / recheck. */
export const ONBOARDING_DEFAULT_TIME = 'Medio (2-4hrs)';
export const ONBOARDING_DEFAULT_FOCUS = 'Normal';

export type CompleteOnboardingCheckInInput = {
  user: User;
  emotion: string;
  energyLevel: number;
  locale: AppLocale;
  emotionLabel: string;
  availableTime?: string;
  focusLevel?: string;
};

export type CompleteOnboardingCheckInResult = {
  success: boolean;
  offline?: boolean;
  onboardingMarkFailed?: boolean;
  errorMessage?: string;
};

/**
 * Guarda check-in, prioriza tareas capturadas, marca guías vistas
 * (sin tour/paywall day-1) y entra a Hoy.
 */
export async function completeOnboardingCheckInAndGoHoy(
  input: CompleteOnboardingCheckInInput,
): Promise<CompleteOnboardingCheckInResult> {
  const {
    user,
    emotion,
    energyLevel,
    locale,
    emotionLabel,
    availableTime = ONBOARDING_DEFAULT_TIME,
    focusLevel = ONBOARDING_DEFAULT_FOCUS,
  } = input;

  const result = await saveDailyCheckInAndPrioritize({
    userId: user.id,
    emotion: emotion.trim().toLowerCase(),
    energyLevel,
    availableTime,
    focusLevel,
    locale,
    displayName: getDisplayName(user, ''),
    emotionLabel,
  });

  if (!result.success) {
    return {
      success: false,
      errorMessage: result.errorMessage,
    };
  }

  try {
    const {
      ensureReturnTomorrowReminder,
      scheduleRecheckReminder,
      scheduleTaskCaptureReminder,
    } = await import('@/hooks/useNotifications');
    await ensureReturnTomorrowReminder(locale);
    await scheduleTaskCaptureReminder();
    await scheduleRecheckReminder(locale);
  } catch {
    /* no crítico */
  }

  await markPrioritiesReadyToast();
  await markQuickOnboardingGuideSeen();
  await markFirstSessionTourSeen(user.id);
  await seedDefaultLifeAreasForUser(user.id);

  void track('check_in_completed', {
    source: 'onboarding',
    offline: Boolean(result.offline),
    short_flow: true,
  });

  if (result.celebration) {
    await queueCheckInCelebration(result.celebration);
  }

  await goToHoyAfterOnboarding(user.id);

  return {
    success: true,
    offline: result.offline,
    onboardingMarkFailed: result.onboardingMarkFailed,
  };
}
