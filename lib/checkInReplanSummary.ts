import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/lib/dateLocal';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';

export type CheckInReplanSummary = {
  movedCount: number;
  boostedCount: number;
  headline: string;
  subline: string;
  usedAi: boolean;
  reason: WhatChangedReason;
};

const PREFIX = 'koraa_checkin_replan_v1';

function summaryKey(userId: string): string {
  return `${PREFIX}_${userId}_${getLocalDateString()}`;
}

export async function saveCheckInReplanSummary(
  userId: string,
  summary: CheckInReplanSummary,
): Promise<void> {
  try {
    await AsyncStorage.setItem(summaryKey(userId), JSON.stringify(summary));
  } catch {
    /* non-critical */
  }
}

export async function consumeCheckInReplanSummary(
  userId: string,
): Promise<CheckInReplanSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(summaryKey(userId));
    if (!raw) return null;
    await AsyncStorage.removeItem(summaryKey(userId));
    const parsed = JSON.parse(raw) as CheckInReplanSummary;
    if (typeof parsed?.headline !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function peekCheckInReplanSummary(
  userId: string,
): Promise<CheckInReplanSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(summaryKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckInReplanSummary;
    if (typeof parsed?.headline !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}
