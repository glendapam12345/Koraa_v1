import { buildHoyAttentionPlan } from '@/lib/hoyAttentionPlan';
import type { Task } from '@/hooks/useTasks';

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
    category: 'trabajo',
    completed_at: null,
    created_at: new Date().toISOString(),
    parent_task_id: null,
    ...opts,
  };
}

describe('hoyAttentionPlan', () => {
  const checkInLowEnergy = {
    emotion: 'triste',
    energyLevel: 3,
    availableTime: 'Poco (1-2hrs)',
    focusLevel: 'Algo distraída',
  };

  it('recommends one scoped step from the urgent project front', () => {
    const plan = buildHoyAttentionPlan(
      [
        task('1', 'Terminar presentación de la app', {
          project_id: 'p-koraa',
          perceivedEffort: 'heavy',
          is_priority: true,
        }),
        task('2', 'Terminar última versión de la app', { project_id: 'p-koraa' }),
        task('3', 'Crear un reel', { perceivedEffort: 'medium' }),
        task('4', 'Comprar boletos para el cine'),
      ],
      [{ id: 'p-koraa', name: 'Koraa App', due_date: '2026-06-22' }],
      checkInLowEnergy,
    );

    expect(plan).not.toBeNull();
    expect(plan?.projectName).toBe('Koraa App');
    expect(plan?.focusTasks.length).toBeGreaterThanOrEqual(1);
    expect(plan?.focusTask.minutes).toBeLessThanOrEqual(30);
    expect(plan?.activeFrontCount).toBeGreaterThanOrEqual(2);
    expect(plan?.parkedCount).toBeGreaterThan(0);
  });

  it('offers quick errands as other options', () => {
    const plan = buildHoyAttentionPlan(
      [
        task('1', 'Preparar pitch YC', { perceivedEffort: 'heavy', is_priority: true }),
        task('2', 'Cobrar', { perceivedEffort: 'light' }),
        task('3', 'Comprar boletos para el cine', { perceivedEffort: 'light' }),
      ],
      [],
      checkInLowEnergy,
    );

    expect(plan?.otherOptions.length).toBeGreaterThanOrEqual(1);
    expect(plan?.otherOptions[0].minutes).toBeLessThanOrEqual(25);
  });
});
