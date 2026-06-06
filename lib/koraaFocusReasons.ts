import type { TranslationKey } from '@/lib/i18n';

export type KoraaFocusCheckIn = {
  energyLevel: number;
  emotion: string;
  availableTime: string;
  focusLevel: string;
};

type ReasonItem = {
  key: TranslationKey;
  params?: Record<string, string | number>;
};

function timeBucket(availableTime: string): 'little' | 'medium' | 'plenty' | null {
  const lower = availableTime.toLowerCase();
  if (lower.includes('poco') || lower.includes('little') || lower.includes('1-2')) return 'little';
  if (lower.includes('bastante') || lower.includes('plenty') || lower.includes('4-6') || lower.includes('todo')) {
    return 'plenty';
  }
  if (lower.includes('medio') || lower.includes('medium') || lower.includes('2-4')) return 'medium';
  return null;
}

function focusBucket(focusLevel: string): 'low' | 'high' | null {
  const lower = focusLevel.toLowerCase();
  if (lower.includes('distra') || lower.includes('scatter')) return 'low';
  if (lower.includes('súper') || lower.includes('super') || lower.includes('very')) return 'high';
  if (lower === 'enfocada' || lower === 'focused') return 'high';
  return null;
}

/** i18n keys + params for bullets explaining Koraa's focus choices. */
export function buildKoraaFocusReasonItems(
  checkIn: KoraaFocusCheckIn,
  emotionLabel: string,
): ReasonItem[] {
  const emotionKey = checkIn.emotion.toLowerCase();
  const items: ReasonItem[] = [];

  items.push({
    key: 'hoy.koraaLogicEnergy',
    params: { level: checkIn.energyLevel },
  });

  const time = timeBucket(checkIn.availableTime);
  if (time === 'little') items.push({ key: 'hoy.koraaLogicTimeLittle' });
  else if (time === 'plenty') items.push({ key: 'hoy.koraaLogicTimePlenty' });
  else if (time === 'medium') items.push({ key: 'hoy.koraaLogicTimeMedium' });

  items.push({
    key: 'hoy.koraaLogicEmotion',
    params: { emotion: emotionLabel.toLowerCase() },
  });

  const focus = focusBucket(checkIn.focusLevel);
  if (focus === 'low') items.push({ key: 'hoy.koraaLogicFocusLow' });
  else if (focus === 'high') items.push({ key: 'hoy.koraaLogicFocusHigh' });

  if (checkIn.energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(emotionKey)) {
    items.push({ key: 'hoy.koraaLogicProtect' });
  }

  return items.slice(0, 4);
}
