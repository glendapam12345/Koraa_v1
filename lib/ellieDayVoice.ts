import type { HoyEllieDailyState } from '@/lib/hoyEllieDailyState';

export type EllieMiddayStep =
  | 'ask'
  | 'okayNext'
  | 'changedAsk'
  | 'adjust'
  | 'mind'
  | 'propose'
  | 'nightClose';

export type EllieDayVoiceInput = {
  dailyState: HoyEllieDailyState;
  middayStep?: EllieMiddayStep;
  notStartedMessage: string;
  returningMessage: string;
  okayNextMessage?: string;
  changedAskMessage?: string;
  adjustMessage?: string;
  mindGoMessage?: string;
  proposeMessage?: string;
  adaptingMessage?: string;
  freeDayMessage?: string;
  inProgressMessage: string;
  moodUpdatedMessage?: string;
  planDoneMessage?: string;
  planDoneClosedMessage?: string;
  planCloseAccepted?: boolean;
  eveningMessage: string;
  nightCloseMessage?: string;
  dayClosedMessage?: string;
};

export type EllieDayVoice = {
  message: string;
};

/**
 * Ellie on Today: one line from the daily state.
 * Legacy companion cues are not Today states.
 */
export function resolveEllieDayVoice(input: EllieDayVoiceInput): EllieDayVoice {
  const {
    dailyState,
    middayStep = 'ask',
    notStartedMessage,
    returningMessage,
    okayNextMessage = '',
    changedAskMessage = '',
    adjustMessage = '',
    mindGoMessage = '',
    proposeMessage = '',
    adaptingMessage = '',
    freeDayMessage = '',
    inProgressMessage,
    moodUpdatedMessage = '',
    planDoneMessage = '',
    planDoneClosedMessage = '',
    planCloseAccepted = false,
    eveningMessage,
    nightCloseMessage = '',
    dayClosedMessage = '',
  } = input;

  if (dailyState === 'not_started') {
    return { message: notStartedMessage };
  }

  if (dailyState === 'day_closed') {
    return { message: dayClosedMessage || eveningMessage };
  }

  if (dailyState === 'evening') {
    if (middayStep === 'nightClose' && nightCloseMessage) {
      return { message: nightCloseMessage };
    }
    if (middayStep === 'okayNext' && okayNextMessage) {
      return { message: okayNextMessage };
    }
    return { message: eveningMessage };
  }

  if (dailyState === 'plan_done') {
    if (planCloseAccepted && planDoneClosedMessage) {
      return { message: planDoneClosedMessage };
    }
    return { message: planDoneMessage || inProgressMessage };
  }

  if (dailyState === 'mood_updated' && moodUpdatedMessage) {
    return { message: moodUpdatedMessage };
  }

  if (dailyState === 'adapting' && adaptingMessage) {
    return { message: adaptingMessage };
  }

  if (dailyState === 'free_day' && freeDayMessage) {
    return { message: freeDayMessage };
  }

  if (dailyState === 'returning') {
    if (middayStep === 'propose' && proposeMessage) {
      return { message: proposeMessage };
    }
    if (middayStep === 'okayNext' && okayNextMessage) {
      return { message: okayNextMessage };
    }
    if (middayStep === 'changedAsk' && changedAskMessage) {
      return { message: changedAskMessage };
    }
    if (middayStep === 'adjust' && adjustMessage) {
      return { message: adjustMessage };
    }
    if (middayStep === 'mind' && mindGoMessage) {
      return { message: mindGoMessage };
    }
    return { message: returningMessage };
  }

  return { message: inProgressMessage };
}
