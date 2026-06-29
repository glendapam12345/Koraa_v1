import { isSupabaseConfigured } from '@/lib/supabase';

/** Cliente: IA de Koraa Brain / coach habilitada vía env. */
export function isKoraaBrainAiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return flag === 'true' || flag === '1';
}

export type KoraaBrainClientStatus = {
  aiFlagEnabled: boolean;
  supabaseConfigured: boolean;
  /** Listo para invocar edge functions con sesión. */
  canInvoke: boolean;
};

export function getKoraaBrainClientStatus(): KoraaBrainClientStatus {
  const aiFlagEnabled = isKoraaBrainAiEnabled();
  const supabaseConfigured = isSupabaseConfigured;
  return {
    aiFlagEnabled,
    supabaseConfigured,
    canInvoke: aiFlagEnabled && supabaseConfigured,
  };
}
