import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { EllieMiddayStep } from '@/lib/ellieDayVoice';
import { getLocalDateString } from '@/lib/dateLocal';
import {
  isHoyEllieEveningClose,
  resolveHoyEllieDailyState,
  type HoyEllieDailyState,
} from '@/lib/hoyEllieDailyState';
import {
  ELLIE_JS_SESSION_ID,
  clearElliePromptSettledThisSession,
  isElliePromptSettledThisSession,
  isEllieReturningLater,
  hasEllieMiddayDoneToday,
  markEllieDayClosedToday,
  markEllieDayStartedSession,
  markEllieMiddayDoneToday,
  markElliePlanClosedToday,
  markElliePromptSettledThisSession,
  readEllieDayClosedToday,
  readEllieDayStartedSession,
  readElliePlanClosedToday,
  sessionIdForVisitStart,
  shouldReaskAfterAway,
} from '@/lib/ellieMiddayPrompt';
import {
  subscribeCheckInClosed,
  subscribeCheckInRefresh,
} from '@/lib/checkInRefresh';

/**
 * Primera sesión del día: check-in en esta visita de Hoy.
 * Reentrada: el check-in ya existía, cold start, o volvió tras ≥10 min en background.
 * Un “ya contesté” solo vale en esta sesión de JS — no tapa el mediodía.
 */
export function useEllieMiddayPrompt(
  userId: string | undefined,
  hasCheckIn: boolean,
  hasTasks = true,
  allFocusDone = false,
  moodUpdated = false,
) {
  const hasCheckInRef = useRef(hasCheckIn);
  const startedWithoutCheckInRef = useRef(!hasCheckIn);
  const wentBackgroundRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);
  const [storedSessionId, setStoredSessionId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!userId);
  const [returnedFromBackground, setReturnedFromBackground] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<EllieMiddayStep>('ask');
  const [adaptAccepted, setAdaptAccepted] = useState(false);
  const [planCloseAccepted, setPlanCloseAccepted] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [nightOutcome, setNightOutcome] = useState<'done' | 'some' | null>(null);
  const goTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localDayRef = useRef(getLocalDateString());
  const stepRef = useRef<EllieMiddayStep>('ask');

  hasCheckInRef.current = hasCheckIn;
  stepRef.current = step;

  const resetForNewLocalDay = useCallback(() => {
    clearElliePromptSettledThisSession();
    startedWithoutCheckInRef.current = true;
    setDayClosed(false);
    setNightOutcome(null);
    setDismissed(false);
    setAdaptAccepted(false);
    setPlanCloseAccepted(false);
    setReturnedFromBackground(false);
    setStep('ask');
    setStoredSessionId(null);
  }, []);

  const isNight = isHoyEllieEveningClose();
  const wasNightRef = useRef(isNight);

  useEffect(() => {
    if (isNight && !wasNightRef.current) {
      setStep('ask');
      setDismissed(false);
    }
    wasNightRef.current = isNight;
  }, [isNight]);

  useEffect(() => {
    if (!allFocusDone) setPlanCloseAccepted(false);
  }, [allFocusDone]);

  useEffect(() => {
    startedWithoutCheckInRef.current = !hasCheckIn;
    setPlanCloseAccepted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasCheckIn is read once per user
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setDismissed(false);
      setStep('ask');
      setAdaptAccepted(false);
      setPlanCloseAccepted(false);
      setDayClosed(false);
      setNightOutcome(null);
      setStoredSessionId(null);
      setReturnedFromBackground(false);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const [stored, planDone, closed, planClosed] = await Promise.all([
        readEllieDayStartedSession(userId),
        hasEllieMiddayDoneToday(userId),
        readEllieDayClosedToday(userId),
        readElliePlanClosedToday(userId),
      ]);
      if (cancelled) return;

      if (planDone) setAdaptAccepted(true);
      if (closed) setDayClosed(true);
      if (planClosed) setPlanCloseAccepted(true);
      if (isElliePromptSettledThisSession()) {
        setDismissed(true);
      }

      if (stored) {
        setStoredSessionId(stored);
      } else if (hasCheckIn) {
        const sessionId = sessionIdForVisitStart({
          checkInHappenedThisVisit: startedWithoutCheckInRef.current,
          currentSessionId: ELLIE_JS_SESSION_ID,
        });
        await markEllieDayStartedSession(userId, sessionId);
        if (!cancelled) setStoredSessionId(sessionId);
      }

      if (!cancelled) setLoaded(true);
    })();

    const failSafe = setTimeout(() => {
      if (!cancelled) setLoaded(true);
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, [userId, hasCheckIn]);

  useEffect(() => {
    const unsubRefresh = subscribeCheckInRefresh(() => {
      if (stepRef.current === 'adjust') setStep('propose');
    });
    const unsubClosed = subscribeCheckInClosed(() => {
      if (stepRef.current === 'adjust') setStep('ask');
    });
    return () => {
      unsubRefresh();
      unsubClosed();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (goTimerRef.current) clearTimeout(goTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      const today = getLocalDateString();
      if (today === localDayRef.current) return;
      localDayRef.current = today;
      resetForNewLocalDay();
      wentBackgroundRef.current = false;
      backgroundedAtRef.current = null;
    };
    const interval = setInterval(tick, 60_000);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        wentBackgroundRef.current = true;
        backgroundedAtRef.current = Date.now();
        return;
      }
      if (next !== 'active') return;

      const today = getLocalDateString();
      if (today !== localDayRef.current) {
        localDayRef.current = today;
        resetForNewLocalDay();
        wentBackgroundRef.current = false;
        backgroundedAtRef.current = null;
        return;
      }

      if (wentBackgroundRef.current) {
        wentBackgroundRef.current = false;
        const awayMs = backgroundedAtRef.current
          ? Date.now() - backgroundedAtRef.current
          : 0;
        backgroundedAtRef.current = null;
        if (!hasCheckInRef.current) return;
        if (!shouldReaskAfterAway(awayMs)) return;
        clearElliePromptSettledThisSession();
        setReturnedFromBackground(true);
        setDismissed(false);
        setStep('ask');
      }
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [resetForNewLocalDay]);

  const isReturningLater = isEllieReturningLater({
    hasCheckIn,
    storedSessionId,
    currentSessionId: ELLIE_JS_SESSION_ID,
    returnedFromBackground,
    checkInPresentAtVisitStart: hasCheckIn && !startedWithoutCheckInRef.current,
  });

  const resolvedState: HoyEllieDailyState = resolveHoyEllieDailyState({
    hasCheckIn,
    isReturningLater,
    isEveningClose: isHoyEllieEveningClose(),
    middayDismissed: dismissed,
    checkInJustHappened: hasCheckIn && startedWithoutCheckInRef.current,
    hasTasks,
    adaptAccepted,
    allFocusDone,
    moodUpdated,
    dayClosed,
  });
  const dailyState: HoyEllieDailyState = loaded
    ? resolvedState
    : hasCheckIn
      ? 'in_progress'
      : 'not_started';

  const showPrompt = loaded && dailyState === 'returning';

  const persistSettled = useCallback(() => {
    markElliePromptSettledThisSession();
  }, []);

  const dismiss = useCallback(() => {
    if (goTimerRef.current) {
      clearTimeout(goTimerRef.current);
      goTimerRef.current = null;
    }
    setDismissed(true);
    setStep('ask');
    persistSettled();
  }, [persistSettled]);

  const chooseOkay = useCallback(() => {
    setStep('okayNext');
  }, []);

  const confirmFeel = useCallback(() => {
    setStep('propose');
  }, []);

  const acceptAdapt = useCallback(() => {
    setAdaptAccepted(true);
    persistSettled();
    if (userId) void markEllieMiddayDoneToday(userId);
  }, [persistSettled, userId]);

  const closePlan = useCallback(() => {
    setPlanCloseAccepted(true);
    persistSettled();
    if (userId) void markElliePlanClosedToday(userId);
  }, [persistSettled, userId]);

  const closeDay = useCallback(() => {
    setDayClosed(true);
    persistSettled();
    if (userId) void markEllieDayClosedToday(userId);
  }, [persistSettled, userId]);

  const chooseShowPlan = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const speakThenGo = useCallback(
    (_nextStep: Extract<EllieMiddayStep, 'adjust' | 'mind'>, go: () => void) => {
      if (goTimerRef.current) {
        clearTimeout(goTimerRef.current);
        goTimerRef.current = null;
      }
      persistSettled();
      setDismissed(true);
      setStep('ask');
      go();
    },
    [persistSettled],
  );

  const chooseDayChanged = useCallback(() => {
    setStep('adjust');
  }, []);

  const confirmDayChanged = useCallback(
    (openReplan: () => void) => {
      speakThenGo('adjust', openReplan);
    },
    [speakThenGo],
  );

  const chooseMind = useCallback(() => {
    setStep('mind');
  }, []);

  const onHoyFocus = useCallback(() => {
    if (stepRef.current === 'mind') dismiss();
  }, [dismiss]);

  const chooseNightUrgent = useCallback(() => {
    setStep('okayNext');
  }, []);

  const chooseNightNotUrgent = useCallback(() => {
    setStep('nightClose');
  }, []);

  const chooseNightDid = useCallback(() => {
    setNightOutcome('done');
    closeDay();
  }, [closeDay]);

  const chooseNightSome = useCallback(() => {
    setStep('nightPick');
  }, []);

  const confirmNightSome = useCallback(
    (finishedCount = 0) => {
      setNightOutcome(finishedCount > 0 ? 'some' : null);
      closeDay();
    },
    [closeDay],
  );

  const chooseNightPickBack = useCallback(() => {
    setStep('ask');
  }, []);

  return {
    dailyState,
    showPrompt,
    dismiss,
    chooseOkay,
    chooseShowPlan,
    chooseDayChanged,
    confirmDayChanged,
    chooseMind,
    confirmFeel,
    acceptAdapt,
    closePlan,
    closeDay,
    chooseNightUrgent,
    chooseNightNotUrgent,
    chooseNightDid,
    chooseNightSome,
    confirmNightSome,
    chooseNightPickBack,
    onHoyFocus,
    planCloseAccepted,
    nightOutcome,
    step,
    isReturningLater,
    ready: loaded,
  };
}
