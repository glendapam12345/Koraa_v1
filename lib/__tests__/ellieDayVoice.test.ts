import { resolveEllieDayVoice } from '@/lib/ellieDayVoice';
import { buildEllieAdaptMessage } from '@/lib/ellieCheckInInterpret';

const base = {
  notStartedMessage: 'START',
  returningMessage: 'RETURNING',
  inProgressMessage: 'PLAN',
  eveningMessage: 'ENOUGH',
  okayNextMessage: 'KEEP_PLAN',
  adjustMessage: 'ADJUST',
  mindGoMessage: 'MIND',
  adaptingMessage: 'ADAPT',
  freeDayMessage: 'FREE',
};

describe('resolveEllieDayVoice', () => {
  it('uses daily start, not a leftover companion cue', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'not_started',
    });
    expect(voice.message).toBe('START');
    expect(voice.message).not.toBe('I_AM_WITH_YOU');
  });

  it('interprets the check-in before showing a generic plan line', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'adapting',
    });
    expect(voice.message).toBe('ADAPT');
    expect(voice.message).not.toBe('HERE_IS_WHAT_TODAY_CAN_HOLD');
  });

  it('offers a free day instead of manufacturing tasks', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'free_day',
    });
    expect(voice.message).toBe('FREE');
    expect(voice.message).not.toBe('EMPTY_HEAD');
  });

  it('asks how we are doing on return', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'returning',
    });
    expect(voice.message).toBe('RETURNING');
  });

  it('asks what changed before adjusting', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'returning',
      middayStep: 'changedAsk',
      changedAskMessage: 'WHAT_CHANGED',
    });
    expect(voice.message).toBe('WHAT_CHANGED');
  });

  it('interprets and asks if the plan feels right after a return path', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'returning',
      middayStep: 'propose',
      proposeMessage: 'GOT_YOU_FEEL_RIGHT',
    });
    expect(voice.message).toBe('GOT_YOU_FEEL_RIGHT');
  });

  it('keeps going with today after I am okay', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'returning',
      middayStep: 'okayNext',
    });
    expect(voice.message).toBe('KEEP_PLAN');
    expect(voice.message).not.toBe('KEEP_GOING');
  });

  it('acknowledges a changed day before replan', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'returning',
      middayStep: 'adjust',
    });
    expect(voice.message).toBe('ADJUST');
  });

  it('invites capture when something is on their mind', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'returning',
      middayStep: 'mind',
    });
    expect(voice.message).toBe('MIND');
  });

  it('shows the active plan after the day already started', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'in_progress',
    });
    expect(voice.message).toBe('PLAN');
  });

  it('offers to lighten the day after a midday mood update', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'mood_updated',
      moodUpdatedMessage: 'LIGHTER',
    });
    expect(voice.message).toBe('LIGHTER');
  });

  it('asks if anything is urgent in evening close', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'evening',
    });
    expect(voice.message).toBe('ENOUGH');
  });

  it('closes the day without guilt', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'day_closed',
      dayClosedMessage: 'CLOSED',
    });
    expect(voice.message).toBe('CLOSED');
  });

  it('offers rest, empty, or tomorrow when today’s steps are done', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'plan_done',
      planDoneMessage: 'FINISHED',
    });
    expect(voice.message).toBe('FINISHED');
    expect(voice.message).not.toBe('ENOUGH');
    expect(voice.message).not.toBe('PLAN');
  });

  it('says see you tomorrow after they close a finished day', () => {
    const voice = resolveEllieDayVoice({
      ...base,
      dailyState: 'plan_done',
      planDoneMessage: 'FINISHED',
      planDoneClosedMessage: 'SEE_YOU',
      planCloseAccepted: true,
    });
    expect(voice.message).toBe('SEE_YOU');
  });
});

describe('buildEllieAdaptMessage', () => {
  it('names what Koraa understood and what it will do', () => {
    const message = buildEllieAdaptMessage({
      emotionLabel: 'overwhelmed',
      energyLevel: 2,
      focusLevel: 'cloudy',
      hasTasks: true,
      gotYou: 'Okay, I’ve got you.',
      summary: 'You’re feeling a little overwhelmed today, with lower energy and a cloudy mind.',
      lighter: 'Let’s make today lighter.',
      freeDay: 'You have a free day. What sounds right?',
    });
    expect(message).toContain('got you');
    expect(message).toContain('lighter');
    expect(message).not.toContain('free day');
  });
});
