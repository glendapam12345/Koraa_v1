import { useState, useEffect } from 'react';
import { buildKoraaDayContext } from '@/lib/ai/buildDayContext';
import { resolveKoraaTipsBrief } from '@/lib/ai/fetchKoraaDailyBrief';
import type { AppLocale } from '@/lib/i18n';

type UseKoraaTipHighlightsArgs = {
  userId: string | undefined;
  emotion: string;
  energyLevel: number;
  locale: AppLocale;
};

/** Tips destacados del brief diario (cache de Hoy o fetch ligero). */
export function useKoraaTipHighlights({
  userId,
  emotion,
  energyLevel,
  locale,
}: UseKoraaTipHighlightsArgs) {
  const [tipIds, setTipIds] = useState<string[]>([]);
  const [tipLead, setTipLead] = useState('');
  const [fromAi, setFromAi] = useState(false);

  useEffect(() => {
    const context = buildKoraaDayContext({
      locale,
      displayName: '',
      todayMood: emotion,
      todayEmotionLabel: emotion,
      energyLevel,
      availableTime: '',
      focusLevel: '',
      suggestion: '',
      focusCount: 0,
      focusTasks: [],
      pendingCount: 0,
    });

    if (!context) {
      setTipIds([]);
      setTipLead('');
      setFromAi(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const brief = await resolveKoraaTipsBrief(userId, context);
      if (cancelled) return;
      setTipIds(brief.tipIds);
      setTipLead(brief.tipLead);
      setFromAi(brief.fromAi);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, emotion, energyLevel, locale]);

  return { tipIds, tipLead, fromAi };
}
