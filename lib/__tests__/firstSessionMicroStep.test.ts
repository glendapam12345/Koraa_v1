import {
  getFirstSessionMicroStepDoneKey,
  shouldHighlightFirstSessionMicroStep,
} from '@/lib/firstSessionMicroStep';

describe('shouldHighlightFirstSessionMicroStep', () => {
  it('highlights only on lite day with check-in and a focus task', () => {
    expect(
      shouldHighlightFirstSessionMicroStep({
        isLiteDay: true,
        hasCheckIn: true,
        hasFocusTask: true,
        alreadyCompleted: false,
      }),
    ).toBe(true);
  });

  it('hides after the micro-step was completed', () => {
    expect(
      shouldHighlightFirstSessionMicroStep({
        isLiteDay: true,
        hasCheckIn: true,
        hasFocusTask: true,
        alreadyCompleted: true,
      }),
    ).toBe(false);
  });

  it('hides without check-in, tasks, or on day 2+', () => {
    expect(
      shouldHighlightFirstSessionMicroStep({
        isLiteDay: true,
        hasCheckIn: false,
        hasFocusTask: true,
        alreadyCompleted: false,
      }),
    ).toBe(false);
    expect(
      shouldHighlightFirstSessionMicroStep({
        isLiteDay: true,
        hasCheckIn: true,
        hasFocusTask: false,
        alreadyCompleted: false,
      }),
    ).toBe(false);
    expect(
      shouldHighlightFirstSessionMicroStep({
        isLiteDay: false,
        hasCheckIn: true,
        hasFocusTask: true,
        alreadyCompleted: false,
      }),
    ).toBe(false);
  });

  it('hides in care mode', () => {
    expect(
      shouldHighlightFirstSessionMicroStep({
        isLiteDay: true,
        hasCheckIn: true,
        hasFocusTask: true,
        alreadyCompleted: false,
        crisisMode: true,
      }),
    ).toBe(false);
  });
});

describe('getFirstSessionMicroStepDoneKey', () => {
  it('scopes storage per user', () => {
    expect(getFirstSessionMicroStepDoneKey('u1')).toBe(
      'koraa_first_session_micro_step_done_v1_u1',
    );
  });
});
