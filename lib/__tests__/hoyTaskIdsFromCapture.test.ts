import { hoyTaskIdsFromCaptureItems } from '@/lib/hoyTaskIdsFromCapture';

describe('hoyTaskIdsFromCaptureItems', () => {
  it('keeps undated and today items, skips future dates', () => {
    expect(
      hoyTaskIdsFromCaptureItems(
        [
          { taskId: 'today', selectedDate: '2026-08-24' },
          { taskId: 'loose', selectedDate: null },
          { taskId: 'later', selectedDate: '2026-08-29' },
          { taskId: '  ' },
        ],
        '2026-08-24',
      ),
    ).toEqual(['today', 'loose']);
  });

  it('caps undated dump items so Hoy stays light', () => {
    expect(
      hoyTaskIdsFromCaptureItems(
        [
          { taskId: 'a' },
          { taskId: 'b' },
          { taskId: 'c' },
          { taskId: 'd' },
          { taskId: 'e' },
        ],
        '2026-08-24',
      ),
    ).toEqual(['a', 'b', 'c']);
  });
});
