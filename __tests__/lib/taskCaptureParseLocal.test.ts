import { parseTaskCaptureLocally } from '@/lib/taskCaptureParseLocal';

describe('parseTaskCaptureLocally', () => {
  const wednesday = new Date(2026, 5, 10, 10, 0); // 2026-06-10 Wednesday

  it('extracts viernes from Spanish text', () => {
    const result = parseTaskCaptureLocally(
      'Tengo una tarea importante para el viernes: entregar informe',
      'es',
      wednesday,
    );
    expect(result.main_task.scheduled_date).toBe('2026-06-12');
    expect(result.main_task.content.length).toBeGreaterThan(3);
    expect(result.main_task.effort).toBe('heavy');
  });

  it('extracts tomorrow in English', () => {
    const result = parseTaskCaptureLocally('Important call tomorrow', 'en', wednesday);
    expect(result.main_task.scheduled_date).toBe('2026-06-11');
  });

  it('suggests prep steps when due date is several days away', () => {
    const result = parseTaskCaptureLocally(
      'Presentación importante el viernes',
      'es',
      wednesday,
    );
    expect(result.prep_steps.length).toBeGreaterThan(0);
  });
});
