import { getHoyFocusTasks, isTaskScheduledForToday } from '@/lib/hoyFocusTasks';
import type { Task } from '@/hooks/useTasks';

const TODAY = '2026-06-08';

function task(partial: Partial<Task> & { id: string }): Task {
  return {
    id: partial.id,
    content: partial.content ?? 'Tarea',
    is_completed: partial.is_completed ?? false,
    is_priority: partial.is_priority ?? false,
    category: partial.category ?? '',
    completed_at: partial.completed_at ?? null,
    created_at: partial.created_at ?? '2026-06-08T10:00:00Z',
    parent_task_id: partial.parent_task_id ?? null,
    project_id: partial.project_id ?? null,
    scheduled_date: partial.scheduled_date ?? null,
    subtasks: partial.subtasks,
  };
}

describe('hoyFocusTasks', () => {
  it('isTaskScheduledForToday accepts null or today date', () => {
    expect(isTaskScheduledForToday({ scheduled_date: null }, TODAY)).toBe(true);
    expect(isTaskScheduledForToday({ scheduled_date: TODAY }, TODAY)).toBe(true);
    expect(isTaskScheduledForToday({ scheduled_date: '2026-06-09' }, TODAY)).toBe(false);
  });

  it('returns only incomplete suggested steps (completed ones disappear)', () => {
    const tasks = [
      task({ id: '1', is_priority: true, is_completed: true }),
      task({ id: '2', is_priority: true }),
      task({ id: '3', is_priority: false }),
    ];
    const incomplete = [task({ id: '2', is_priority: true }), task({ id: '3' })];
    const focus = getHoyFocusTasks(tasks, incomplete, TODAY);
    expect(focus.map((t) => t.id)).toEqual(['2']);
  });

  it('returns empty when all suggested steps are done', () => {
    const tasks = [task({ id: '1', is_priority: true, is_completed: true })];
    const focus = getHoyFocusTasks(tasks, [], TODAY);
    expect(focus).toEqual([]);
  });

  it('falls back to up to 5 incomplete today tasks when no priorities', () => {
    const tasks = [
      task({ id: 'a' }),
      task({ id: 'b' }),
      task({ id: 'c' }),
      task({ id: 'd' }),
      task({ id: 'e' }),
      task({ id: 'f' }),
    ];
    const incomplete = tasks;
    const focus = getHoyFocusTasks(tasks, incomplete, TODAY);
    expect(focus.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('scopes suggested and fallback steps to focused project', () => {
    const projectA = 'proj-a';
    const tasks = [
      task({ id: '1', is_priority: true, project_id: projectA }),
      task({ id: '2', is_priority: true, project_id: 'proj-b' }),
      task({ id: '3', project_id: projectA }),
      task({ id: '4', project_id: 'proj-b' }),
    ];
    const incomplete = tasks.filter((row) => !row.is_completed);
    const focus = getHoyFocusTasks(tasks, incomplete, TODAY, projectA);
    expect(focus.map((row) => row.id)).toEqual(['1']);
  });
});
