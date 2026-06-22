import {
  applyAssignmentsToWeekTasks,
  moveTaskInWeekDraft,
} from '@/lib/replanWeekDraft';
import type { DayTasks } from '@/hooks/useWeekTasks';

const week: DayTasks[] = [
  {
    day: { dateStr: '2026-06-16', label: 'Mon', dayName: 'Monday', isToday: true },
    tasks: [{ id: 'a', content: 'A', scheduled_date: '2026-06-16' } as never],
  },
  {
    day: { dateStr: '2026-06-17', label: 'Tue', dayName: 'Tuesday', isToday: false },
    tasks: [],
  },
];

describe('replanWeekDraft', () => {
  it('moves assigned tasks to target days', () => {
    const next = applyAssignmentsToWeekTasks(week, [{ id: 'a', scheduled_date: '2026-06-17' }]);
    expect(next[0].tasks).toHaveLength(0);
    expect(next[1].tasks).toHaveLength(1);
    expect(next[1].tasks[0].id).toBe('a');
  });

  it('moves tasks in draft without persisting', () => {
    const next = moveTaskInWeekDraft(week, 'a', '2026-06-17');
    expect(next[1].tasks[0].scheduled_date).toBe('2026-06-17');
  });
});
