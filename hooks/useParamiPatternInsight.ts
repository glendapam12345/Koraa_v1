import { useEffect, useState } from 'react';
import { fetchParamiPatternInsight } from '@/lib/paramiPatternAi';
import { buildParamiPatternInputKey } from '@/lib/paramiPatternInputKey';
import type { ParamiPatternInput, ParamiPatternInsight } from '@/lib/paramiPatternInsight';

export type ParamiPatternInsightState = ParamiPatternInsight & { fromAi: boolean };

export function useParamiPatternInsight(
  userId: string | undefined,
  input: ParamiPatternInput | null,
  enabled: boolean,
) {
  const [insight, setInsight] = useState<ParamiPatternInsightState | null>(null);
  const [loading, setLoading] = useState(false);

  const inputKey = input ? buildParamiPatternInputKey(input) : '';

  useEffect(() => {
    if (!enabled || !userId || !input) {
      setInsight(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const snapshot = input;
    void fetchParamiPatternInsight(userId, snapshot)
      .then((result) => {
        if (cancelled) return;
        setInsight(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInsight(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, userId, inputKey]);

  return { insight, loading };
}
