import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KoraaDailyBrief, KoraaDayContext } from '@/lib/ai/types';

const CACHE_PREFIX = 'koraa_daily_brief_v2';

export function koraaDailyBriefCacheKey(userId: string, context: KoraaDayContext): string {
  const { date, checkIn } = context;
  return `${CACHE_PREFIX}_${userId}_${date}_${checkIn.emotionKey}_${checkIn.energyLevel}_${context.locale}`;
}

export async function readKoraaDailyBriefCache(key: string): Promise<KoraaDailyBrief | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KoraaDailyBrief;
    if (
      parsed?.coach?.actionLine &&
      Array.isArray(parsed.tipIds) &&
      typeof parsed.tipLead === 'string'
    ) {
      return {
        ...parsed,
        focusTaskIds: Array.isArray(parsed.focusTaskIds) ? parsed.focusTaskIds : [],
        planHeadline:
          typeof parsed.planHeadline === 'string' && parsed.planHeadline.trim()
            ? parsed.planHeadline
            : parsed.coach.actionLine,
        focusFromAi: Boolean(parsed.focusFromAi),
        fromAi: Boolean(parsed.fromAi),
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function writeKoraaDailyBriefCache(
  key: string,
  brief: KoraaDailyBrief,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(brief));
  } catch {
    /* ignore */
  }
}

export async function clearKoraaDailyBriefCache(userId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((key) => key.startsWith(`${CACHE_PREFIX}_${userId}_`));
    if (mine.length > 0) await AsyncStorage.multiRemove(mine);
  } catch {
    /* ignore */
  }
}
