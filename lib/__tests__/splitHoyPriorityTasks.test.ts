import {
  isHoyTimeSensitiveTask,
  splitHoyPriorityTasks,
} from '@/lib/hoy/splitHoyPriorityTasks';

const today = '2026-06-22';

describe('isHoyTimeSensitiveTask', () => {
  it('is sensitive when scheduled for today', () => {
    expect(
      isHoyTimeSensitiveTask({ scheduled_date: today, project_id: null }, undefined, today),
    ).toBe(true);
  });

  it('is sensitive when overdue', () => {
    expect(
      isHoyTimeSensitiveTask(
        { scheduled_date: '2026-06-20', project_id: null },
        undefined,
        today,
      ),
    ).toBe(true);
  });

  it('is sensitive when project is due today', () => {
    expect(
      isHoyTimeSensitiveTask(
        { scheduled_date: null, project_id: 'p1' },
        { name: 'Proyecto', due_date: today },
        today,
      ),
    ).toBe(true);
  });

  it('is flexible when undated and project due later', () => {
    expect(
      isHoyTimeSensitiveTask(
        { scheduled_date: null, project_id: 'p1' },
        { name: 'Proyecto', due_date: '2026-06-30' },
        today,
      ),
    ).toBe(false);
  });
});

describe('splitHoyPriorityTasks', () => {
  it('keeps order and splits pinned vs flexible', () => {
    const tasks = [
      { id: 'a', scheduled_date: null, project_id: null, is_priority: true },
      { id: 'b', scheduled_date: today, project_id: null, is_priority: true },
      { id: 'c', scheduled_date: null, project_id: null, is_priority: true },
    ] as never[];

    const result = splitHoyPriorityTasks(tasks, {}, today);

    expect(result.pinned.map((task) => task.id)).toEqual(['b']);
    expect(result.flexible.map((task) => task.id)).toEqual(['a', 'c']);
    expect(result.useOneThingFraming).toBe(true);
  });

  it('uses due-today framing when more than one pinned', () => {
    const tasks = [
      { id: 'a', scheduled_date: today, project_id: null },
      { id: 'b', scheduled_date: today, project_id: null },
    ] as never[];

    const result = splitHoyPriorityTasks(tasks, {}, today);

    expect(result.pinned).toHaveLength(2);
    expect(result.useOneThingFraming).toBe(false);
  });
});
