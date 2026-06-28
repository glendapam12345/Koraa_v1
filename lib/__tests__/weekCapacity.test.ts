import { buildWeekCapacitySnapshot } from '@/lib/hoy/weekCapacity';
import type { DayTasks } from '@/hooks/useWeekTasks';

function makeDay(dateStr: string, dayName: string, taskIds: string[], isToday = false): DayTasks {
  return {
    day: { dateStr, dayName, label: dayName, isToday },
    tasks: taskIds.map((id) => ({
      id,
      content: `Task ${id}`,
      is_completed: false,
      is_priority: false,
      category: 'Trabajo',
      completed_at: null,
      created_at: '2026-06-22T10:00:00Z',
      parent_task_id: null,
      scheduled_date: dateStr,
    })),
  };
}

describe('weekCapacity', () => {
  it('finds busiest day by estimated minutes', () => {
    const weekTasks = [
      makeDay('2026-06-22', 'Lunes', ['a'], true),
      makeDay('2026-06-23', 'Martes', ['b', 'c']),
    ];

    const snapshot = buildWeekCapacitySnapshot({
      weekTasks,
      planningMeta: {
        a: { estimatedMinutes: 200, energyRequired: 'normal', notes: '' },
        b: { estimatedMinutes: 120, energyRequired: 'normal', notes: '' },
        c: { estimatedMinutes: 90, energyRequired: 'normal', notes: '' },
      },
      todayAvailableTime: 'Medio (2-4hrs)',
    });

    expect(snapshot?.busiestDate).toBe('2026-06-23');
    expect(snapshot?.busiestMinutes).toBe(210);
    expect(snapshot?.todayPlannedMinutes).toBe(200);
    expect(snapshot?.isWeekImbalanced).toBe(true);
  });
});
