import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { INSIGHTS_ENERGY_COLORS } from '@/lib/insightsColors';
import type { ParamiRhythmSnapshot } from '@/lib/paramiRhythmSnapshot';

type ParaMiRhythmSnapshotCardProps = {
  snapshot: ParamiRhythmSnapshot;
};

/**
 * Resumen suave del periodo — cifra + bandas de ánimo/energía (sin presión).
 */
export function ParaMiRhythmSnapshotCard({ snapshot }: ParaMiRhythmSnapshotCardProps) {
  const { t } = useI18n();
  const energyAccent = INSIGHTS_ENERGY_COLORS[5];

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${t('parami.rhythmEyebrow')}: ${snapshot.levelLabel}, ${snapshot.score}. ${t('parami.rhythmMoodLabel')}: ${snapshot.moodLabel}. ${t('parami.rhythmEnergyLabel')}: ${snapshot.energyLabel}.`}
    >
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{t('parami.rhythmEyebrow')}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{t('parami.rhythmUntilToday')}</Text>
        </View>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.copyCol}>
          <Text style={styles.level}>{snapshot.levelLabel}</Text>
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
        </View>

        <View style={styles.ring} accessibilityElementsHidden>
          <View style={styles.ringOuter}>
            <View style={[styles.ringInner, { borderColor: energyAccent }]}>
              <Text style={styles.score}>{snapshot.score}</Text>
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
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 6,
    borderColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
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
  score: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
});
