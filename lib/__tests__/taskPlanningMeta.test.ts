import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clampEstimatedMinutes,
  formatDurationLabel,
  loadTaskPlanningMetaMap,
  resetTaskPlanningMetaCache,
  setTaskPlanningMeta,
  stepEstimatedMinutes,
} from '@/lib/taskPlanningMeta';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

describe('taskPlanningMeta duration helpers', () => {
  it('formats hours and minutes', () => {
    expect(formatDurationLabel(45)).toBe('45 min');
    expect(formatDurationLabel(90)).toBe('1 h 30 min');
  });

  it('steps in 5 minute increments within bounds', () => {
    expect(stepEstimatedMinutes(45, 5)).toBe(50);
    expect(stepEstimatedMinutes(10, -5)).toBe(5);
    expect(stepEstimatedMinutes(5, -5)).toBe(5);
    expect(clampEstimatedMinutes(1000)).toBe(480);
    expect(clampEstimatedMinutes(23)).toBe(25);
  });
});

describe('taskPlanningMeta cache', () => {
  beforeEach(() => {
    resetTaskPlanningMetaCache();
    getItem.mockReset();
    setItem.mockReset();
  });

  it('reads storage once and reuses memory on later loads', async () => {
    getItem.mockResolvedValue(JSON.stringify({ 'task-1': { energyRequired: 'low', notes: '' } }));

    const first = await loadTaskPlanningMetaMap();
    const second = await loadTaskPlanningMetaMap();

    expect(first['task-1']?.energyRequired).toBe('low');
    expect(second).toBe(first);
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it('keeps writes in memory without forcing another storage read', async () => {
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue(undefined);

    await loadTaskPlanningMetaMap();
    await setTaskPlanningMeta('task-2', {
      estimatedMinutes: 25,
      energyRequired: 'normal',
      notes: '',
    });

    const map = await loadTaskPlanningMetaMap();
    expect(map['task-2']?.estimatedMinutes).toBe(25);
    expect(getItem).toHaveBeenCalledTimes(1);
  });
});
