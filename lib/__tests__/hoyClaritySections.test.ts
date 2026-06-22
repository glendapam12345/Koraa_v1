import { buildHoyClaritySections } from '@/lib/hoyClaritySections';
import type { Task } from '@/hooks/useTasks';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    content: `Task ${id}`,
    is_completed: false,
    is_priority: false,
    scheduled_date: null,
    project_id: null,
    parent_task_id: null,
    user_id: 'u1',
    category: 'otros',
    created_at: '',
    ...overrides,
  } as Task;
}

describe('buildHoyClaritySections', () => {
  it('shows only focus tasks in importantToday (max 5)', () => {
    const tasks = [
      task('a', { is_priority: true }),
      task('b'),
      task('c'),
      task('d'),
      task('e'),
      task('f'),
      task('g'),
    ];
    const focusIds = new Set(['a', 'b', 'c', 'd', 'e', 'f']);
    const sections = buildHoyClaritySections(tasks, focusIds);

    expect(sections.importantToday.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(sections.restCount).toBe(2);
    expect(sections.couldAdvance).toEqual([]);
    expect(sections.canWait).toEqual([]);
  });

  it('does not treat unscheduled tasks as important without focus', () => {
    const tasks = [task('a'), task('b'), task('c')];
    const sections = buildHoyClaritySections(tasks, new Set());

    expect(sections.importantToday).toEqual([]);
    expect(sections.restCount).toBe(3);
  });
});
