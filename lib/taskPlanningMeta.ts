import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VnextEnergyLevel } from '@/lib/vnext/types';

export type TaskPlanningMeta = {
  estimatedMinutes: number;
  energyRequired: VnextEnergyLevel;
  notes: string;
};

const STORAGE_KEY = 'koraa_task_planning_meta_v1';
const DEFAULT_MINUTES = 45;

let cache: Record<string, TaskPlanningMeta> = {};

export function getDefaultPlanningMeta(): TaskPlanningMeta {
  return {
    estimatedMinutes: DEFAULT_MINUTES,
    energyRequired: 'normal',
    notes: '',
  };
}

export function effortToDefaultMinutes(effort?: 'light' | 'medium' | 'heavy'): number {
  if (effort === 'heavy') return 90;
  if (effort === 'light') return 25;
  return DEFAULT_MINUTES;
}

export async function loadTaskPlanningMetaMap(): Promise<Record<string, TaskPlanningMeta>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = {};
      return cache;
    }
    cache = (JSON.parse(raw) as Record<string, TaskPlanningMeta>) ?? {};
    return cache;
  } catch {
    cache = {};
    return cache;
  }
}

export function getTaskPlanningMeta(taskId: string): TaskPlanningMeta {
  return cache[taskId] ?? getDefaultPlanningMeta();
}

export async function setTaskPlanningMeta(
  taskId: string,
  meta: TaskPlanningMeta,
): Promise<void> {
  cache = { ...cache, [taskId]: meta };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* non-critical */
  }
}

export async function removeTaskPlanningMeta(taskId: string): Promise<void> {
  const next = { ...cache };
  delete next[taskId];
  cache = next;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* non-critical */
  }
}

export function formatDurationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, '0')} min`;
}

export function clampEstimatedMinutes(minutes: number): number {
  return Math.max(15, Math.min(8 * 60, Math.round(minutes / 15) * 15));
}

export function stepEstimatedMinutes(current: number, delta: number): number {
  return clampEstimatedMinutes(current + delta);
}
