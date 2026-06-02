import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { FocusProgressBar } from '@/components/FocusProgressBar';
import { getEmotionEmoji } from '@/lib/emotionalInsights';
import type { FocusProgressStats } from '@/components/FocusProgressBar';
import { useI18n } from '@/contexts/I18nContext';

type HoyTasksHeroProps = {
  todayMood: string;
  emotionColor: string;
  emotionLabel: string;
  energyLevel: number;
  time: string;
  focusLevel: string;
  focusSummaryLine: string | null;
  priorityStats: FocusProgressStats;
};

export function HoyTasksHero({
  todayMood,
  emotionColor,
  emotionLabel,
  energyLevel,
  time,
  focusLevel,
  focusSummaryLine,
  priorityStats,
}: HoyTasksHeroProps) {
  const { t } = useI18n();

  return (
    <View style={[styles.heroTodayWrap, styles.heroTodayWrapFirst]}>
      <LinearGradient
        colors={[emotionColor.replace('0.15', '0.22'), THEME.colors.fill[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.heroTodayCard}
      >
        <Text style={styles.heroTodayHeadline}>{t('hoy.fitsToday')}</Text>
        <Text style={styles.heroTodaySubtitle}>
          {focusSummaryLine ?? t('hoy.organizeByYou')}
        </Text>
        <FocusProgressBar stats={priorityStats} style={styles.focusProgressBlock} />
        <View style={styles.heroTodayStateRow}>
          <View style={[styles.heroTodayPill, { backgroundColor: emotionColor }]}>
            <Text style={styles.heroTodayPillEmoji}>{getEmotionEmoji(todayMood)}</Text>
            <Text style={styles.heroTodayPillText}>
              {t('commonExtra.feelingPill', { emotion: emotionLabel })}
            </Text>
          </View>
          <View style={styles.heroTodayPillNeutral}>
            <Text style={styles.heroTodayPillNeutralText}>
              {t('commonExtra.energyPill', { n: energyLevel })}
            </Text>
          </View>
          {time ? (
            <View style={styles.heroTodayPillNeutral}>
              <Text style={styles.heroTodayPillNeutralText} numberOfLines={1}>
                {time}
              </Text>
            </View>
          ) : null}
          {focusLevel ? (
            <View style={styles.heroTodayPillNeutral}>
              <Text style={styles.heroTodayPillNeutralText} numberOfLines={1}>
                {focusLevel}
              </Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTodayWrap: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  heroTodayWrapFirst: {
    marginTop: 0,
  },
  heroTodayCard: {
    borderRadius: THEME.borderRadius.standard,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  heroTodayHeadline: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  heroTodaySubtitle: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    lineHeight: 18,
  },
  focusProgressBlock: {
    marginBottom: THEME.spacing.xs,
  },
  heroTodayStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  heroTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
  },
  heroTodayPillEmoji: {
    fontSize: 15,
  },
  heroTodayPillText: {
    fontSize: 12,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  heroTodayPillNeutral: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
  },
  heroTodayPillNeutralText: {
    fontSize: 12,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
});
