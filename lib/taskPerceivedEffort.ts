import AsyncStorage from '@react-native-async-storage/async-storage';

export type TaskEffort = 'light' | 'medium' | 'heavy';

const STORAGE_KEY = 'koraa_task_effort_v1';

let cache: Record<string, TaskEffort> = {};

export function getEffortCache(): Record<string, TaskEffort> {
  return cache;
}

export async function loadTaskEffortMap(): Promise<Record<string, TaskEffort>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = {};
      return cache;
    }
    const parsed = JSON.parse(raw) as Record<string, TaskEffort>;
    cache = parsed ?? {};
    return cache;
  } catch {
    cache = {};
    return cache;
  }
}

export async function setTaskEffort(taskId: string, effort: TaskEffort): Promise<void> {
  cache = { ...cache, [taskId]: effort };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* non-critical */
  }
}

export function getPerceivedEffort(taskId: string): TaskEffort | undefined {
  return cache[taskId];
}
