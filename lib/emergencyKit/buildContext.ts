import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import type { EmergencyKitSessionPayload } from './types';
import type { EmergencyKitEventId } from './types';
import {
  filterLettersForEvent,
  getItemTitle,
  loadComfortItems,
  loadPreferences,
} from './storage';

const LOOKBACK_DAYS = 14;

export async function buildEmergencyKitContext(
  userId: string,
  eventId: EmergencyKitEventId,
  customText: string | undefined,
  locale: 'es' | 'en'
): Promise<EmergencyKitSessionPayload> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (LOOKBACK_DAYS - 1));
  const rangeStart = getLocalDateString(start);
  const rangeEnd = getLocalDateString(today);

  const { data: rows } = await supabase
    .from('daily_check_ins')
    .select('date, emotion, energy_level')
    .eq('user_id', userId)
    .gte('date', rangeStart)
    .lte('date', rangeEnd)
    .order('date', { ascending: true });

  const checkIns = rows ?? [];
  const recentEmotions = checkIns
    .slice(-7)
    .map((r) => r.emotion)
    .filter((e): e is string => !!e);

  const energyLevels = checkIns
    .map((r) => r.energy_level)
    .filter((e): e is number => typeof e === 'number');

  const avgEnergy =
    energyLevels.length > 0
      ? Math.round((energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length) * 10) / 10
      : null;

  let energyTrend: EmergencyKitSessionPayload['energyTrend'] = 'unknown';
  if (energyLevels.length >= 4) {
    const recent = energyLevels.slice(-3);
    const earlier = energyLevels.slice(0, -3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    if (recentAvg - earlierAvg >= 0.5) energyTrend = 'rising';
    else if (earlierAvg - recentAvg >= 0.5) energyTrend = 'low';
    else energyTrend = 'steady';
  } else if (avgEnergy !== null && avgEnergy <= 2.5) {
    energyTrend = 'low';
  }

  const items = await loadComfortItems();
  const prefs = await loadPreferences();
  const letters = filterLettersForEvent(
    items.filter((i) => i.type === 'letters'),
    eventId
  );

  return {
    eventId,
    customText: customText?.trim() || undefined,
    locale,
    recentEmotions,
    avgEnergy,
    energyTrend,
    checkInCount: checkIns.length,
    savedItemTitles: items.map(getItemTitle).slice(0, 24),
    letterSnippets: letters.map((l) => l.content).slice(0, 5),
    preferences: prefs,
  };
}
