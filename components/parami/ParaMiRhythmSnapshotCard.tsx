import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { INSIGHTS_ENERGY_COLORS } from '@/lib/insightsColors';
import type { ParamiRhythmSnapshot } from '@/lib/paramiRhythmSnapshot';

type ParaMiRhythmSnapshotCardProps = {
  snapshot: ParamiRhythmSnapshot;
  compact?: boolean;
};

/**
 * Resumen suave del periodo — cifra + bandas de ánimo/energía (sin presión).
 */
export function ParaMiRhythmSnapshotCard({
  snapshot,
  compact = false,
}: ParaMiRhythmSnapshotCardProps) {
  const { t } = useI18n();
  const energyAccent = INSIGHTS_ENERGY_COLORS[5];

  return (
    <View
      style={[styles.card, compact && styles.cardCompact]}
      accessibilityRole="summary"
      accessibilityLabel={`${t('parami.rhythmEyebrow')}: ${snapshot.levelLabel}, ${snapshot.score}. ${t('parami.rhythmMoodLabel')}: ${snapshot.moodLabel}. ${t('parami.rhythmEnergyLabel')}: ${snapshot.energyLabel}.`}
    >
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{t('parami.rhythmEyebrow')}</Text>
        <View style={[styles.tag, compact && styles.tagCompact]}>
          <Text style={styles.tagText}>{t('parami.rhythmUntilToday')}</Text>
        </View>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.copyCol}>
          <Text style={[styles.level, compact && styles.levelCompact]}>{snapshot.levelLabel}</Text>
          {compact ? (
            <Text style={styles.inlineMeta} numberOfLines={1}>
              {snapshot.moodLabel} · {snapshot.energyLabel}
            </Text>
          ) : (
            <>
              <View style={styles.bullet}>
                <View style={[styles.dot, styles.dotMood]} />
                <Text style={styles.bulletText}>
                  {t('parami.rhythmMoodLabel')}: {snapshot.moodLabel}
                </Text>
              </View>
              <View style={styles.bullet}>
                <View style={[styles.dot, { backgroundColor: energyAccent }]} />
                <Text style={styles.bulletText}>
                  {t('parami.rhythmEnergyLabel')}: {snapshot.energyLabel}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.ring, compact && styles.ringCompact]} accessibilityElementsHidden>
          <View style={[styles.ringOuter, compact && styles.ringOuterCompact]}>
            <View
              style={[
                styles.ringInner,
                compact && styles.ringInnerCompact,
                { borderColor: energyAccent },
              ]}
            >
              <Text style={[styles.score, compact && styles.scoreCompact]}>{snapshot.score}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: THEME.spacing.sm,
  },
  cardCompact: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  tagCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.md,
  },
  copyCol: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  level: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    marginBottom: 4,
  },
  levelCompact: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 0,
  },
  inlineMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotMood: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  bulletText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  ring: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCompact: {
    width: 64,
    height: 64,
  },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 6,
    borderColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuterCompact: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
  },
  ringInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 5,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
  },
  ringInnerCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
  },
  score: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  scoreCompact: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
  },
});
