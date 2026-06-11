import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ParamiPatternInsightState } from '@/hooks/useParamiPatternInsight';

type ParaMiPatternInsightCardProps = {
  insight: ParamiPatternInsightState | null;
  loading?: boolean;
};

export function ParaMiPatternInsightCard({ insight, loading = false }: ParaMiPatternInsightCardProps) {
  const { t } = useI18n();

  if (loading && !insight) {
    return (
      <CalmCard style={styles.card}>
        <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
      </CalmCard>
    );
  }

  if (!insight) return null;

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{t('parami.patternInsightEyebrow')}</Text>
        {insight.fromAi ? (
          <View style={styles.aiBadge}>
            <Sparkles size={12} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.aiBadgeText}>{t('parami.patternInsightAiBadge')}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.headline}>{insight.headline}</Text>
      <Text style={styles.summary}>{insight.summary}</Text>

      <View style={styles.noteBlock}>
        <Text style={styles.noteLabel}>{t('parami.patternInsightPatternLabel')}</Text>
        <Text style={styles.noteBody}>{insight.patternNote}</Text>
      </View>

      <View style={styles.noteBlock}>
        <Text style={styles.noteLabel}>{t('parami.patternInsightTipLabel')}</Text>
        <Text style={styles.noteBody}>{insight.gentleTip}</Text>
      </View>

      <Text style={styles.softNote}>{t('parami.patternInsightSoftNote')}</Text>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  eyebrow: {
    ...THEME.typography.sectionEyebrow,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
  },
  aiBadgeText: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  headline: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  summary: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  noteBlock: {
    gap: 4,
  },
  noteLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  noteBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  softNote: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
});
