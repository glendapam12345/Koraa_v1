import {
  countPriorityCompletedBefore,
  getTodayPriorityStats,
  isPriorityCompletedToday,
} from '@/lib/priorityProgress';
import type { Task } from '@/hooks/useTasks';

const TODAY = '2026-05-19';

function task(partial: Partial<Task> & { id: string }): Task {
  return {
    id: partial.id,
    content: partial.content ?? 'Tarea',
    is_completed: partial.is_completed ?? false,
    is_priority: partial.is_priority ?? false,
    category: partial.category ?? 'otros',
    completed_at: partial.completed_at ?? null,
    created_at: partial.created_at ?? '2026-05-19T10:00:00.000Z',
    parent_task_id: partial.parent_task_id ?? null,
  };
}

describe('priorityProgress', () => {
  it('isPriorityCompletedToday requires priority, completed, and today date', () => {
    expect(
      isPriorityCompletedToday(
        task({
          id: '1',
          is_priority: true,
          is_completed: true,
          completed_at: `${TODAY}T12:00:00.000Z`,
        }),
        TODAY,
      ),
    ).toBe(true);
    expect(
      isPriorityCompletedToday(
        task({ id: '2', is_priority: true, is_completed: false }),
        TODAY,
      ),
    ).toBe(false);
  });

  it('getTodayPriorityStats counts focus tasks done today', () => {
    const tasks = [
      task({
        id: 'a',
        is_priority: true,
        is_completed: true,
        completed_at: `${TODAY}T09:00:00.000Z`,
      }),
      task({ id: 'b', is_priority: true, is_completed: false }),
      task({ id: 'c', is_priority: false, is_completed: true }),
      task({
        id: 'd',
        is_priority: true,
        is_completed: true,
        completed_at: '2026-05-18T09:00:00.000Z',
        parent_task_id: 'parent',
      }),
    ];
    const stats = getTodayPriorityStats(tasks, TODAY);
    expect(stats).toEqual({ done: 1, total: 2, pending: 1, ratio: 0.5 });
  });

  it('countPriorityCompletedBefore excludes given task id', () => {
    const tasks = [
      task({
        id: 'x',
        is_priority: true,
        is_completed: true,
        completed_at: `${TODAY}T08:00:00.000Z`,
      }),
      task({
        id: 'y',
        is_priority: true,
        is_completed: true,
        completed_at: `${TODAY}T09:00:00.000Z`,
      }),
    ];
    expect(countPriorityCompletedBefore(tasks, 'y', TODAY)).toBe(1);
  });
});
