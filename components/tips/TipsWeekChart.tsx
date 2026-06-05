import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCheckInInsightsData } from '@/hooks/useCheckInInsightsData';
import { ProgressChart } from '@/components/ProgressChart';
import { CalmCard } from '@/components/ui/calm/CalmCard';

const FREE_WEEK_DAYS = 7;

const MONTH_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function TipsWeekChart() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const monthNames = locale === 'en' ? MONTH_EN : MONTH_ES;
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

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void load(user.id);
    }, [user?.id, load]),
  );

  const chartData = useMemo(() => {
    if (isSubscribed) return progressData;
    return progressData.slice(-FREE_WEEK_DAYS);
  }, [isSubscribed, progressData]);

  const completedDays = chartData.filter((d) => d.hasCheckIn).length;
  const totalDays = chartData.length;
  const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  if (!user) return null;

  return (
    <View
      style={styles.block}
      accessibilityRole="summary"
      accessibilityLabel={`${t('tipsExtra.a11yWeekChartRegion')}. ${loading ? t('tips.patternLoading') : t('tipsExtra.a11yChartSummary', { checkIns: completedDays, total: totalDays })}`}
    >
      <Text style={styles.title}>{t('tips.weekRhythmTitle')}</Text>
      <Text style={styles.sub}>
        {loading
          ? t('tips.patternLoading')
          : isSubscribed
            ? t('tips.patternSub', { pct, completed: completedDays, total: totalDays })
            : t('tips.patternSubWeekFree', { pct, completed: completedDays, total: totalDays })}
      </Text>

      {!loading && chartData.length > 0 ? (
        <CalmCard>
          <ProgressChart data={chartData} />
        </CalmCard>
      ) : null}

      {!isSubscribed && !loading ? (
        <View style={styles.footnote}>
          <Text style={styles.footnoteText}>{t('tips.weekRhythmFreeNote')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/parami')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('tips.weekRhythmParaMiLink')}
            accessibilityHint={t('tipsExtra.a11yWeekChartHint')}
          >
            <Text style={styles.footnoteLink}>{t('tips.weekRhythmParaMiLink')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: THEME.spacing.sm,
    marginTop: 0,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  sub: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  footnote: {
    gap: 4,
    alignItems: 'flex-start',
    ...THEME.surfaces.panel,
    padding: THEME.spacing.sm,
  },
  footnoteText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  footnoteLink: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
