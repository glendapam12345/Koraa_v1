import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KoraaWeekContext, KoraaWeeklyBrief } from '@/lib/ai/types';

const CACHE_PREFIX = 'koraa_weekly_brief_v1';

export function koraaWeeklyBriefCacheKey(userId: string, context: KoraaWeekContext): string {
  const { weekStart, locale, totals } = context;
  return `${CACHE_PREFIX}_${userId}_${weekStart}_${locale}_${totals.openTasks}_${totals.checkInDays}`;
}

export async function readKoraaWeeklyBriefCache(key: string): Promise<KoraaWeeklyBrief | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KoraaWeeklyBrief;
    if (
      typeof parsed?.headline === 'string' &&
      typeof parsed.summary === 'string' &&
      typeof parsed.gentleAdvice === 'string'
    ) {
      return {
        headline: parsed.headline,
        summary: parsed.summary,
        gentleAdvice: parsed.gentleAdvice,
        fromAi: Boolean(parsed.fromAi),
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function writeKoraaWeeklyBriefCache(
  key: string,
  brief: KoraaWeeklyBrief,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(brief));
  } catch {
    /* ignore */
  }
}
