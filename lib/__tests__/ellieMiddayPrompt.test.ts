import {
  shouldShowEllieMiddayPrompt,
  isEllieReturningLater,
  getEllieDayStartedKey,
  getEllieMiddayDoneKey,
  getEllieDayClosedKey,
  sessionIdForCheckInTime,
  sessionIdForVisitStart,
  shouldReaskAfterAway,
  ELLIE_AWAY_REASK_MS,
} from '@/lib/ellieMiddayPrompt';

describe('isEllieReturningLater', () => {
  it('is false on the first session (this JS visit started the day)', () => {
    expect(
      isEllieReturningLater({
        hasCheckIn: true,
        storedSessionId: 'session-a',
        currentSessionId: 'session-a',
        returnedFromBackground: false,
      }),
    ).toBe(false);
  });

  it('is false before the day has been marked started', () => {
    expect(
      isEllieReturningLater({
        hasCheckIn: true,
        storedSessionId: null,
        currentSessionId: 'session-a',
        returnedFromBackground: false,
      }),
    ).toBe(false);
  });

  it('is true when opening later the same day (different JS session)', () => {
    expect(
      isEllieReturningLater({
        hasCheckIn: true,
        storedSessionId: 'morning-session',
        currentSessionId: 'afternoon-session',
        returnedFromBackground: false,
      }),
    ).toBe(true);
  });

  it('is true after leaving the app and coming back with a check-in', () => {
    expect(
      isEllieReturningLater({
        hasCheckIn: true,
        storedSessionId: 'session-a',
        currentSessionId: 'session-a',
        returnedFromBackground: true,
      }),
    ).toBe(true);
  });

  it('is false without a check-in', () => {
    expect(
      isEllieReturningLater({
        hasCheckIn: false,
        storedSessionId: 'morning-session',
        currentSessionId: 'afternoon-session',
        returnedFromBackground: true,
      }),
    ).toBe(false);
  });

  it('is true after login when today already has a check-in and storage was cleared', () => {
    expect(
      isEllieReturningLater({
        hasCheckIn: true,
        storedSessionId: null,
        currentSessionId: 'session-a',
        returnedFromBackground: false,
        checkInPresentAtVisitStart: true,
      }),
    ).toBe(true);
  });

  it('is true when opening Today with a check-in that already existed', () => {
    expect(
      isEllieReturningLater({
        hasCheckIn: true,
        storedSessionId: 'session-a',
        currentSessionId: 'session-a',
        returnedFromBackground: false,
        checkInPresentAtVisitStart: true,
      }),
    ).toBe(true);
  });
});

describe('shouldShowEllieMiddayPrompt', () => {
  it('shows on re-entry after check-in if they have not chosen a path this visit', () => {
    expect(
      shouldShowEllieMiddayPrompt({
        hasCheckIn: true,
        isReturningLater: true,
        dismissed: false,
      }),
    ).toBe(true);
  });

  it('hides on the first session, without check-in, after a choice, or in crisis', () => {
    expect(
      shouldShowEllieMiddayPrompt({
        hasCheckIn: true,
        isReturningLater: false,
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowEllieMiddayPrompt({
        hasCheckIn: false,
        isReturningLater: true,
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowEllieMiddayPrompt({
        hasCheckIn: true,
        isReturningLater: true,
        dismissed: true,
      }),
    ).toBe(false);
    expect(
      shouldShowEllieMiddayPrompt({
        hasCheckIn: true,
        isReturningLater: true,
        dismissed: false,
        crisisMode: true,
      }),
    ).toBe(false);
  });

  it('scopes storage to user and local day', () => {
    expect(getEllieDayStartedKey('u1', '2026-08-15')).toBe(
      'koraa_ellie_day_started_v1_u1_2026-08-15',
    );
    expect(getEllieMiddayDoneKey('u1', '2026-08-15')).toBe(
      'koraa_ellie_midday_done_v1_u1_2026-08-15',
    );
    expect(getEllieDayClosedKey('u1', '2026-08-15')).toBe(
      'koraa_ellie_day_closed_v1_u1_2026-08-15',
    );
  });

  it('hides the quiz after a choice, so a later open can show the plan instead', () => {
    expect(
      shouldShowEllieMiddayPrompt({
        hasCheckIn: true,
        isReturningLater: true,
        dismissed: true,
      }),
    ).toBe(false);
  });
});

describe('sessionIdForCheckInTime', () => {
  it('marks a morning check-in as a prior visit when opening later', () => {
    expect(
      sessionIdForCheckInTime({
        checkInCreatedAtMs: Date.parse('2026-08-15T09:00:00'),
        currentSessionId: 'afternoon',
        sessionStartedAtMs: Date.parse('2026-08-15T14:15:00'),
      }),
    ).toBe('prior-visit');
  });

  it('keeps this session when check-in just happened', () => {
    const started = Date.parse('2026-08-15T09:00:00');
    expect(
      sessionIdForCheckInTime({
        checkInCreatedAtMs: started + 4000,
        currentSessionId: 'morning',
        sessionStartedAtMs: started,
      }),
    ).toBe('morning');
  });

  it('fails toward re-entry if check-in time is unknown', () => {
    expect(
      sessionIdForCheckInTime({
        checkInCreatedAtMs: null,
        currentSessionId: 'afternoon',
        sessionStartedAtMs: Date.parse('2026-08-15T14:15:00'),
      }),
    ).toBe('prior-visit');
  });
});

describe('sessionIdForVisitStart', () => {
  it('keeps this session when check-in just happened in Hoy', () => {
    expect(
      sessionIdForVisitStart({
        checkInHappenedThisVisit: true,
        currentSessionId: 'morning',
      }),
    ).toBe('morning');
  });

  it('marks login or reopen with an existing check-in as a prior visit', () => {
    expect(
      sessionIdForVisitStart({
        checkInHappenedThisVisit: false,
        currentSessionId: 'afternoon',
      }),
    ).toBe('prior-visit');
  });
});

describe('shouldReaskAfterAway', () => {
  it('does not re-ask after a short app switch', () => {
    expect(shouldReaskAfterAway(30_000)).toBe(false);
  });

  it('re-asks after a later return the same day', () => {
    expect(shouldReaskAfterAway(ELLIE_AWAY_REASK_MS)).toBe(true);
    expect(shouldReaskAfterAway(4 * 60 * 60 * 1000)).toBe(true);
  });
});
