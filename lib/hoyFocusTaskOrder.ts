import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '@/hooks/useTasks';
import { getLocalDateString } from '@/lib/dateLocal';

const storageKey = (date: string) => `koraa_hoy_plan_order_${date}`;

export async function loadHoyPlanOrder(date: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(date));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveHoyPlanOrder(date: string, ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(date), JSON.stringify(ids));
  } catch {
    /* non-critical */
  }
}

/** Quita ids borrados del orden guardado (evita fantasmas en el tablero). */
export async function removeTaskFromHoyPlanOrders(
  taskId: string,
  today: string = getLocalDateString(),
): Promise<void> {
  for (const orderKey of [`${today}:priority`, `${today}:waiting`] as const) {
    const stored = await loadHoyPlanOrder(orderKey);
    if (!stored.includes(taskId)) continue;
    await saveHoyPlanOrder(orderKey, stored.filter((id) => id !== taskId));
  }
}

export function ensureOrderForTasks(currentOrder: string[], tasks: Task[]): string[] {
  const ids = tasks.map((task) => task.id);
  const filtered = currentOrder.filter((id) => ids.includes(id));
  const missing = ids.filter((id) => !filtered.includes(id));
  return [...filtered, ...missing];
}

export function applyHoyPlanOrder(tasks: Task[], order: string[]): Task[] {
  if (order.length === 0) return tasks;
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const ordered: Task[] = [];
  for (const id of order) {
    const task = byId.get(id);
    if (task) {
      ordered.push(task);
      byId.delete(id);
    }
  }
  for (const task of tasks) {
    if (byId.has(task.id)) ordered.push(task);
  }
  return ordered;
}

export function swapInOrder(
  order: string[],
  taskId: string,
  direction: 'up' | 'down',
): string[] | null {
  const idx = order.indexOf(taskId);
  if (idx < 0) return null;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= order.length) return null;
  const next = [...order];
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
  return next;
}

/** Reinsert task at target index within the same ordered list. */
export function moveInOrder(order: string[], taskId: string, toIndex: number): string[] {
  const fromIdx = order.indexOf(taskId);
  if (fromIdx < 0) return order;
  const clamped = Math.max(0, Math.min(toIndex, order.length - 1));
  const next = order.filter((id) => id !== taskId);
  next.splice(clamped, 0, taskId);
  return next;
}
