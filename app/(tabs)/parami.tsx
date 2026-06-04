import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import { useCheckInInsightsData } from '@/hooks/useCheckInInsightsData';
import { buildEmotionMix, buildEnergySparkline, hasEnoughPatternData } from '@/lib/checkInPatterns';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import { ParaMiMusaCard } from '@/components/parami/ParaMiMusaCard';
import { MiniSparklineChart } from '@/components/yo/MiniSparklineChart';
import { MiniEmotionBars } from '@/components/yo/MiniEmotionBars';
import { YoCheckInHistory } from '@/components/yo/YoCheckInHistory';
import { ScreenIntroCard } from '@/components/ui/ScreenIntroCard';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export default function ParaMiScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { user } = useAuth();
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
    if (user?.id) void load(user.id);
  }, [user?.id, load]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const energySparkline = useMemo(() => buildEnergySparkline(progressData), [progressData]);
  const emotionMix = useMemo(() => buildEmotionMix(progressData), [progressData]);
  const hasPatternData = useMemo(() => hasEnoughPatternData(progressData), [progressData]);
  const emotionalInsights = useMemo(
    () => generateEmotionalInsights(progressData, 0, locale),
    [progressData, locale],
  );

  const locked = !isSubscribed;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + THEME.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={THEME.colors.gradient.blue} />
        }
      >
        <Text style={styles.title}>{t('tabs.paraMi')}</Text>
        <Text style={styles.subtitle}>{t('parami.subtitle')}</Text>
        <ScreenIntroCard>{t('parami.intro')}</ScreenIntroCard>

        <ParaMiMusaCard
          colors={[THEME.colors.chartPalette[0], THEME.colors.chartPalette[1]]}
          title={t('yo.patternEnergyTitle')}
          body={t('parami.energyCardBody')}
          locked={locked}
          onUnlock={() => router.push('/paywall')}
          unlockCta={t('parami.unlockCta')}
        >
          {hasPatternData ? (
            <MiniSparklineChart values={energySparkline} />
          ) : (
            <Text style={styles.placeholder}>{t('yo.patternsNeedData')}</Text>
          )}
        </ParaMiMusaCard>

        <ParaMiMusaCard
          colors={[THEME.colors.chartPalette[10], THEME.colors.gradient.pink]}
          title={t('yo.patternEmotionTitle')}
          body={t('parami.emotionCardBody')}
          locked={locked}
          onUnlock={() => router.push('/paywall')}
          unlockCta={t('parami.unlockCta')}
        >
          {hasPatternData ? (
            <MiniEmotionBars items={emotionMix} />
          ) : (
            <Text style={styles.placeholder}>{t('yo.patternsNeedData')}</Text>
          )}
        </ParaMiMusaCard>

        {!locked && !subscriptionLoading && emotionalInsights.length > 0 ? (
          <View style={styles.insightsBox}>
            {emotionalInsights.map((insight, index) => (
              <Text key={index} style={styles.insightLine}>
                {insight.emoji ? `${insight.emoji} ` : ''}
                {insight.message}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.historyHeading}>{t('yo.historyTitle')}</Text>
        <YoCheckInHistory
          entries={historyEntries}
          isSubscribed={isSubscribed}
          freeVisibleCount={7}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  title: {
    ...THEME.typography.h1,
    fontSize: 28,
    color: THEME.colors.text.main,
    marginBottom: 4,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 22,
  },
  placeholder: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
  },
  insightsBox: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  insightLine: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  historyHeading: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: THEME.spacing.sm,
  },
});
