import {
  getHoyFocusTasks,
  getHoyPriorityPlanTasks,
  getHoyWaitingPlanTasks,
  isTaskExplicitlyForToday,
  isTaskScheduledForToday,
  isTaskSuggestedForToday,
  isTaskWaitingForToday,
} from '@/lib/hoyFocusTasks';
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

  it('isTaskExplicitlyForToday requires today date', () => {
    expect(isTaskExplicitlyForToday({ scheduled_date: TODAY }, TODAY)).toBe(true);
    expect(isTaskExplicitlyForToday({ scheduled_date: null }, TODAY)).toBe(false);
  });

  it('waiting tasks are only non-priority with today date', () => {
    expect(
      isTaskWaitingForToday(
        { scheduled_date: TODAY, is_priority: false, is_completed: false },
        TODAY,
      ),
    ).toBe(true);
    expect(
      isTaskWaitingForToday(
        { scheduled_date: null, is_priority: false, is_completed: false },
        TODAY,
      ),
    ).toBe(false);
    expect(
      isTaskWaitingForToday(
        { scheduled_date: TODAY, is_priority: true, is_completed: false },
        TODAY,
      ),
    ).toBe(false);
  });

  it('suggested tasks are priority for today or undated priority', () => {
    expect(isTaskSuggestedForToday({ scheduled_date: TODAY, is_priority: true }, TODAY)).toBe(
      true,
    );
    expect(isTaskSuggestedForToday({ scheduled_date: null, is_priority: true }, TODAY)).toBe(true);
    expect(isTaskSuggestedForToday({ scheduled_date: null, is_priority: false }, TODAY)).toBe(
      false,
    );
  });

  it('getHoyPriorityPlanTasks excludes backlog and completed', () => {
    const tasks = [
      task({ id: '1', is_priority: true, scheduled_date: TODAY }),
      task({ id: '2', is_priority: true, is_completed: true, scheduled_date: TODAY }),
      task({ id: '3', is_priority: false, scheduled_date: TODAY }),
      task({ id: '4', is_priority: false, scheduled_date: null }),
    ];
    expect(getHoyPriorityPlanTasks(tasks, TODAY).map((row) => row.id)).toEqual(['1']);
  });

  it('getHoyWaitingPlanTasks only returns dated today non-priority open', () => {
    const tasks = [
      task({ id: 'w1', scheduled_date: TODAY }),
      task({ id: 'w2', scheduled_date: null }),
      task({ id: 'w3', scheduled_date: TODAY, is_priority: true }),
      task({ id: 'w4', scheduled_date: '2026-06-09' }),
    ];
    expect(getHoyWaitingPlanTasks(tasks, TODAY).map((row) => row.id)).toEqual(['w1']);
  });

  it('returns only incomplete suggested steps', () => {
    const tasks = [
      task({ id: '1', is_priority: true, is_completed: true, scheduled_date: TODAY }),
      task({ id: '2', is_priority: true, scheduled_date: TODAY }),
      task({ id: '3', is_priority: false, scheduled_date: TODAY }),
    ];
    const incomplete = [task({ id: '2', is_priority: true }), task({ id: '3' })];
    const focus = getHoyFocusTasks(tasks, incomplete, TODAY);
    expect(focus.map((t) => t.id)).toEqual(['2']);
  });

  it('returns empty when all suggested steps are done', () => {
    const tasks = [task({ id: '1', is_priority: true, is_completed: true, scheduled_date: TODAY })];
    const focus = getHoyFocusTasks(tasks, [], TODAY);
    expect(focus).toEqual([]);
  });

  it('scopes suggested steps to focused project', () => {
    const projectA = 'proj-a';
    const tasks = [
      task({ id: '1', is_priority: true, project_id: projectA, scheduled_date: TODAY }),
      task({ id: '2', is_priority: true, project_id: 'proj-b', scheduled_date: TODAY }),
    ];
    const incomplete = tasks.filter((row) => !row.is_completed);
    const focus = getHoyFocusTasks(tasks, incomplete, TODAY, projectA);
    expect(focus.map((row) => row.id)).toEqual(['1']);
  });
});
