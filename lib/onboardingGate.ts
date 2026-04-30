import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const WELCOME_ROUTE = '/onboarding/welcome' as const;
const TABS_ROUTE = '/(tabs)' as const;

export type PostAuthRoute = typeof WELCOME_ROUTE | typeof TABS_ROUTE;

/**
 * Devuelve la ruta tras login/sesión: welcome si el perfil no marcó onboarding, tabs si ya.
 */
export async function getPostAuthRoute(userId: string): Promise<PostAuthRoute> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.debug('onboardingGate: perfil no leído', error.message);
      return WELCOME_ROUTE;
    }
    if (!data) {
      return WELCOME_ROUTE;
    }
    return data.onboarding_completed === true ? TABS_ROUTE : WELCOME_ROUTE;
  } catch (e) {
    logger.debug('onboardingGate', e);
    return WELCOME_ROUTE;
  }
}

export async function markOnboardingCompleted(userId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error('Unknown') };
  }
}
