import { useMemo } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { openPaywall } from '@/lib/paywallNavigation';
import { THEME } from '@/constants/theme';
import { bleedScreenPaddingX } from '@/lib/screenLayout';
import { useI18n } from '@/contexts/I18nContext';
import { periodDayCount } from '@/lib/checkInPeriod';

export type ParaMiPeriodId = 'week' | 'twoWeeks' | 'month';

type ParaMiMusaHeaderProps = {
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

export function ParaMiMusaHeader({
  isSubscribed,
  period,
  onPeriodChange,
}: ParaMiMusaHeaderProps) {
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
    <LinearGradient
      colors={[...THEME.colors.parami.header]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Text style={styles.title} accessibilityRole="header">
        {t('parami.headerTitle')}
      </Text>
      <Text style={styles.subtitle}>{t('parami.headerSubtitle')}</Text>

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
              style={[styles.pill, selected && styles.pillSelected, locked && !selected && styles.pillLocked]}
              accessibilityRole="button"
              accessibilityLabel={t(labelKey)}
              accessibilityHint={locked ? t('paramiExtra.a11yPeriodLockedHint') : t('paramiExtra.a11yPeriodHint')}
              accessibilityState={{ selected }}
            >
              {locked ? <Lock size={12} color={THEME.colors.onGradientFaint} style={styles.pillLockIcon} /> : null}
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{t(labelKey)}</Text>
              {locked ? (
                <Text style={styles.pillPremiumTag}>{t('parami.periodPremiumBadge')}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.periodRange}>{periodRangeLabel}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...bleedScreenPaddingX(),
    marginTop: -THEME.spacing.md,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    borderBottomLeftRadius: THEME.borderRadius.xl,
    borderBottomRightRadius: THEME.borderRadius.xl,
    marginBottom: 0,
  },
  title: {
    ...THEME.typography.h2,
    fontSize: 26,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    lineHeight: 22,
    marginBottom: THEME.spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  pillSelected: {
    backgroundColor: THEME.colors.fill[100],
  },
  pillLocked: {
    opacity: 0.85,
  },
  pillLockIcon: {
    marginRight: 2,
  },
  pillText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.medium,
  },
  pillTextSelected: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  pillPremiumTag: {
    ...THEME.typography.meta,
    fontSize: 9,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
    marginLeft: 2,
  },
  periodRange: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientFaint,
  },
});
