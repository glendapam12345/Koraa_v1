import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import {
  mergeUserLifeAreasIntoPreferences,
  parseUserLifeAreasFromPreferences,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import { logger } from '@/lib/logger';
import { markOnboardingCompleted } from '@/lib/onboardingGate';
import { seedHoyLiteFirstDayIfUnset } from '@/lib/hoyLiteDay';
import { trackCohortDay0Once } from '@/lib/retentionD1';
import { track } from '@/lib/analytics';
import {
  buildAreaConfigFromOnboardingSelections,
  buildDefaultOnboardingAreaConfig,
  type OnboardingAreaSelection,
} from '@/lib/review/onboardingAreaSelection';
import { normalizeOnboardingActivities } from '@/lib/onboardingActivities';

export function needsDefaultLifeAreasSeed(config: UserLifeAreasConfig): boolean {
  return !config.columnOrder?.length;
}

/** Áreas Hogar + Personal + Trabajo sin pantalla extra en onboarding. */
export async function seedDefaultLifeAreasForUser(userId: string): Promise<boolean> {
  const { data } = await fetchProfilePreferences(userId);
  const otherPrefs = data?.other_preferences ?? {};
  const current = parseUserLifeAreasFromPreferences(otherPrefs);
  if (!needsDefaultLifeAreasSeed(current)) return true;

  const next = buildDefaultOnboardingAreaConfig(current);
  const merged = mergeUserLifeAreasIntoPreferences(otherPrefs, next);
  const { error } = await supabase
    .from('profiles')
    .update({ other_preferences: merged })
    .eq('id', userId);

  return !error;
}

/** Guarda áreas + ejemplos elegidos en onboarding (paso previo al check-in). */
export async function saveOnboardingLifeAreasForUser(
  userId: string,
  selections: OnboardingAreaSelection[],
): Promise<{ error: Error | null }> {
  const { data } = await fetchProfilePreferences(userId);
  const otherPrefs = data?.other_preferences ?? {};
  const current = parseUserLifeAreasFromPreferences(otherPrefs);
  const next = buildAreaConfigFromOnboardingSelections(current, selections);
  const merged = mergeUserLifeAreasIntoPreferences(otherPrefs, next);
  const { error } = await supabase
    .from('profiles')
    .update({ other_preferences: merged })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function saveDefaultOnboardingLifeAreasForUser(
  userId: string,
): Promise<{ error: Error | null }> {
  const { data } = await fetchProfilePreferences(userId);
  const otherPrefs = data?.other_preferences ?? {};
  const current = parseUserLifeAreasFromPreferences(otherPrefs);
  const next = buildDefaultOnboardingAreaConfig(current);
  const merged = mergeUserLifeAreasIntoPreferences(otherPrefs, next);
  const { error } = await supabase
    .from('profiles')
    .update({ other_preferences: merged })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/** Guarda actividades frecuentes elegidas en onboarding. */
export async function saveOnboardingFavoriteActivitiesForUser(
  userId: string,
  activities: string[],
): Promise<{ error: Error | null }> {
  const normalized = normalizeOnboardingActivities(activities);
  const { error } = await supabase
    .from('profiles')
    .update({ favorite_activities: normalized })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function completeOnboardingForUser(
  userId: string,
  options?: { seedAreas?: boolean },
): Promise<{ error: Error | null }> {
  if (options?.seedAreas !== false) {
    const seeded = await seedDefaultLifeAreasForUser(userId);
    if (!seeded) {
      logger.warn('finishOnboarding: no se pudieron guardar áreas por defecto');
    }
  }
  const result = await markOnboardingCompleted(userId);
  if (!result.error) {
    await seedHoyLiteFirstDayIfUnset(userId);
    void track('onboarding_completed', { source: 'finish_onboarding' });
    await trackCohortDay0Once(userId, undefined, 'onboarding');
  }
  return result;
}

export const ONBOARDING_PAYWALL_PARAMS = {
  next: '/(tabs)',
  source: 'onboarding',
} as const;
