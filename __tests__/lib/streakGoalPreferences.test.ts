import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_STREAK_GOAL_DAYS,
  getStreakGoalDays,
  setStreakGoalDays,
  STREAK_GOAL_OPTIONS,
} from '@/lib/streakGoalPreferences';
import { getStreakGoalProgress } from '@/lib/streakLevel';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

describe('streakGoalPreferences', () => {
  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
  });

  it('returns default when nothing stored', async () => {
    getItem.mockResolvedValue(null);
    await expect(getStreakGoalDays('user-1')).resolves.toBe(DEFAULT_STREAK_GOAL_DAYS);
  });

  it('persists valid goal per user', async () => {
    await setStreakGoalDays(90, 'user-1');
    expect(setItem).toHaveBeenCalledWith('koraa.streakGoalDays:user-1', '90');
  });

  it('ignores invalid stored values', async () => {
    getItem.mockResolvedValue('14');
    await expect(getStreakGoalDays()).resolves.toBe(7);
  });

  it('accepts all goal options', () => {
    expect(STREAK_GOAL_OPTIONS).toEqual([7, 30, 90, 180]);
  });
});

describe('getStreakGoalProgress', () => {
  it('returns 0 for empty streak', () => {
    expect(getStreakGoalProgress(0, 7)).toBe(0);
  });

  it('caps at 1 when goal is reached', () => {
    expect(getStreakGoalProgress(45, 30)).toBe(1);
  });

  it('returns partial progress', () => {
    expect(getStreakGoalProgress(3, 7)).toBeCloseTo(3 / 7);
  });
});
