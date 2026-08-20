import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { goToHoyTab } from '@/lib/tabNavigation';
import { savePatternHoyApply } from '@/lib/patternHoyBridge';
import { track } from '@/lib/analytics';
import { INSIGHTS_ENERGY_COLORS } from '@/lib/insightsColors';
import type { ParamiRhythmSnapshot } from '@/lib/paramiRhythmSnapshot';
import type { ParamiPatternInsightState } from '@/hooks/useParamiPatternInsight';

type ParaMiRhythmInsightHeroProps = {
  snapshot: ParamiRhythmSnapshot | null;
  insight: ParamiPatternInsightState | null;
  insightLoading?: boolean;
};

/**
 * Un solo hero: ritmo (número claro) + nota suave del periodo.
 * Evita dos cards que se pisan y abruman.
 */
export function ParaMiRhythmInsightHero({
  snapshot,
  insight,
  insightLoading = false,
}: ParaMiRhythmInsightHeroProps) {
  const { t } = useI18n();
  const energyAccent = INSIGHTS_ENERGY_COLORS[5];

  if (!snapshot && !insight && !insightLoading) return null;

  const handleApply = () => {
    if (!insight) return;
    void (async () => {
      await savePatternHoyApply(
        insight.gentleTip,
        insight.applyMode ?? 'open_hoy',
        insight.patternType,
      );
      void track('pattern_apply_hoy', {
        mode: insight.applyMode ?? 'open_hoy',
        pattern_type: insight.patternType ?? 'unknown',
        source: insight.source ?? 'feel',
      });
      goToHoyTab();
    })();
  };

  const noteEyebrow =
    insight?.correlationLabel ??
    (insight?.source === 'work'
      ? t('parami.patternInsightWorkEyebrow')
      : t('parami.patternInsightEyebrow'));

  /** Una sola frase útil — sin repetir headline + summary + tip. */
  const noteBody = insight
    ? insight.summary?.trim() || insight.patternNote?.trim() || insight.gentleTip?.trim() || ''
    : '';

  return (
    <LinearGradient
      colors={[...THEME.colors.parami.moodCard, THEME.colors.calm.mist]}
      start={{ x: 0.12, y: 0 }}
      end={{ x: 0.92, y: 1 }}
      style={styles.card}
      accessibilityRole="summary"
    >
      {snapshot ? (
        <View style={styles.rhythmBlock}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>{t('parami.rhythmHeroEyebrow')}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{t('parami.rhythmUntilToday')}</Text>
            </View>
          </View>

          <View style={styles.mainRow}>
            <View style={styles.copyCol}>
              <Text style={styles.level}>{snapshot.levelLabel}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {snapshot.moodLabel} · {snapshot.energyLabel}
              </Text>
            </View>

            <View
              style={styles.scoreCol}
              accessibilityLabel={t('parami.rhythmScoreA11y', { score: snapshot.score })}
            >
              <View style={styles.ringOuter}>
                <View style={[styles.ringInner, { borderColor: energyAccent }]}>
                  <Text style={styles.score}>{snapshot.score}</Text>
                </View>
              </View>
              <Text style={styles.scoreHint}>{t('parami.rhythmScoreHint')}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {insightLoading && !insight ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
        </View>
      ) : null}

      {insight && noteBody ? (
        <View style={[styles.noteBlock, snapshot ? styles.noteBlockBorder : null]}>
          <View style={styles.noteEyebrowRow}>
            {insight.source === 'work' ? (
              <Sparkles size={12} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
            ) : null}
            <Text style={styles.noteEyebrow}>{noteEyebrow}</Text>
          </View>
          <Text style={styles.noteBody} numberOfLines={3}>
            {noteBody}
          </Text>
          {insight.gentleTip &&
          insight.gentleTip.trim() !== noteBody.trim() ? (
            <Text style={styles.noteTip} numberOfLines={2}>
              {insight.gentleTip}
            </Text>
          ) : null}
          <View style={styles.ctaWrap}>
            <CalmPrimaryButton
              label={t('parami.patternApplyHoyCta')}
              onPress={handleApply}
              variant="soft"
              accessibilityHint={t('parami.patternApplyHoyHint')}
            />
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    overflow: 'hidden',
  },
  rhythmBlock: {
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
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    gap: THEME.spacing.sm,
  },
  copyCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  level: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  meta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  scoreCol: {
    alignItems: 'center',
    gap: 4,
  },
  ringOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
  },
  score: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  scoreHint: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 72,
  },
  loadingRow: {
    paddingVertical: THEME.spacing.xs,
    alignItems: 'center',
  },
  noteBlock: {
    gap: 6,
  },
  noteBlockBorder: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
    paddingTop: THEME.spacing.sm,
  },
  noteEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteEyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  noteBody: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  noteTip: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.accent.italic,
    lineHeight: 16,
  },
  ctaWrap: {
    marginTop: 2,
    alignSelf: 'stretch',
  },
});
