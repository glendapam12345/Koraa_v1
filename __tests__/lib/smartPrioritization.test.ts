import {
  computePrioritizationPlan,
  getTaskPriorityInsight,
  prioritizeTasksIntelligently,
  type Task,
} from '@/lib/smartPrioritization';

function task(id: string, content: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    content,
    category: 'personal',
    is_completed: false,
    parent_task_id: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const baseCheckIn = {
  energyLevel: 4,
  emotion: 'motivada',
  availableTime: 'Bastante (4-6hrs)',
  focusLevel: 'Enfocada',
};

describe('computePrioritizationPlan (Sentir → focos en Hoy)', () => {
  it('limits to 2 priority tasks when energy is low and emotion is negative', () => {
    const tasks = [
      task('1', 'Llamar al banco'),
      task('2', 'Enviar correo'),
      task('3', 'Revisar informe'),
      task('4', 'Organizar escritorio'),
      task('5', 'Pagar factura'),
    ];
    const plan = computePrioritizationPlan(tasks, {
      energyLevel: 1,
      emotion: 'agotada',
      availableTime: 'Poco (1-2hrs)',
      focusLevel: 'Muy distraída',
    });
    expect(plan).not.toBeNull();
    expect(plan!.maxPriorityTasks).toBe(2);
    expect(plan!.prioritizedTasks).toHaveLength(2);
  });

  it('excludes completed tasks and subtasks from prioritization', () => {
    const tasks = [
      task('main-1', 'Tarea principal'),
      task('sub-1', 'Paso hijo', { parent_task_id: 'main-1' }),
      task('done', 'Ya hecha', { is_completed: true }),
    ];
    const plan = computePrioritizationPlan(tasks, baseCheckIn);
    expect(plan?.prioritizedTasks).toHaveLength(1);
    expect(plan?.prioritizedIds.has('main-1')).toBe(true);
    expect(plan?.prioritizedIds.has('sub-1')).toBe(false);
  });

  it('returns null when there are no eligible main tasks', () => {
    expect(computePrioritizationPlan([], baseCheckIn)).toBeNull();
    expect(
      computePrioritizationPlan([task('x', 'done', { is_completed: true })], baseCheckIn),
    ).toBeNull();
  });
});

describe('prioritizeTasksIntelligently', () => {
  it('returns up to 5 tasks when energy is high', () => {
    const tasks = Array.from({ length: 8 }, (_, i) => task(`t${i}`, `Tarea ${i}`));
    const result = prioritizeTasksIntelligently(tasks, {
      ...baseCheckIn,
      energyLevel: 5,
      availableTime: 'Todo el día',
    });
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe('getTaskPriorityInsight', () => {
  it('explains why a prioritized task ranks high', () => {
    const tasks = [task('1', 'Llamar para confirmar cita', { created_at: new Date().toISOString() })];
    const plan = computePrioritizationPlan(tasks, {
      energyLevel: 2,
      emotion: 'agotada',
      availableTime: 'Poco (1-2hrs)',
      focusLevel: 'Muy distraída',
    });
    const insight = getTaskPriorityInsight('1', plan, 'es');
    expect(plan?.prioritizedIds.has('1')).toBe(true);
    expect(insight.whyUp.length + insight.whyDown.length).toBeGreaterThanOrEqual(0);
  });
});
