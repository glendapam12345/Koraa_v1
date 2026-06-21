import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import type { ParamiPatternInsightState } from '@/hooks/useParamiPatternInsight';

type ParaMiPatternInsightCardProps = {
  insight: ParamiPatternInsightState | null;
  loading?: boolean;
};

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
    <View accessibilityRole="summary">
      <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Sparkles size={12} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.eyebrow}>{t('parami.patternInsightEyebrow')}</Text>
        {insight.fromAi ? (
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>{t('parami.patternInsightAiBadge')}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.patternNote}>{insight.patternNote}</Text>
      <Text style={styles.gentleTip}>{insight.gentleTip}</Text>
      </CalmCard>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
  },
  card: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flex: 1,
  },
  aiPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    lineHeight: 22,
  },
  gentleTip: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    fontFamily: THEME.fonts.accent.italic,
  },
});
