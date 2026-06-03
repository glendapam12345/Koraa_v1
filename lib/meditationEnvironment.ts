import { isExpoGoClient } from '@/lib/subscriptionEnvironment';

/** Meditación usa UI simplificada (sin anillo SVG/Reanimated) en Expo Go. */
export function showsSimplifiedMeditationNotice(): boolean {
  return isExpoGoClient();
}
