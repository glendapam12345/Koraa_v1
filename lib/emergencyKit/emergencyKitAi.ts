import { supabase } from '@/lib/supabase';
import { buildFallbackEmergencyKitResponse } from './fallbackMessage';
import type { EmergencyKitAiResponse, EmergencyKitSessionPayload } from './types';

const AI_ENABLED = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED === 'true';

export async function fetchEmergencyKitSession(
  payload: EmergencyKitSessionPayload,
  savedItemIds: string[]
): Promise<EmergencyKitAiResponse> {
  const fallback = buildFallbackEmergencyKitResponse(payload);

  if (!AI_ENABLED) {
    return fallback;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return fallback;

    const { data, error } = await supabase.functions.invoke('emergency-kit', {
      body: { ...payload, savedItemIds },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error || !data) return fallback;

    const parsed = data as Partial<EmergencyKitAiResponse>;
    if (!parsed.supportMessage || !Array.isArray(parsed.gentleActions)) {
      return fallback;
    }

    return {
      supportMessage: parsed.supportMessage,
      gentleActions: parsed.gentleActions.slice(0, 6),
      patternInsight: parsed.patternInsight,
      crisisMode: parsed.crisisMode ?? fallback.crisisMode,
      prioritizedModules: parsed.prioritizedModules?.length
        ? parsed.prioritizedModules
        : fallback.prioritizedModules,
      recommendedItemIds: parsed.recommendedItemIds ?? [],
      fromAi: true,
    };
  } catch {
    return fallback;
  }
}
