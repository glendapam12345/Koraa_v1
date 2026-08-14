import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import { useCheckInInsightsData } from '@/hooks/useCheckInInsightsData';
import {
  buildEmotionMix,
  hasEnoughPatternData,
} from '@/lib/checkInPatterns';
import { slicePeriodData } from '@/lib/checkInPeriod';
import { MiniSparklineChart } from '@/components/yo/MiniSparklineChart';
import { MiniEmotionBars } from '@/components/yo/MiniEmotionBars';
import { MiniMoodTimeline } from '@/components/yo/MiniMoodTimeline';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ParaMiPeriodBar, type ParaMiPeriodId } from '@/components/parami/ParaMiPeriodBar';
import { ParaMiMusaCard } from '@/components/parami/ParaMiMusaCard';
import { ParaMiPatternCard } from '@/components/parami/ParaMiPatternCard';
import { ParaMiTipsSection } from '@/components/parami/ParaMiTipsSection';
import { ParaMiInsights } from '@/components/parami/ParaMiInsights';
import { ParaMiPatternInsightCard } from '@/components/parami/ParaMiPatternInsightCard';
import { useParamiPatternInsight } from '@/hooks/useParamiPatternInsight';
import type { ParamiPatternInput } from '@/lib/paramiPatternInsight';
import { ParaMiPatternsLockedPreview } from '@/components/parami/ParaMiPatternsLockedPreview';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import { getLocalDateString } from '@/lib/dateLocal';
import { useKoraaTipHighlights } from '@/hooks/useKoraaTipHighlights';
import {
  buildEmotionChartInsight,
  buildEnergyChartInsight,
  buildMoodChartInsight,
} from '@/lib/paramiChartInsights';
import { buildParamiRhythmSnapshot } from '@/lib/paramiRhythmSnapshot';
import { ParaMiRhythmSnapshotCard } from '@/components/parami/ParaMiRhythmSnapshotCard';
import type { TipsUserContext } from '@/lib/tipsTypes';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export default function ParaMiScreen() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [period, setPeriod] = useState<ParaMiPeriodId>('week');
  const [patternsExpanded, setPatternsExpanded] = useState(false);

  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const dayLabels = useMemo(
    () => [
      t('yo.dayShortSun'),
      t('yo.dayShortMon'),
      t('yo.dayShortTue'),
      t('yo.dayShortWed'),
      t('yo.dayShortThu'),
      t('yo.dayShortFri'),
      t('yo.dayShortSat'),
    ],
    [t],
  );

  const { progressData, behaviorTasks, loading, load } = useCheckInInsightsData(monthNames, dayLabels);

  const refresh = useCallback(() => {
    if (user?.id) {
      void load(user.id);
    }
  }, [user?.id, load]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const periodData = useMemo(() => slicePeriodData(progressData, period), [progressData, period]);
  const emotionMix = useMemo(() => buildEmotionMix(periodData), [periodData]);
  const hasPatternData = useMemo(() => hasEnoughPatternData(periodData), [periodData]);

  const insights = useMemo(
    () => generateEmotionalInsights(periodData, 0, locale),
    [periodData, locale],
  );
  const hasInsightData = useMemo(
    () => periodData.filter((day) => day.hasCheckIn).length >= 3,
    [periodData],
  );

  const moodCardTitle = useMemo(() => {
    if (period === 'month') return t('parami.moodCardTitleMonth');
    if (period === 'twoWeeks') return t('parami.moodCardTitleFortnight');
    return t('parami.moodCardTitle');
  }, [period, t]);

  const tipsContext = useMemo((): TipsUserContext => {
    const today = getLocalDateString();
    const todayEntry = periodData.find((day) => day.date === today && day.hasCheckIn);
    const latest = periodData[periodData.length - 1];
    const source = todayEntry ?? (latest?.hasCheckIn ? latest : null);
    return {
      emotion: source?.emotion?.toLowerCase() ?? 'tranquila',
      energyLevel: source?.energyLevel ?? 3,
    };
  }, [periodData]);

  const { tipIds: highlightTipIds, tipLead, fromAi: tipsFromAi } = useKoraaTipHighlights({
    userId: user?.id,
    emotion: tipsContext.emotion,
    energyLevel: tipsContext.energyLevel,
    locale,
  });

  const moodChartSize = period === 'month' ? 'month' : period === 'twoWeeks' ? 'fortnight' : 'week';

  const checkInCount = useMemo(
    () => periodData.filter((day) => day.hasCheckIn).length,
    [periodData],
  );

  const moodChartInsight = useMemo(
    () => buildMoodChartInsight(periodData, locale),
    [periodData, locale],
  );
  const energyChartInsight = useMemo(
    () => buildEnergyChartInsight(periodData, locale),
    [periodData, locale],
  );
  const emotionChartInsight = useMemo(
    () => buildEmotionChartInsight(emotionMix, checkInCount, locale),
    [emotionMix, checkInCount, locale],
  );

  const rhythmSnapshot = useMemo(
    () => buildParamiRhythmSnapshot(periodData, locale),
    [periodData, locale],
  );

  const showPremiumLocked = !subscriptionLoading && !isSubscribed;

  const patternInput = useMemo((): ParamiPatternInput | null => {
    if (!hasInsightData) return null;
    return {
      locale,
      period,
      days: periodData,
      emotionMix,
      tasks: behaviorTasks,
      isPremium: isSubscribed,
    };
  }, [hasInsightData, locale, period, periodData, emotionMix, behaviorTasks, isSubscribed]);

  const { insight: patternInsight, loading: patternInsightLoading } = useParamiPatternInsight(
    user?.id,
    patternInput,
    hasInsightData,
  );

  const hasPatternHero = Boolean(patternInsight) || patternInsightLoading;

  return (
    <CalmScreen
      topInset="md"
      gap={THEME.layout.sectionGap}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={THEME.colors.calm.lavenderDeep} />
      }
    >
      <ScreenHeader
        compact
        title={t('parami.headerTitle')}
        subtitle={t('parami.headerSubtitle')}
        trailing={isSubscribed && !subscriptionLoading ? <PremiumBadge /> : undefined}
      />

      <ParaMiPeriodBar
        isSubscribed={isSubscribed}
        period={period}
        onPeriodChange={setPeriod}
      />

      {!showPremiumLocked && rhythmSnapshot ? (
        <ParaMiRhythmSnapshotCard snapshot={rhythmSnapshot} />
      ) : null}

      {/* Hero: un patrón o un insight — centrado */}
      <ParaMiPatternInsightCard insight={patternInsight} loading={patternInsightLoading} />
      <ParaMiInsights
        insights={insights}
        locked={showPremiumLocked}
        hasEnoughData={hasInsightData}
        loading={loading}
        hidden={hasPatternHero}
      />

      {/* Apoyo visual: ánimo (energía/emociones detrás de progressive disclosure) */}
      <View style={styles.patternsSection}>
        {showPremiumLocked ? (
          <ParaMiPatternsLockedPreview moodTitle={moodCardTitle} />
        ) : (
          <>
            <ParaMiMusaCard
              colors={[...THEME.colors.parami.moodCard]}
              title={moodCardTitle}
              body={t('parami.moodCardBody')}
              locked={false}
              chartSize={moodChartSize}
              insight={moodChartInsight}
            >
              <MiniMoodTimeline days={periodData} monthNames={monthNames} period={period} />
            </ParaMiMusaCard>

            {!patternsExpanded ? (
              <TouchableOpacity
                style={styles.moreToggle}
                onPress={() => setPatternsExpanded(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('parami.patternsMoreCta')}
              >
                <Text style={styles.moreToggleText}>{t('parami.patternsMoreCta')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.moreToggle}
                  onPress={() => setPatternsExpanded(false)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('parami.patternsMoreHide')}
                >
                  <Text style={styles.moreToggleText}>{t('parami.patternsMoreHide')}</Text>
                </TouchableOpacity>

                <ParaMiPatternCard
                  title={t('yo.patternEnergyTitle')}
                  body={t('parami.energyCardBody')}
                  locked={false}
                  empty={false}
                  chartSize={moodChartSize}
                  insight={energyChartInsight}
                >
                  <MiniSparklineChart days={periodData} monthNames={monthNames} period={period} />
                </ParaMiPatternCard>

                <ParaMiPatternCard
                  title={t('parami.symptomsCardTitle')}
                  body={t('parami.symptomsCardBody')}
                  locked={false}
                  empty={!hasPatternData}
                  insight={hasPatternData ? emotionChartInsight : null}
                >
                  {hasPatternData ? <MiniEmotionBars items={emotionMix} /> : null}
                </ParaMiPatternCard>
              </>
            )}
          </>
        )}
      </View>

      {/* Consejos visuales */}
      <ParaMiTipsSection
        context={tipsContext}
        highlightTipIds={highlightTipIds}
        tipLead={tipLead}
        fromAi={tipsFromAi}
      />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  patternsSection: {
    gap: THEME.layout.sectionGapCompact,
  },
  moreToggle: {
    alignSelf: 'center',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  moreToggleText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
  },
});
