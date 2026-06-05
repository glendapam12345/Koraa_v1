import { getLocalDateFromISO, getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import { isPriorityCompletedToday } from '@/lib/priorityProgress';
import type { Task } from '@/hooks/useTasks';

function task(partial: Partial<Task> & { id: string }): Task {
  return {
    id: partial.id,
    content: partial.content ?? 'Tarea',
    is_completed: partial.is_completed ?? false,
    is_priority: partial.is_priority ?? false,
    category: partial.category ?? 'otros',
    completed_at: partial.completed_at ?? null,
    created_at: partial.created_at ?? '2026-05-19T10:00:00.000Z',
    parent_task_id: partial.parent_task_id ?? null,
  };
}

describe('getLocalDateFromISO', () => {
  it('matches getLocalDateString for a parsed instant', () => {
    const iso = '2026-05-20T02:00:00.000Z';
    expect(getLocalDateFromISO(iso)).toBe(getLocalDateString(new Date(iso)));
  });

  it('returns date-only prefix for plain YYYY-MM-DD', () => {
    expect(getLocalDateFromISO('2026-05-19')).toBe('2026-05-19');
  });
});

describe('normalizeScheduledDate', () => {
  it('maps timestamptz to local calendar day for grouping', () => {
    const iso = '2026-05-20T02:00:00.000Z';
    expect(normalizeScheduledDate(iso)).toBe(getLocalDateFromISO(iso));
  });

  it('returns null for empty values', () => {
    expect(normalizeScheduledDate(null)).toBeNull();
    expect(normalizeScheduledDate('')).toBeNull();
  });
});

describe('isPriorityCompletedToday with local day', () => {
  it('counts completion on local calendar day, not UTC date prefix', () => {
    const iso = '2026-05-20T02:00:00.000Z';
    const localDay = getLocalDateFromISO(iso);
    const utcDay = iso.slice(0, 10);

    expect(
      isPriorityCompletedToday(
        task({ id: '1', is_priority: true, is_completed: true, completed_at: iso }),
        localDay,
      ),
    ).toBe(true);

    if (localDay !== utcDay) {
      expect(
        isPriorityCompletedToday(
          task({ id: '1', is_priority: true, is_completed: true, completed_at: iso }),
          utcDay,
        ),
      ).toBe(false);
    }
  });
});
