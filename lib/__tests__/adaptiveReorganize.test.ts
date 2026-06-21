import { buildAdaptiveReorganizePlan } from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import type { ExperienceTask } from '@/lib/lifeAreas/experienceDataMappers';

const TODAY = '2026-06-16';
const TOMORROW = '2026-06-17';

function makeAreaIndex() {
  return buildLifeAreaIndex(
    [{ id: 'p1', name: 'Trabajo', color: '#7EB3F0' }],
    'Sin proyecto',
  );
}

function task(overrides: Partial<ExperienceTask> & Pick<ExperienceTask, 'id' | 'content'>): ExperienceTask {
  return {
    project_id: null,
    scheduled_date: null,
    is_completed: false,
    is_priority: false,
    ...overrides,
  };
}

describe('buildAdaptiveReorganizePlan', () => {
  const areaIndex = makeAreaIndex();

  it('moves non-priority today tasks to tomorrow for new_event', () => {
    const tasks = [
      task({ id: 'a', content: 'Star', scheduled_date: TODAY, is_priority: true }),
      task({ id: 'b', content: 'Movable', scheduled_date: TODAY }),
    ];

    const plan = buildAdaptiveReorganizePlan(tasks, areaIndex, 'new_event', 'es', TODAY);

    expect(plan.assignments).toEqual(
      expect.arrayContaining([{ id: 'b', scheduled_date: TOMORROW }]),
    );
    expect(plan.assignments.find((entry) => entry.id === 'a')).toBeUndefined();
    expect(plan.proposal.moved.some((item) => item.taskId === 'b')).toBe(true);
    expect(plan.proposal.kept.some((item) => item.taskId === 'a')).toBe(true);
  });

  it('spreads workload for less_time', () => {
    const tasks = [
      task({ id: 'a', content: 'One', scheduled_date: TODAY }),
      task({ id: 'b', content: 'Two', scheduled_date: TODAY }),
      task({ id: 'c', content: 'Three', scheduled_date: TODAY }),
      task({ id: 'd', content: 'Four', scheduled_date: TODAY }),
    ];

    const plan = buildAdaptiveReorganizePlan(tasks, areaIndex, 'less_time', 'es', TODAY);

    expect(plan.assignments.length).toBeGreaterThan(0);
    const targetDates = new Set(plan.assignments.map((entry) => entry.scheduled_date));
    expect(targetDates.size).toBeGreaterThan(1);
  });

  it('pulls priority tasks to today for priorities_changed', () => {
    const tasks = [
      task({ id: 'a', content: 'Priority', scheduled_date: TOMORROW, is_priority: true }),
      task({ id: 'b', content: 'Today low', scheduled_date: TODAY }),
    ];

    const plan = buildAdaptiveReorganizePlan(tasks, areaIndex, 'priorities_changed', 'es', TODAY);

    expect(plan.assignments).toEqual(
      expect.arrayContaining([{ id: 'a', scheduled_date: TODAY }]),
    );
  });
});
