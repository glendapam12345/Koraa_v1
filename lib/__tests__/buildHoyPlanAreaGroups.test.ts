import { buildHoyPlanAreaGroups, resolveHoyTaskAreaRef } from '@/lib/hoy/buildHoyPlanAreaGroups';
import { EMPTY_USER_LIFE_AREAS } from '@/lib/lifeAreas/userLifeAreas';
import type { Task } from '@/components/tasks/TaskCard';

const baseTask = (partial: Partial<Task>): Task => ({
  id: partial.id ?? 't1',
  content: partial.content ?? 'Paso',
  is_completed: false,
  is_priority: partial.is_priority ?? false,
  category: 'otros',
  completed_at: null,
  created_at: '2026-06-22T00:00:00Z',
  parent_task_id: null,
  project_id: partial.project_id ?? null,
  scheduled_date: partial.scheduled_date ?? '2026-06-22',
  life_area_key: partial.life_area_key ?? null,
  subtasks: [],
});

describe('resolveHoyTaskAreaRef', () => {
  it('uses project life area when task belongs to a project', () => {
    const ref = resolveHoyTaskAreaRef(
      baseTask({ project_id: 'p1', life_area_key: 'health' }),
      { p1: { name: 'App', life_area_key: 'creative' } },
    );
    expect(ref).toBe('creative');
  });

  it('uses loose task life area when no project', () => {
    const ref = resolveHoyTaskAreaRef(baseTask({ life_area_key: 'work' }), {});
    expect(ref).toBe('work');
  });
});

describe('buildHoyPlanAreaGroups', () => {
  const label = (key: string) => key;

  it('returns only areas that have tasks', () => {
    const groups = buildHoyPlanAreaGroups(
      [
        baseTask({ id: 'a', life_area_key: 'creative' }),
        baseTask({ id: 'b', life_area_key: 'work' }),
      ],
      {},
      EMPTY_USER_LIFE_AREAS,
      label,
    );

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.area.ref)).toEqual(['work', 'creative']);
    expect(groups.every((group) => group.tasks.length > 0)).toBe(true);
  });

  it('skips empty buckets', () => {
    const groups = buildHoyPlanAreaGroups([], {}, EMPTY_USER_LIFE_AREAS, label);
    expect(groups).toHaveLength(0);
  });
});
