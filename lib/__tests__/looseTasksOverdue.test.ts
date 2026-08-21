import {
  filterOverdueTasks,
  isOverdueScheduledTask,
  type LooseTaskSummary,
} from '@/lib/looseTasks';

describe('overdue loose tasks', () => {
  const today = '2026-08-20';

  function task(
    partial: Partial<LooseTaskSummary> & Pick<LooseTaskSummary, 'id' | 'content'>,
  ): LooseTaskSummary {
    return {
      created_at: '2026-08-01T12:00:00.000Z',
      is_completed: false,
      scheduled_date: null,
      ...partial,
    };
  }

  it('detects scheduled_date before today', () => {
    expect(
      isOverdueScheduledTask(task({ id: '1', content: 'a', scheduled_date: '2026-08-19' }), today),
    ).toBe(true);
    expect(
      isOverdueScheduledTask(task({ id: '2', content: 'b', scheduled_date: today }), today),
    ).toBe(false);
    expect(
      isOverdueScheduledTask(task({ id: '3', content: 'c', scheduled_date: null }), today),
    ).toBe(false);
  });

  it('filters and sorts overdue by date ascending', () => {
    const list = filterOverdueTasks(
      [
        task({ id: 'b', content: 'later', scheduled_date: '2026-08-18' }),
        task({ id: 'a', content: 'earlier', scheduled_date: '2026-08-10' }),
        task({ id: 'c', content: 'today', scheduled_date: today }),
        task({ id: 'd', content: 'done', scheduled_date: '2026-08-01', is_completed: true }),
      ],
      today,
    );
    expect(list.map((t) => t.id)).toEqual(['a', 'b']);
  });
});
