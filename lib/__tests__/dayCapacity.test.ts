import {
  buildDayCapacitySnapshot,
  resolveTaskPlannedMinutes,
} from '@/lib/hoy/dayCapacity';
import type { Task } from '@/components/tasks/TaskCard';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    content: 'Revisar borrador',
    is_completed: false,
    is_priority: true,
    category: 'Trabajo',
    completed_at: null,
    created_at: '2026-06-22T10:00:00Z',
    parent_task_id: null,
    ...overrides,
  };
}

describe('dayCapacity', () => {
  it('sums planned minutes from planning meta', () => {
    const tasks = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
    const planningMeta: Record<string, TaskPlanningMeta> = {
      a: { estimatedMinutes: 30, energyRequired: 'normal', notes: '' },
      b: { estimatedMinutes: 60, energyRequired: 'normal', notes: '' },
    };

    const snapshot = buildDayCapacitySnapshot({
      planTasks: tasks,
      planningMeta,
      availableTime: 'Medio (2-4hrs)',
      energyLevel: 3,
    });

    expect(snapshot.plannedMinutes).toBe(90);
    expect(snapshot.availableMinutes).toBe(180);
    expect(snapshot.stepCount).toBe(2);
    expect(snapshot.isOverloaded).toBe(false);
    expect(snapshot.loadRatio).toBeCloseTo(0.5);
  });

  it('flags overload when plan exceeds available time', () => {
    const tasks = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
    const planningMeta: Record<string, TaskPlanningMeta> = {
      a: { estimatedMinutes: 120, energyRequired: 'normal', notes: '' },
      b: { estimatedMinutes: 90, energyRequired: 'normal', notes: '' },
    };

    const snapshot = buildDayCapacitySnapshot({
      planTasks: tasks,
      planningMeta,
      availableTime: 'Poco (1-2hrs)',
    });

    expect(snapshot.availableMinutes).toBe(90);
    expect(snapshot.plannedMinutes).toBe(210);
    expect(snapshot.isOverloaded).toBe(true);
  });

  it('ignores completed and subtasks in step count', () => {
    const tasks = [
      makeTask({ id: 'a' }),
      makeTask({ id: 'b', is_completed: true }),
      makeTask({ id: 'c', parent_task_id: 'a' }),
    ];

    const snapshot = buildDayCapacitySnapshot({
      planTasks: tasks,
      planningMeta: {},
      availableTime: 'Medio (2-4hrs)',
    });

    expect(snapshot.stepCount).toBe(1);
  });

  it('prefers stored estimated minutes over heuristic', () => {
    const task = makeTask({ content: 'Llamada rápida' });
    const minutes = resolveTaskPlannedMinutes(task, {
      [task.id]: { estimatedMinutes: 20, energyRequired: 'low', notes: '' },
    });

    expect(minutes).toBe(20);
  });
});
