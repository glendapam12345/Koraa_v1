import {
  isHoyEllieEveningClose,
  resolveHoyEllieDailyState,
  shouldHideHoyPlan,
} from '@/lib/hoyEllieDailyState';

describe('resolveHoyEllieDailyState', () => {
  it('is daily start when there is no check-in today', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: false,
        isReturningLater: false,
        isEveningClose: false,
      }),
    ).toBe('not_started');
  });

  it('interprets and adapts right after check-in when there are tasks', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: false,
        isEveningClose: false,
        checkInJustHappened: true,
        hasTasks: true,
      }),
    ).toBe('adapting');
  });

  it('offers a free day when check-in just happened and there are no tasks', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: false,
        isEveningClose: false,
        checkInJustHappened: true,
        hasTasks: false,
      }),
    ).toBe('free_day');
  });

  it('is in progress after they accept the adapted plan', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: false,
        isEveningClose: false,
        checkInJustHappened: true,
        hasTasks: true,
        adaptAccepted: true,
      }),
    ).toBe('in_progress');
  });

  it('is returning when the day already started and they come back', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: true,
        isEveningClose: false,
        checkInJustHappened: false,
        hasTasks: true,
      }),
    ).toBe('returning');
  });

  it('shows the plan after they already chose a midday path', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: true,
        isEveningClose: false,
        middayDismissed: true,
      }),
    ).toBe('in_progress');
  });

  it('is evening close when the day started and it is late night', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: true,
        isEveningClose: true,
      }),
    ).toBe('evening');
  });

  it('keeps the afternoon return until they accept the proposed plan', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: true,
        isEveningClose: false,
        moodUpdated: true,
      }),
    ).toBe('returning');
  });

  it('offers to replan after they update how they feel once the return is settled', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: true,
        isEveningClose: false,
        middayDismissed: true,
        moodUpdated: true,
      }),
    ).toBe('mood_updated');
  });

  it('keeps a conscious day close above night review', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: true,
        isEveningClose: true,
        dayClosed: true,
      }),
    ).toBe('day_closed');
  });

  it('notices when today’s steps are already done', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: true,
        isEveningClose: false,
        allFocusDone: true,
      }),
    ).toBe('plan_done');
  });

  it('keeps evening close even if today’s steps are done', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: true,
        isReturningLater: false,
        isEveningClose: true,
        allFocusDone: true,
      }),
    ).toBe('evening');
  });

  it('does not use evening close before the day has started', () => {
    expect(
      resolveHoyEllieDailyState({
        hasCheckIn: false,
        isReturningLater: false,
        isEveningClose: true,
      }),
    ).toBe('not_started');
  });
});

describe('isHoyEllieEveningClose', () => {
  it('uses the existing late-night window, not afternoon', () => {
    expect(isHoyEllieEveningClose(14)).toBe(false);
    expect(isHoyEllieEveningClose(19)).toBe(false);
    expect(isHoyEllieEveningClose(20)).toBe(true);
    expect(isHoyEllieEveningClose(22)).toBe(true);
    expect(isHoyEllieEveningClose(2)).toBe(true);
  });
});

describe('shouldHideHoyPlan', () => {
  it('shows leftover steps when they say something is urgent at night', () => {
    expect(shouldHideHoyPlan('evening', 'okayNext')).toBe(false);
  });

  it('hides the plan while Ellie is still asking at night', () => {
    expect(shouldHideHoyPlan('evening', 'ask')).toBe(true);
  });

  it('hides the plan while Ellie asks how we are doing', () => {
    expect(shouldHideHoyPlan('returning', 'ask')).toBe(true);
  });

  it('shows the proposed plan so they can accept or edit', () => {
    expect(shouldHideHoyPlan('returning', 'propose')).toBe(false);
  });
});
