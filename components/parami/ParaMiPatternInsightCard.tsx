import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ParamiPatternInsightState } from '@/hooks/useParamiPatternInsight';

type ParaMiPatternInsightCardProps = {
  insight: ParamiPatternInsightState | null;
  loading?: boolean;
};

/** Hero de patrón — centrado, con aire, una sola respiración. */
export function ParaMiPatternInsightCard({
  insight,
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

  return (
    <View style={styles.hero} accessibilityRole="summary">
      <Text style={styles.eyebrow}>{t('parami.patternInsightEyebrow')}</Text>
      {insight.fromAi ? (
        <View style={styles.aiPill}>
          <Text style={styles.aiPillText}>{t('parami.patternInsightAiBadge')}</Text>
        </View>
      ) : null}
      <Text style={styles.patternNote}>{insight.patternNote}</Text>
      <Text style={styles.gentleTip}>{insight.gentleTip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    paddingVertical: THEME.spacing.lg,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: THEME.spacing.sm,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
  aiPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
  },
  aiPillText: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  patternNote: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: THEME.fonts.heading.medium,
  },
  gentleTip: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: THEME.fonts.accent.italic,
    maxWidth: 320,
  },
});
