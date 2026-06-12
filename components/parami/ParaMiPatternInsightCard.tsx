import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Leaf, Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getEmotionEmoji } from '@/lib/emotionEmoji';
import type { ParamiPatternInsightState } from '@/hooks/useParamiPatternInsight';

export type ParaMiPatternStats = {
  checkInCount: number;
  topEmotionId?: string;
  topEmotionLabel?: string;
  topEmotionCount?: number;
  avgEnergy?: number;
};

type ParaMiPatternInsightCardProps = {
  insight: ParamiPatternInsightState | null;
  stats?: ParaMiPatternStats | null;
  loading?: boolean;
};

export function ParaMiPatternInsightCard({
  insight,
  stats,
  loading = false,
}: ParaMiPatternInsightCardProps) {
  const { t } = useI18n();

  if (loading && !insight) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
      </View>
    );
  }

  if (!insight) return null;

  const topEmoji = stats?.topEmotionId ? getEmotionEmoji(stats.topEmotionId) : null;

  return (
    <LinearGradient
      colors={[THEME.colors.fill[100], THEME.colors.calm.lavender, THEME.colors.fill[100]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      accessibilityRole="summary"
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.eyebrow}>{t('parami.patternInsightEyebrow')}</Text>
        </View>
        {insight.fromAi ? (
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>{t('parami.patternInsightAiBadge')}</Text>
          </View>
        ) : null}
      </View>

      {stats && stats.checkInCount > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats.checkInCount}</Text>
            <Text style={styles.statLabel}>{t('parami.patternStatCheckIns')}</Text>
          </View>
          {stats.topEmotionLabel && topEmoji ? (
            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>{topEmoji}</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {stats.topEmotionLabel}
              </Text>
              {stats.topEmotionCount ? (
                <Text style={styles.statLabel}>×{stats.topEmotionCount}</Text>
              ) : null}
            </View>
          ) : null}
          {stats.avgEnergy && stats.avgEnergy > 0 ? (
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{stats.avgEnergy.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{t('parami.patternStatEnergy')}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      <View style={styles.tiles}>
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <View style={[styles.tileIcon, styles.tileIconPattern]}>
              <Heart size={14} color={THEME.colors.calm.lavenderDeep} />
            </View>
            <Text style={styles.tileLabel}>{t('parami.patternInsightPatternLabel')}</Text>
          </View>
          <Text style={styles.tileBody} numberOfLines={3}>
            {insight.patternNote}
          </Text>
        </View>

        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <View style={[styles.tileIcon, styles.tileIconTip]}>
              <Leaf size={14} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.tileLabel}>{t('parami.patternInsightTipLabel')}</Text>
          </View>
          <Text style={styles.tileBody} numberOfLines={3}>
            {insight.gentleTip}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  aiPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  aiPillText: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingVertical: 2,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  statEmoji: {
    fontSize: 16,
    lineHeight: 18,
  },
  statValue: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    maxWidth: 88,
  },
  statLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
  },
  tiles: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
  },
  tile: {
    flex: 1,
    gap: 6,
    padding: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconPattern: {
    backgroundColor: THEME.colors.calm.lavender,
  },
  tileIconTip: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  tileLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  tileBody: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 17,
  },
});
