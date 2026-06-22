import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import {
  mergeUserLifeAreasIntoPreferences,
  parseUserLifeAreasFromPreferences,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import { logger } from '@/lib/logger';
import { markOnboardingCompleted } from '@/lib/onboardingGate';
import { buildDefaultOnboardingAreaConfig } from '@/lib/review/onboardingAreaSelection';

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
  return markOnboardingCompleted(userId);
}

export const ONBOARDING_PAYWALL_PARAMS = {
  next: '/(tabs)',
  source: 'onboarding',
} as const;
