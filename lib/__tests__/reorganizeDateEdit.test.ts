import { applyReorganizeDateEdit, tasksOnProposedDate } from '@/lib/reorganizeDateEdit';
import type { ReorganizeWeekProposal } from '@/lib/lifeAreas/types';

const TODAY = '2026-08-17';
const TOMORROW = '2026-08-18';

const proposal: ReorganizeWeekProposal = {
  headline: 'Room',
  subline: 'Moved flexible items',
  kept: [
    {
      taskId: 'keep-1',
      title: 'Call dentist',
      areaEmoji: '📝',
      areaColor: '#7EB3F0',
      date: TODAY,
      dateLabel: 'Mon, Aug 17',
    },
  ],
  moved: [
    {
      taskId: 'move-1',
      title: 'Buy groceries',
      areaEmoji: '🛒',
      areaColor: '#7EB3F0',
      fromDate: TODAY,
      fromLabel: 'Mon, Aug 17',
      toDate: TOMORROW,
      toLabel: 'Tue, Aug 18',
    },
  ],
};

describe('applyReorganizeDateEdit', () => {
  it('moves a kept step to another day', () => {
    const next = applyReorganizeDateEdit({
      proposal,
      assignments: [{ id: 'move-1', scheduled_date: TOMORROW }],
      taskId: 'keep-1',
      nextDate: TOMORROW,
      today: TODAY,
      locale: 'en',
    });

    expect(next.proposal.kept.some((item) => item.taskId === 'keep-1')).toBe(false);
    expect(next.proposal.moved.find((item) => item.taskId === 'keep-1')?.toDate).toBe(TOMORROW);
    expect(next.assignments).toEqual(
      expect.arrayContaining([{ id: 'keep-1', scheduled_date: TOMORROW }]),
    );
  });

  it('brings a moved step back to today', () => {
    const next = applyReorganizeDateEdit({
      proposal,
      assignments: [{ id: 'move-1', scheduled_date: TOMORROW }],
      taskId: 'move-1',
      nextDate: TODAY,
      today: TODAY,
      locale: 'en',
    });

    expect(next.proposal.moved.some((item) => item.taskId === 'move-1')).toBe(false);
    expect(next.proposal.kept.find((item) => item.taskId === 'move-1')?.date).toBe(TODAY);
  });
});

describe('tasksOnProposedDate', () => {
  it('lists pending steps for the chosen day', () => {
    const onTomorrow = tasksOnProposedDate(
      proposal,
      [{ id: 'move-1', scheduled_date: TOMORROW }],
      TOMORROW,
      TODAY,
    );
    expect(onTomorrow.map((item) => item.taskId)).toEqual(['move-1']);
  });

  it('does not pretend a moved step without a date is still today', () => {
    const undated = {
      ...proposal,
      moved: [{ ...proposal.moved[0]!, toDate: undefined }],
    };
    const onToday = tasksOnProposedDate(undated, [], TODAY, TODAY);
    expect(onToday.map((item) => item.taskId)).not.toContain('move-1');
  });
});
