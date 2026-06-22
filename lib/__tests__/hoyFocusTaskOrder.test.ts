import type { Task } from '@/hooks/useTasks';
import {
  applyHoyPlanOrder,
  ensureOrderForTasks,
  swapInOrder,
} from '@/lib/hoyFocusTaskOrder';

function task(id: string): Task {
  return {
    id,
    content: id.toUpperCase(),
    is_completed: false,
    is_priority: true,
    category: '',
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    parent_task_id: null,
  };
}

describe('hoyFocusTaskOrder', () => {
  const tasks = [task('a'), task('b'), task('c')];

  it('applies stored order and appends new tasks', () => {
    const ordered = applyHoyPlanOrder(
      [...tasks],
      ['c', 'a'],
    );
    expect(ordered.map((task) => task.id)).toEqual(['c', 'a', 'b']);
  });

  it('keeps missing ids when order is empty', () => {
    expect(applyHoyPlanOrder([...tasks], []).map((task) => task.id)).toEqual(['a', 'b', 'c']);
  });

  it('merges new task ids into saved order', () => {
    expect(ensureOrderForTasks(['a'], [...tasks]).map((id) => id)).toEqual(['a', 'b', 'c']);
  });

  it('swaps adjacent ids', () => {
    expect(swapInOrder(['a', 'b', 'c'], 'b', 'up')).toEqual(['b', 'a', 'c']);
    expect(swapInOrder(['a', 'b', 'c'], 'b', 'down')).toEqual(['a', 'c', 'b']);
    expect(swapInOrder(['a', 'b', 'c'], 'a', 'up')).toBeNull();
  });
});
