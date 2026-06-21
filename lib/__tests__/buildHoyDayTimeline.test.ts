import type { Task } from '@/components/tasks/TaskCard';
import { buildHoyDayTimeline, pickHoyTimelineTasks } from '@/lib/vnext/buildHoyDayTimeline';

function task(
  id: string,
  content: string,
  opts: Partial<Task> = {},
): Task {
  return {
    id,
    content,
    is_completed: false,
    is_priority: false,
    category: 'otros',
    completed_at: null,
    created_at: '2026-06-16T10:00:00Z',
    parent_task_id: null,
    ...opts,
  };
}

describe('buildHoyDayTimeline', () => {
  it('builds a timeline from focus tasks first', () => {
    const incomplete = [
      task('a', 'Grabar reel', { is_priority: true }),
      task('b', 'Llamar proveedor'),
      task('c', 'Editar app', { is_priority: true }),
    ];
    const focus = incomplete.filter((entry) => entry.is_priority);
    const picked = pickHoyTimelineTasks(incomplete, focus);

    expect(picked.map((entry) => entry.id)).toEqual(['a', 'c', 'b']);

    const result = buildHoyDayTimeline(picked, [], 'es', 'Sueltas', {
      focusLabel: 'Contenido',
      availableTime: 'Medio (2-4hrs)',
    });

    expect(result).not.toBeNull();
    expect(result?.taskCount).toBe(3);
    expect(result?.model.blocks).toHaveLength(3);
    expect(result?.focusLabel).toBe('Contenido');
    expect(result?.availableHoursLabel).toBe('3 h');
  });

  it('returns null when there are no tasks', () => {
    expect(buildHoyDayTimeline([], [], 'es', 'Sueltas')).toBeNull();
  });
});
