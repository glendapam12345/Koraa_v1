import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import type { DayData } from '@/components/ProgressChart';
import { ProgressChart } from '@/components/ProgressChart';
import { CalmCard } from '@/components/ui/calm/CalmCard';

const FREE_WEEK_DAYS = 7;

type TipsWeekChartProps = {
  progressData: DayData[];
  loading?: boolean;
};

export function TipsWeekChart({ progressData, loading = false }: TipsWeekChartProps) {
  const { t } = useI18n();
  const { isSubscribed } = useSubscription();

  const chartData = useMemo(() => {
    if (isSubscribed) return progressData;
    return progressData.slice(-FREE_WEEK_DAYS);
  }, [isSubscribed, progressData]);

  const completedDays = chartData.filter((d) => d.hasCheckIn).length;
  const totalDays = chartData.length;
  const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

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

      {!loading ? (
        <Text style={styles.footnoteText}>{t('tips.weekChartFootnote')}</Text>
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
