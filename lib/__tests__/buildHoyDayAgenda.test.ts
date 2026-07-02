import type { Task } from '@/components/tasks/TaskCard';
import { buildHoyDayAgenda } from '@/lib/hoy/buildHoyDayAgenda';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';

function task(id: string, content: string): Task {
  return {
    id,
    content,
    is_completed: false,
    is_priority: false,
    category: 'otros',
    completed_at: null,
    created_at: '2026-06-16T10:00:00Z',
    parent_task_id: null,
  };
}

describe('buildHoyDayAgenda', () => {
  it('returns timed tasks sorted by preferred time', () => {
    const planningMeta: Record<string, TaskPlanningMeta> = {
      a: { energyRequired: 'normal', notes: '', preferredTime: '15:00', estimatedMinutes: 30 },
      b: { energyRequired: 'normal', notes: '', preferredTime: '09:30', estimatedMinutes: 25 },
    };

    const result = buildHoyDayAgenda(
      [task('a', 'Tarde'), task('b', 'Mañana')],
      planningMeta,
      {},
      'es',
    );

    expect(result.timed.map((item) => item.taskId)).toEqual(['b', 'a']);
    expect(result.timed[0]?.durationLabel).toBe('25 min');
    expect(result.timedTaskIds.has('a')).toBe(true);
  });

  it('skips tasks without preferred time or completed tasks', () => {
    const planningMeta: Record<string, TaskPlanningMeta> = {
      a: { energyRequired: 'normal', notes: '', preferredTime: '10:00' },
    };

    const result = buildHoyDayAgenda(
      [task('a', 'Con hora'), { ...task('b', 'Sin hora'), id: 'b' }, { ...task('c', 'Hecha'), id: 'c', is_completed: true }],
      planningMeta,
      {},
      'es',
    );

    expect(result.timed).toHaveLength(1);
    expect(result.timed[0]?.taskId).toBe('a');
  });
});
