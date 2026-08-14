import { pickLightestOpenTask } from '@/lib/pickLightestOpenTask';

describe('pickLightestOpenTask', () => {
  it('picks the shortest open parent task', () => {
    const picked = pickLightestOpenTask([
      { id: 'a', content: 'Escribir el informe largo del trimestre' },
      { id: 'b', content: 'Mail' },
      { id: 'c', content: 'Revisar docs del proyecto' },
    ]);
    expect(picked?.id).toBe('b');
  });

  it('skips completed and subtasks', () => {
    const picked = pickLightestOpenTask([
      { id: 'sub', content: 'x', parent_task_id: 'a' },
      { id: 'done', content: 'ok', is_completed: true },
      { id: 'keep', content: 'Llamar' },
    ]);
    expect(picked?.id).toBe('keep');
  });

  it('returns null when nothing is open', () => {
    expect(pickLightestOpenTask([])).toBeNull();
    expect(
      pickLightestOpenTask([{ id: 'd', content: 'x', is_completed: true }]),
    ).toBeNull();
  });
});
