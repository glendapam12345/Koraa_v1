import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/** Ruta fail-safe cuando no se puede leer el perfil o el usuario no completó onboarding */
export const WELCOME_ROUTE = '/onboarding/welcome' as const;
const TABS_ROUTE = '/(tabs)' as const;

export type PostAuthRoute = typeof WELCOME_ROUTE | typeof TABS_ROUTE;

export type PostAuthGateResult =
  | { status: 'ok'; route: PostAuthRoute }
  | { status: 'error'; reason: 'profile_read_failed' };

/**
 * Resuelve ruta post-auth. Si falla la lectura del perfil (red/servidor), devuelve error
 * para mostrar reintento — no enviar a onboarding por fail-closed.
 */
export async function resolvePostAuthGate(userId: string): Promise<PostAuthGateResult> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.debug('onboardingGate: perfil no leído', error.message);
      return { status: 'error', reason: 'profile_read_failed' };
    }
    if (!data) {
      return { status: 'ok', route: WELCOME_ROUTE };
    }
    return {
      status: 'ok',
      route: data.onboarding_completed === true ? TABS_ROUTE : WELCOME_ROUTE,
    };
  } catch (e) {
    logger.debug('onboardingGate', e);
    return { status: 'error', reason: 'profile_read_failed' };
  }
}

/**
 * Devuelve la ruta tras login/sesión: welcome si el perfil no marcó onboarding, tabs si ya.
 * En error de lectura, fail-closed a welcome (usar resolvePostAuthGate en gates con retry).
 */
export async function getPostAuthRoute(userId: string): Promise<PostAuthRoute> {
  const result = await resolvePostAuthGate(userId);
  if (result.status === 'error') {
    return WELCOME_ROUTE;
  }
  return result.route;
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
