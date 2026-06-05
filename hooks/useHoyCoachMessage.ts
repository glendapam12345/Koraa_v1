import { useEffect, useMemo, useState } from 'react';
import { buildHoyCoachMessage, type HoyCoachInput } from '@/lib/hoyDailyCoach';
import { fetchHoyCoachMessage } from '@/lib/hoyCoachAi';

export function useHoyCoachMessage(
  userId: string | undefined,
  input: HoyCoachInput | null,
) {
  const fallback = useMemo(
    () => (input ? buildHoyCoachMessage(input) : null),
    [input],
  );

  const [coach, setCoach] = useState(fallback);
  const [loadingAi, setLoadingAi] = useState(false);
  const [fromAi, setFromAi] = useState(false);

  const inputKey = input
    ? `${userId ?? ''}-${input.emotionKey}-${input.energyLevel}-${input.locale}-${input.suggestion}-${input.focusCount}`
    : '';

  useEffect(() => {
    if (!input) {
      setCoach(null);
      setFromAi(false);
      return;
    }

    setCoach(buildHoyCoachMessage(input));
    setFromAi(false);

    let cancelled = false;
    setLoadingAi(true);

    void fetchHoyCoachMessage(userId, input).then((result) => {
      if (cancelled) return;
      setCoach({
        greeting: result.greeting,
        body: result.body,
        actionLine: result.actionLine,
      });
      setFromAi(result.fromAi);
      setLoadingAi(false);
    });

    return () => {
      cancelled = true;
    };
  }, [inputKey, userId]);

  return { coach, loadingAi, fromAi };
}
