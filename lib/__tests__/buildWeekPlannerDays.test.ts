import { buildWeekPlannerDays, type ExperienceTask } from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';

const areaIndex = buildLifeAreaIndex([], 'Sueltas');

function task(partial: Partial<ExperienceTask> & Pick<ExperienceTask, 'id' | 'content'>): ExperienceTask {
  return {
    project_id: null,
    scheduled_date: '2026-08-19',
    is_completed: false,
    is_priority: false,
    ...partial,
  };
}

describe('buildWeekPlannerDays', () => {
  it('hides completed steps by default', () => {
    const days = buildWeekPlannerDays(
      [
        task({ id: 'open', content: 'Comprar uvas' }),
        task({ id: 'done', content: 'Hecho', is_completed: true }),
      ],
      ['2026-08-19'],
      '2026-08-21',
      areaIndex,
      'es',
    );

    expect(days[0]?.tasks.map((entry) => entry.id)).toEqual(['open']);
  });

  it('keeps completed steps visible on the calendar so the check can fill', () => {
    const days = buildWeekPlannerDays(
      [
        task({ id: 'open', content: 'Comprar uvas' }),
        task({ id: 'done', content: 'Hecho', is_completed: true }),
      ],
      ['2026-08-19'],
      '2026-08-21',
      areaIndex,
      'es',
      undefined,
      { includeCompleted: true },
    );

    expect(days[0]?.tasks.map((entry) => entry.id)).toEqual(['open', 'done']);
    expect(days[0]?.tasks[1]?.status).toBe('done');
  });
});
