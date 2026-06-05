import { buildHoyEmotionalClosure, buildHoyEmotionalToneLine } from '@/lib/hoyEmotionalClosure';
import type { Task } from '@/components/tasks/TaskCard';

const t = (key: string, params?: Record<string, string | number>) => {
  if (params) {
    return `${key}:${JSON.stringify(params)}`;
  }
  return key;
};

describe('hoyEmotionalClosure', () => {
  const baseTasks: Task[] = [
    { id: '1', content: 'A', is_completed: true } as Task,
    { id: '2', content: 'B', is_completed: false } as Task,
  ];

  it('returns null without check-in', () => {
    expect(buildHoyEmotionalClosure({ todayMood: null, energyLevel: 0, tasks: [], t })).toBeNull();
  });

  it('builds listen message when there are no tasks', () => {
    const result = buildHoyEmotionalClosure({
      todayMood: 'tranquila',
      energyLevel: 3,
      tasks: [],
      t,
    });
    expect(result?.message).toBe('hoy.closureListen');
  });

  it('builds compassion tone for low moods', () => {
    expect(buildHoyEmotionalToneLine('agotada', t)).toBe('hoy.mantraCompassion');
    expect(buildHoyEmotionalToneLine('motivada', t)).toBe('hoy.mantraImpulse');
    expect(buildHoyEmotionalToneLine(null, t)).toBe('hoy.mantraDefault');
  });

  it('builds enough message when most tasks are done', () => {
    const tasks: Task[] = [
      { id: '1', content: 'A', is_completed: true } as Task,
      { id: '2', content: 'B', is_completed: true } as Task,
      { id: '3', content: 'C', is_completed: true } as Task,
      { id: '4', content: 'D', is_completed: true } as Task,
      { id: '5', content: 'E', is_completed: false } as Task,
    ];
    const result = buildHoyEmotionalClosure({
      todayMood: 'enfocada',
      energyLevel: 4,
      tasks,
      t,
    });
    expect(result?.message).toBe('hoy.closureEnough:{"completed":4,"total":5}');
  });

  it('builds low-energy message for agotada', () => {
    const result = buildHoyEmotionalClosure({
      todayMood: 'agotada',
      energyLevel: 2,
      tasks: baseTasks,
      t,
    });
    expect(result?.message).toBe('hoy.closureLowProgress:{"count":1}');
  });
});
