import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { bleedScreenPaddingX } from '@/lib/screenLayout';
import { useI18n } from '@/contexts/I18nContext';
import type { DayData } from '@/components/ProgressChart';
import { periodDayCount, slicePeriodData } from '@/lib/checkInPeriod';

export type ParaMiPeriodId = 'week' | 'twoWeeks' | 'month';

type ParaMiMusaHeaderProps = {
  firstName: string;
  isSubscribed: boolean;
  progressData: DayData[];
  todayEmotionLabel?: string;
  todayEnergyLevel?: number;
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

function energyLevelLabel(level: number, t: (k: 'parami.levelLow' | 'parami.levelMedium' | 'parami.levelHigh') => string) {
  if (level <= 2) return t('parami.levelLow');
  if (level >= 4) return t('parami.levelHigh');
  return t('parami.levelMedium');
}

function balanceWord(score: number, t: (k: 'parami.balanceLow' | 'parami.balanceDecent' | 'parami.balanceGood') => string) {
  if (score < 45) return t('parami.balanceLow');
  if (score < 70) return t('parami.balanceDecent');
  return t('parami.balanceGood');
}

export function ParaMiMusaHeader({
  firstName,
  isSubscribed,
  progressData,
  todayEmotionLabel,
  todayEnergyLevel = 0,
  period,
  onPeriodChange,
}: ParaMiMusaHeaderProps) {
  const { t, locale } = useI18n();

  const periods: { id: ParaMiPeriodId; labelKey: 'parami.periodWeek' | 'parami.periodTwoWeeks' | 'parami.periodMonth'; premium: boolean }[] = [
    { id: 'week', labelKey: 'parami.periodWeek', premium: false },
    { id: 'twoWeeks', labelKey: 'parami.periodTwoWeeks', premium: true },
    { id: 'month', labelKey: 'parami.periodMonth', premium: true },
  ];

  const daysBack = periodDayCount(period);
  const periodData = useMemo(() => slicePeriodData(progressData, period), [progressData, period]);

  const periodMeta = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (daysBack - 1));
    const withCheckIn = periodData.filter((d) => d.hasCheckIn);
    const avgEnergy =
      withCheckIn.length > 0
        ? Math.round(
            withCheckIn.reduce((sum, d) => sum + (d.energyLevel ?? 3), 0) / withCheckIn.length,
          )
        : todayEnergyLevel;
    const score = Math.min(100, Math.max(0, Math.round((avgEnergy / 5) * 100)));
    return {
      rangeLabel: t('parami.periodRange', {
        start: formatShortDate(start, locale),
        end: formatShortDate(end, locale),
        days: String(daysBack),
      }),
      score,
      energy: avgEnergy || todayEnergyLevel,
      checkInCount: withCheckIn.length,
    };
  }, [daysBack, periodData, todayEnergyLevel, t, locale]);

  const handlePeriodPress = (id: ParaMiPeriodId, premium: boolean) => {
    if (premium && !isSubscribed) {
      router.push('/paywall');
      return;
    }
    onPeriodChange(id);
  };

  const moodLabel = todayEmotionLabel?.trim() || t('parami.balanceNoMood');
  const energyLabel = periodMeta.energy > 0 ? energyLevelLabel(periodMeta.energy, t) : '—';

  return (
    <LinearGradient
      colors={[...THEME.colors.parami.header]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
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

      <Text style={styles.phaseTitle}>{t('parami.headerRhythmTitle', { name: firstName })}</Text>
      <Text style={styles.phaseSub}>{periodMeta.rangeLabel}</Text>

      <View
        style={styles.balanceCard}
        accessibilityRole="summary"
        accessibilityLabel={t('paramiExtra.a11yBalanceSummary', {
          word: balanceWord(periodMeta.score, t),
          mood: moodLabel,
          energy: energyLabel,
          score: periodMeta.score,
        })}
      >
        <View style={styles.balanceTop}>
          <Text style={styles.balanceTitle}>{t('parami.balanceTitle')}</Text>
          <View style={styles.untilTodayPill}>
            <Text style={styles.untilTodayText}>{t('parami.balanceUntilToday')}</Text>
          </View>
        </View>

        <View style={styles.balanceMain}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceWord}>{balanceWord(periodMeta.score, t)}</Text>
            <View style={styles.statRow}>
              <View style={[styles.dot, styles.dotMood]} />
              <Text style={styles.statText}>
                {t('parami.moodLabel')}: {moodLabel}
              </Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.dot, styles.dotEnergy]} />
              <Text style={styles.statText}>
                {t('parami.energyLabel')}: {energyLabel}
              </Text>
            </View>
            {periodMeta.checkInCount === 0 && todayEnergyLevel <= 0 ? (
              <Text style={styles.balanceHint}>{t('parami.noCheckInYet')}</Text>
            ) : null}
          </View>

          <View
            style={styles.ringWrap}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <View style={styles.ringOuter}>
              <View style={[styles.ringArcMood, { height: `${Math.min(100, periodMeta.score)}%` }]} />
              <View style={[styles.ringArcEnergy, { height: `${Math.min(100, (periodMeta.energy / 5) * 100)}%` }]} />
              <View style={styles.ringInner}>
                <Text style={styles.ringScore}>{periodMeta.score}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

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
    marginBottom: THEME.spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.md,
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
  phaseTitle: {
    ...THEME.typography.h2,
    fontSize: 26,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  phaseSub: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientFaint,
    marginBottom: THEME.spacing.md,
  },
  balanceCard: {
    backgroundColor: THEME.colors.parami.balanceCard,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.border,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  balanceTitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.medium,
  },
  untilTodayPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
  },
  untilTodayText: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.medium,
  },
  balanceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  balanceLeft: {
    flex: 1,
    gap: THEME.spacing.xs,
  },
  balanceWord: {
    ...THEME.typography.h1,
    fontSize: 32,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotMood: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  dotEnergy: {
    backgroundColor: THEME.colors.semantic.success,
  },
  statText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
  },
  balanceHint: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradientFaint,
    marginTop: THEME.spacing.xs,
  },
  ringWrap: {
    width: 88,
    height: 88,
  },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  ringArcMood: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 0.35,
  },
  ringArcEnergy: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    right: '30%',
    backgroundColor: THEME.colors.semantic.success,
    opacity: 0.4,
    borderRadius: 4,
  },
  ringInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  ringScore: {
    ...THEME.typography.h2,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
