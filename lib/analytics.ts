import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const ENABLED =
  typeof process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'string'
    ? process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false'
    : true;

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

function isMissingTableOrPolicy(error: { code?: string; message?: string }): boolean {
  const msg = error.message?.toLowerCase() ?? '';
  return error.code === '42P01' || msg.includes('does not exist');
}

/**
 * Registra un evento de producto (requiere sesión). Sin contenido de tareas ni email.
 */
export async function track(eventName: string, properties?: AnalyticsProps): Promise<void> {
  if (!ENABLED) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const clean: Record<string, string | number | boolean | null> = {};
    if (properties) {
      for (const [k, v] of Object.entries(properties)) {
        if (v === undefined) continue;
        clean[k] = v === null ? null : v;
      }
    }

    const { error } = await supabase.from('app_events').insert({
      user_id: user.id,
      event_name: eventName,
      properties: clean,
      platform: Platform.OS,
    });

    if (error && !isMissingTableOrPolicy(error)) {
      logger.debug('[analytics]', eventName, error.message);
    }
  } catch (e) {
    logger.debug('[analytics] unexpected', e);
  }
}

export function trackScreen(screen: string): void {
  void track('screen_view', { screen });
}
