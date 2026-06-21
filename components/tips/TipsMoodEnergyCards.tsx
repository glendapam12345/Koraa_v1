import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { MiniSparklineChart } from '@/components/yo/MiniSparklineChart';
import type { DayData } from '@/components/ProgressChart';
import { MiniMoodTimeline } from '@/components/yo/MiniMoodTimeline';

type TipsMoodEnergyCardsProps = {
  emotionEmoji: string;
  emotionLabel: string;
  energyLevel: number;
  weekData: DayData[];
};

export function TipsMoodEnergyCards({
  emotionEmoji,
  emotionLabel,
  energyLevel,
  weekData,
}: TipsMoodEnergyCardsProps) {
  const { t } = useI18n();
  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('tipsExtra.a11yMoodEnergyCards')}
    >
      <LinearGradient
        colors={[...THEME.colors.parami.moodCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>{t('tips.moodCardTitle')}</Text>
        <View style={styles.todayRow}>
          <Text style={styles.emoji}>{emotionEmoji}</Text>
          <Text style={styles.todayLabel}>{emotionLabel}</Text>
        </View>
        <MiniMoodTimeline days={weekData} />
      </LinearGradient>

      <LinearGradient
        colors={[...THEME.colors.parami.energyCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>{t('tips.energyCardTitle')}</Text>
        <Text style={styles.energyToday}>
          {t('tips.energyToday', { level: energyLevel || 3 })}
        </Text>
        <MiniSparklineChart days={weekData} variant="onGradient" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  card: {
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    minHeight: 120,
    ...THEME.shadows.card,
  },
  cardTitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  emoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
  },
  todayLabel: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  energyToday: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    marginBottom: THEME.spacing.sm,
  },
});
