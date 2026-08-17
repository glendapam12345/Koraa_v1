import type { NotifKind, NotifPatternTag } from '@/lib/notificationCopyBank';
import {
  resolveElliePresence,
  type EllieMood,
  type EllieMoment,
} from '@/lib/elliePersonality';

/** Retratos que existen como `ellie-notif-*.png`. */
export type EllieNotifMood = 'default' | 'happy' | 'sleepy' | 'breathing' | 'grateful';

function toNotifMood(mood: EllieMood): EllieNotifMood {
  switch (mood) {
    case 'happy':
    case 'proud':
      return 'happy';
    case 'sleepy':
    case 'cozy':
      return 'sleepy';
    case 'breathing':
    case 'comforting':
      return 'breathing';
    case 'grateful':
      return 'grateful';
    default:
      return 'default';
  }
}

function momentForKind(kind: NotifKind): EllieMoment {
  switch (kind) {
    case 'care':
      return 'notif_care';
    case 'capture':
      return 'notif_capture';
    case 'recheck':
      return 'notif_recheck';
    case 'daily':
    default:
      return 'notif_daily';
  }
}

/**
 * Retrato de Ellie en avisos — misma personalidad que en Hoy.
 * Tags de patrón (abrumada / energía baja) pisan el ciclo diario.
 */
export function resolveEllieNotifMood(
  kind: NotifKind,
  tags: NotifPatternTag[] = [],
  salt = 0,
): EllieNotifMood {
  if (tags.includes('overwhelmed')) {
    return toNotifMood(
      resolveElliePresence('hoy_check_in', {
        emotionKey: 'abrumada',
        energyLevel: 2,
      }).mood,
    );
  }
  if (tags.includes('low_energy')) {
    return toNotifMood(
      resolveElliePresence('hoy_check_in', {
        emotionKey: 'agotada',
        energyLevel: 2,
      }).mood,
    );
  }
  if (tags.includes('missed') || tags.includes('gentle_return')) {
    return toNotifMood(resolveElliePresence('step_done').mood);
  }
  return toNotifMood(resolveElliePresence(momentForKind(kind), { salt }).mood);
}
