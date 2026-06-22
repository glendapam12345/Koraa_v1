import { filterLooseTasks, type LooseTaskSummary } from '@/lib/looseTasks';

const base = (partial: Partial<LooseTaskSummary>): LooseTaskSummary => ({
  id: partial.id ?? '1',
  content: partial.content ?? 'Task',
  created_at: partial.created_at ?? new Date().toISOString(),
  scheduled_date: partial.scheduled_date ?? null,
  life_area_key: partial.life_area_key ?? null,
  is_completed: partial.is_completed ?? false,
});

describe('filterLooseTasks', () => {
  it('filters by area ref', () => {
    const tasks = [
      base({ id: 'a', life_area_key: 'health' }),
      base({ id: 'b', life_area_key: 'work' }),
    ];
    const result = filterLooseTasks(tasks, 'all', { areaRef: 'health' });
    expect(result.map((t) => t.id)).toEqual(['a']);
  });

  it('returns recent tasks within 7 days', () => {
    const recent = new Date();
    const old = new Date(Date.now() - 10 * 86_400_000);
    const tasks = [
      base({ id: 'recent', created_at: recent.toISOString() }),
      base({ id: 'old', created_at: old.toISOString() }),
    ];
    const result = filterLooseTasks(tasks, 'recent');
    expect(result.map((t) => t.id)).toEqual(['recent']);
  });

  it('sorts oldest first', () => {
    const tasks = [
      base({ id: 'new', created_at: '2026-06-20T00:00:00.000Z' }),
      base({ id: 'old', created_at: '2026-06-01T00:00:00.000Z' }),
    ];
    const result = filterLooseTasks(tasks, 'oldest');
    expect(result.map((t) => t.id)).toEqual(['old', 'new']);
  });
});
