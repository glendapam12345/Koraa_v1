import { buildKoraaBrainDailyBriefBody, buildKoraaBrainWeeklyBriefBody, KORAA_BRAIN_FUNCTION } from '@/lib/ai/invokeKoraaBrain';
import type { KoraaDayContext } from '@/lib/ai/types';

describe('invokeKoraaBrain', () => {
  it('exposes koraa-brain function name', () => {
    expect(KORAA_BRAIN_FUNCTION).toBe('koraa-brain');
  });

  it('builds daily_brief request body', () => {
    const context: KoraaDayContext = {
      locale: 'es',
      date: '2026-06-22',
      displayName: 'Ana',
      checkIn: {
        emotionKey: 'tranquila',
        emotionLabel: 'Tranquila',
        energyLevel: 3,
        availableTime: '1-2h',
        focusLevel: 'media',
      },
      plan: {
        suggestion: 'Un paso suave',
        focusCount: 2,
        focusTasks: [{ id: 't1', content: 'Revisar correos' }],
        pendingCount: 5,
      },
    };

    const body = buildKoraaBrainDailyBriefBody(
      context,
      [{ id: 'mind-1', category: 'mindset', title: 'Respirar' }],
      [{ id: 't1', content: 'Revisar correos', category: 'otros' }],
      'domingo',
    );

    expect(body.mode).toBe('daily_brief');
    expect(body.context).toBe(context);
    expect(body.weekday).toBe('domingo');
    expect(body.tipCandidates).toHaveLength(1);
    expect(body.taskCandidates).toHaveLength(1);
  });

  it('buildKoraaBrainWeeklyBriefBody sends weekly mode', () => {
    const body = buildKoraaBrainWeeklyBriefBody({
      locale: 'es',
      displayName: 'Pamela',
      weekStart: '2026-06-22',
      weekEnd: '2026-06-28',
      totals: {
        openTasks: 3,
        completedTasks: 1,
        checkInDays: 1,
        busiestDay: '2026-06-22',
        busiestDayName: 'Lun',
        busiestDayCount: 2,
      },
      days: [],
    });

    expect(body.mode).toBe('weekly_brief');
    expect(body.weekContext.weekStart).toBe('2026-06-22');
  });
});
