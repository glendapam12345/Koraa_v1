import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import { getCatalog } from '@/lib/i18n';
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
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ParaMiPeriodBar, type ParaMiPeriodId } from '@/components/parami/ParaMiPeriodBar';
import { ParaMiMusaCard } from '@/components/parami/ParaMiMusaCard';
import { ParaMiPatternCard } from '@/components/parami/ParaMiPatternCard';
import { ParaMiTipsSection } from '@/components/parami/ParaMiTipsSection';
import { ParaMiInsights } from '@/components/parami/ParaMiInsights';
import { ParaMiPatternInsightCard } from '@/components/parami/ParaMiPatternInsightCard';
import { useParamiPatternInsight } from '@/hooks/useParamiPatternInsight';
import type { ParamiPatternInput } from '@/lib/paramiPatternInsight';
import { LockedChartPreview } from '@/components/parami/LockedChartPreview';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { EmergencyKitEntryCard } from '@/components/emergencyKit/EmergencyKitEntryCard';
import { openPaywall } from '@/lib/paywallNavigation';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import type { TipsUserContext } from '@/lib/tipsTypes';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export default function ParaMiScreen() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [period, setPeriod] = useState<ParaMiPeriodId>('week');

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

  const { progressData, loading, load } = useCheckInInsightsData(monthNames, dayLabels);

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
    const latest = periodData[periodData.length - 1];
    return {
      emotion: latest?.emotion?.toLowerCase() ?? 'tranquila',
      energyLevel: latest?.energyLevel ?? 3,
    };
  }, [periodData]);

  const moodChartSize = period === 'month' ? 'month' : period === 'twoWeeks' ? 'fortnight' : 'week';

  const showPremiumLocked = !subscriptionLoading && !isSubscribed;

  const patternInput = useMemo((): ParamiPatternInput | null => {
    if (!hasInsightData) return null;
    return {
      locale,
      period,
      days: periodData,
      emotionMix,
    };
  }, [hasInsightData, locale, period, periodData, emotionMix]);

  const { insight: patternInsight, loading: patternInsightLoading } = useParamiPatternInsight(
    user?.id,
    patternInput,
    hasInsightData,
  );

  const patternStats = useMemo(() => {
    const checkIns = periodData.filter((day) => day.hasCheckIn);
    const top = emotionMix[0];
    const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
    const avgEnergy =
      checkIns.length > 0
        ? Math.round(
            (checkIns.reduce((sum, d) => sum + (d.energyLevel ?? 0), 0) / checkIns.length) * 10,
          ) / 10
        : 0;

    return {
      checkInCount: checkIns.length,
      topEmotionId: top?.id,
      topEmotionLabel: top ? emotions[top.id.toLowerCase()] ?? top.id : undefined,
      topEmotionCount: top?.count,
      avgEnergy,
    };
  }, [periodData, emotionMix, locale]);

  const moodChart = showPremiumLocked ? (
    <LockedChartPreview variant="mood" />
  ) : (
    <MiniMoodTimeline days={periodData} monthNames={monthNames} period={period} />
  );

  const energyChart = showPremiumLocked ? (
    <LockedChartPreview variant="energy" />
  ) : (
    <MiniSparklineChart days={periodData} monthNames={monthNames} period={period} />
  );

  const emotionsChart = showPremiumLocked ? (
    <LockedChartPreview variant="symptoms" />
  ) : hasPatternData ? (
    <MiniEmotionBars items={emotionMix} />
  ) : null;

  return (
    <CalmScreen
      topInset="md"
      gap={THEME.layout.sectionGapCompact}
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

      <ParaMiInsights
        insights={insights}
        locked={showPremiumLocked}
        hasEnoughData={hasInsightData}
        loading={loading}
        paywallReturnTo="/(tabs)/parami"
      />

      <ParaMiPatternInsightCard
        insight={patternInsight}
        stats={patternStats}
        loading={patternInsightLoading}
      />

      <View style={styles.patternsSection}>
        <ParaMiMusaCard
          colors={[...THEME.colors.parami.moodCard]}
          title={moodCardTitle}
          body={t('parami.moodCardBody')}
          locked={showPremiumLocked}
          chartSize={moodChartSize}
        >
          {moodChart}
        </ParaMiMusaCard>

        <ParaMiPatternCard
          title={t('yo.patternEnergyTitle')}
          body={t('parami.energyCardBody')}
          locked={showPremiumLocked}
          empty={false}
          chartSize={moodChartSize}
        >
          {energyChart}
        </ParaMiPatternCard>

        <ParaMiPatternCard
          title={t('parami.symptomsCardTitle')}
          body={t('parami.symptomsCardBody')}
          locked={showPremiumLocked}
          empty={!showPremiumLocked && !hasPatternData}
        >
          {emotionsChart}
        </ParaMiPatternCard>
      </View>

      <ParaMiTipsSection context={tipsContext} />

      <EmergencyKitEntryCard compact />

      {showPremiumLocked ? (
        <View style={styles.unlockRow}>
          <Text style={styles.unlockNote}>{t('parami.premiumUnlockList')}</Text>
          <CalmPrimaryButton
            label={t('parami.unlockCta')}
            onPress={() => openPaywall(router, '/(tabs)/parami')}
            variant="soft"
            accessibilityHint={t('paramiExtra.a11yUnlockHint')}
          />
        </View>
      ) : null}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  patternsSection: {
    gap: THEME.layout.sectionGapCompact,
  },
  placeholderOnGradient: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
  },
  unlockRow: {
    gap: THEME.spacing.sm,
    alignItems: 'stretch',
  },
  unlockNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
