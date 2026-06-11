import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { openPaywall } from '@/lib/paywallNavigation';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { periodDayCount } from '@/lib/checkInPeriod';

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

  const handlePeriodPress = (id: ParaMiPeriodId, premium: boolean) => {
    if (premium && !isSubscribed) {
      openPaywall(router, '/(tabs)/parami');
      return;
    }
    onPeriodChange(id);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {periods.map(({ id, labelKey, premium }) => {
          const selected = period === id;
          const locked = premium && !isSubscribed;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => handlePeriodPress(id, premium)}
              activeOpacity={0.85}
              style={[styles.pill, selected && styles.pillSelected]}
              accessibilityRole="button"
              accessibilityLabel={t(labelKey)}
              accessibilityHint={locked ? t('paramiExtra.a11yPeriodLockedHint') : t('paramiExtra.a11yPeriodHint')}
              accessibilityState={{ selected }}
            >
              {locked ? (
                <Lock
                  size={13}
                  color={selected ? THEME.colors.calm.lavenderDeep : THEME.colors.text.secondary}
                />
              ) : null}
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.periodRange}>{periodRangeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: 6,
  },
  pillSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  pillText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  pillTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  periodRange: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
