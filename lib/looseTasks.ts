import { getLocalDateString } from '@/lib/dateLocal';

export type LooseTaskSortFilter = 'all' | 'recent' | 'oldest' | 'forgotten';

export type LooseTaskSummary = {
  id: string;
  content: string;
  created_at: string;
  scheduled_date?: string | null;
  life_area_key?: string | null;
  is_completed: boolean;
  is_priority?: boolean;
};

const RECENT_DAYS = 7;
const FORGOTTEN_DAYS = 14;

function daysSince(iso: string): number {
  const created = new Date(iso);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / 86_400_000);
}

export function isLooseTaskSortFilter(value: string | undefined): value is LooseTaskSortFilter {
  return value === 'all' || value === 'recent' || value === 'oldest' || value === 'forgotten';
}

export function filterLooseTasks(
  tasks: LooseTaskSummary[],
  filter: LooseTaskSortFilter,
  options?: { areaRef?: string | null; includeCompleted?: boolean },
): LooseTaskSummary[] {
  let list = options?.includeCompleted ? [...tasks] : tasks.filter((task) => !task.is_completed);

  if (options?.areaRef) {
    list = list.filter((task) => (task.life_area_key ?? null) === options.areaRef);
  }

  if (filter === 'recent') {
    list = list.filter((task) => daysSince(task.created_at) <= RECENT_DAYS);
    return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  if (filter === 'oldest') {
    return [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  if (filter === 'forgotten') {
    const today = getLocalDateString();
    list = list.filter((task) => {
      const age = daysSince(task.created_at);
      if (age < FORGOTTEN_DAYS) return false;
      if (!task.scheduled_date) return true;
      return task.scheduled_date < today;
    });
    return [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function groupLooseTasksByArea(
  tasks: LooseTaskSummary[],
): Map<string | null, LooseTaskSummary[]> {
  const map = new Map<string | null, LooseTaskSummary[]>();
  for (const task of tasks) {
    if (task.is_completed) continue;
    const key = task.life_area_key ?? null;
    const bucket = map.get(key) ?? [];
    bucket.push(task);
    map.set(key, bucket);
  }
  return map;
}
