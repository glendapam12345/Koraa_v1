import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import { useCheckInInsightsData } from '@/hooks/useCheckInInsightsData';
import {
  buildEmotionMix,
  buildEnergySparkline,
  hasEnoughPatternData,
} from '@/lib/checkInPatterns';
import { slicePeriodData } from '@/lib/checkInPeriod';
import { MiniSparklineChart } from '@/components/yo/MiniSparklineChart';
import { MiniEmotionBars } from '@/components/yo/MiniEmotionBars';
import { MiniMoodTimeline } from '@/components/yo/MiniMoodTimeline';
import { YoCheckInHistory } from '@/components/yo/YoCheckInHistory';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ParaMiMusaHeader, type ParaMiPeriodId } from '@/components/parami/ParaMiMusaHeader';
import { ParaMiMusaCard } from '@/components/parami/ParaMiMusaCard';
import { LockedChartPreview } from '@/components/parami/LockedChartPreview';
import { openPaywall } from '@/lib/paywallNavigation';

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

  const { progressData, historyEntries, loading, load } = useCheckInInsightsData(monthNames, dayLabels);

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
  const energySparkline = useMemo(() => buildEnergySparkline(periodData), [periodData]);
  const emotionMix = useMemo(() => buildEmotionMix(periodData), [periodData]);
  const hasPatternData = useMemo(() => hasEnoughPatternData(periodData), [periodData]);
  const locked = !isSubscribed;

  const moodChart = locked ? (
    <LockedChartPreview variant="mood" />
  ) : hasPatternData ? (
    <MiniMoodTimeline days={periodData} />
  ) : (
    <Text style={styles.placeholder}>{t('parami.patternsNeedCheckIns')}</Text>
  );

  const energyChart = locked ? (
    <LockedChartPreview variant="energy" />
  ) : hasPatternData ? (
    <MiniSparklineChart values={energySparkline} />
  ) : (
    <Text style={styles.placeholder}>{t('parami.patternsNeedCheckIns')}</Text>
  );

  const emotionsChart = locked ? (
    <LockedChartPreview variant="symptoms" />
  ) : hasPatternData ? (
    <MiniEmotionBars items={emotionMix} />
  ) : (
    <Text style={styles.placeholder}>{t('parami.patternsNeedCheckIns')}</Text>
  );

  return (
    <CalmScreen
      contentStyle={{ gap: THEME.layout.sectionGapCompact }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={THEME.colors.calm.lavenderDeep} />
      }
    >
      <ParaMiMusaHeader
        isSubscribed={isSubscribed}
        period={period}
        onPeriodChange={setPeriod}
      />

      <ParaMiMusaCard
        colors={[...THEME.colors.parami.moodCard]}
        title={t('parami.moodCardTitle')}
        body={t('parami.moodCardBody')}
        locked={locked}
      >
        {moodChart}
      </ParaMiMusaCard>

      <ParaMiMusaCard
        colors={[...THEME.colors.parami.energyCard]}
        title={t('yo.patternEnergyTitle')}
        body={t('parami.energyCardBody')}
        locked={locked}
      >
        {energyChart}
      </ParaMiMusaCard>

      <ParaMiMusaCard
        colors={[...THEME.colors.parami.symptomsCard]}
        title={t('parami.symptomsCardTitle')}
        body={t('parami.symptomsCardBody')}
        locked={locked}
      >
        {emotionsChart}
      </ParaMiMusaCard>

      <YoCheckInHistory
        entries={historyEntries}
        isSubscribed={isSubscribed}
        titleKey="parami.historyTitle"
        paywallReturnTo="/(tabs)/parami"
      />

      <View style={styles.tipsSoftSection}>
        <Text style={styles.tipsSoftNote}>{t('parami.tipsSectionBody')}</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/tips/[category]', params: { category: 'rest' } })}
          activeOpacity={0.75}
          accessibilityRole="link"
          accessibilityLabel={t('parami.tipsSectionA11y')}
        >
          <Text style={styles.tipsSoftLink}>{t('parami.linkTips')}</Text>
        </TouchableOpacity>
      </View>

      {locked && !subscriptionLoading ? (
        <View style={styles.premiumSection}>
          <Text style={styles.premiumNote}>{t('parami.premiumSectionNote')}</Text>
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
  placeholder: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
  },
  tipsSoftSection: {
    gap: THEME.spacing.xs,
    alignItems: 'center',
    paddingTop: THEME.spacing.sm,
  },
  tipsSoftNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsSoftLink: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    textDecorationLine: 'underline',
  },
  premiumSection: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.fill[200],
  },
  premiumNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
