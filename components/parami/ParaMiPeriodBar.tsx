import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { openPaywall } from '@/lib/paywallNavigation';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { periodDayCount } from '@/lib/checkInPeriod';
import { CalmSegmentedControl } from '@/components/ui/calm/CalmSegmentedControl';

export type ParaMiPeriodId = 'week' | 'twoWeeks' | 'month';

type ParaMiPeriodBarProps = {
  isSubscribed: boolean;
  period: ParaMiPeriodId;
  onPeriodChange: (period: ParaMiPeriodId) => void;
};

function formatShortDate(date: Date, locale: string): string {
  const day = date.getDate();
  const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = (locale === 'en' ? monthsEn : monthsEs)[date.getMonth()];
  return `${day} ${m}`;
}

export function ParaMiPeriodBar({
  isSubscribed,
  period,
  onPeriodChange,
}: ParaMiPeriodBarProps) {
  const { t, locale } = useI18n();

  const periods: {
    id: ParaMiPeriodId;
    labelKey: 'parami.periodWeek' | 'parami.periodTwoWeeks' | 'parami.periodMonth';
    premium: boolean;
  }[] = [
    { id: 'week', labelKey: 'parami.periodWeek', premium: false },
    { id: 'twoWeeks', labelKey: 'parami.periodTwoWeeks', premium: true },
    { id: 'month', labelKey: 'parami.periodMonth', premium: true },
  ];

  const daysBack = periodDayCount(period);

  const periodRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (daysBack - 1));
    return t('parami.periodRange', {
      start: formatShortDate(start, locale),
      end: formatShortDate(end, locale),
      days: String(daysBack),
    });
  }, [daysBack, t, locale]);

  const segments = periods.map(({ id, labelKey, premium }) => ({
    id,
    label: t(labelKey),
    accessibilityLabel: t(labelKey),
    locked: premium && !isSubscribed,
  }));

  const handleChange = (id: ParaMiPeriodId) => {
    const meta = periods.find((p) => p.id === id);
    if (meta?.premium && !isSubscribed) {
      openPaywall(router, '/(tabs)/parami');
      return;
    }
    onPeriodChange(id);
  };

  return (
    <View style={styles.wrap}>
      <CalmSegmentedControl
        segments={segments}
        value={period}
        onChange={handleChange}
        variant="chip"
        scrollable
      />
      <Text style={styles.periodRange}>{periodRangeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  periodRange: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
