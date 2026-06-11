import AsyncStorage from '@react-native-async-storage/async-storage';

export const STREAK_GOAL_OPTIONS = [7, 30, 90, 180] as const;

export type StreakGoalDays = (typeof STREAK_GOAL_OPTIONS)[number];

export const DEFAULT_STREAK_GOAL_DAYS: StreakGoalDays = 7;

const STORAGE_PREFIX = 'koraa.streakGoalDays';

function storageKey(userId?: string): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

function isStreakGoalDays(value: number): value is StreakGoalDays {
  return (STREAK_GOAL_OPTIONS as readonly number[]).includes(value);
}

export async function getStreakGoalDays(userId?: string): Promise<StreakGoalDays> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_STREAK_GOAL_DAYS;
    const parsed = Number.parseInt(raw, 10);
    return isStreakGoalDays(parsed) ? parsed : DEFAULT_STREAK_GOAL_DAYS;
  } catch {
    return DEFAULT_STREAK_GOAL_DAYS;
  }
}

export async function setStreakGoalDays(days: StreakGoalDays, userId?: string): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), String(days));
}
