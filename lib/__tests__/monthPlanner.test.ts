import { buildMonthPlannerModel } from '@/lib/lifeAreas/monthPlanner';
import type { ExperienceTask } from '@/lib/lifeAreas/experienceDataMappers';

function task(overrides: Partial<ExperienceTask> & Pick<ExperienceTask, 'id' | 'content'>): ExperienceTask {
  return {
    project_id: null,
    scheduled_date: null,
    is_completed: false,
    is_priority: false,
    ...overrides,
  };
}

describe('buildMonthPlannerModel', () => {
  it('counts scheduled tasks per day in the anchor month', () => {
    const tasks = [
      task({ id: 'a', content: 'One', scheduled_date: '2026-06-16' }),
      task({ id: 'b', content: 'Two', scheduled_date: '2026-06-16' }),
      task({ id: 'c', content: 'Three', scheduled_date: '2026-06-20' }),
      task({ id: 'd', content: 'Done', scheduled_date: '2026-06-18', is_completed: true }),
    ];

    const model = buildMonthPlannerModel(tasks, '2026-06-16', 'es');
    const flat = model.weeks.flat();

    const june16 = flat.find((cell) => cell.date === '2026-06-16');
    const june20 = flat.find((cell) => cell.date === '2026-06-20');
    const june18 = flat.find((cell) => cell.date === '2026-06-18');

    expect(june16?.taskCount).toBe(2);
    expect(june16?.loadLevel).toBe('light');
    expect(june20?.taskCount).toBe(1);
    expect(june18?.taskCount).toBe(0);
    expect(model.weekdayHeaders).toHaveLength(7);
  });
});
