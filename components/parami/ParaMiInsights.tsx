import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { EmotionalInsight } from '@/lib/emotionalInsights';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type ParaMiInsightsProps = {
  insights: EmotionalInsight[];
  locked: boolean;
  hasEnoughData: boolean;
  loading: boolean;
  paywallReturnTo?: string;
};

export function ParaMiInsights({
  insights,
  locked,
  hasEnoughData,
  loading,
  paywallReturnTo = '/(tabs)/parami',
}: ParaMiInsightsProps) {
  const { t } = useI18n();

  if (loading) return null;
  if (locked) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('paramiExtra.a11yInsightsSection')}
    >
      {!hasEnoughData ? (
        <Text style={styles.empty}>{t('parami.noInsightYet')}</Text>
      ) : (
        <View style={styles.list}>
          {insights.map((insight, index) => (
            <CalmCard key={`${insight.type}-${index}`} style={styles.insightCard}>
              <View style={styles.insightContent}>
                {insight.emoji ? <Text style={styles.emoji}>{insight.emoji}</Text> : null}
                <Text style={styles.message}>{insight.message}</Text>
              </View>
            </CalmCard>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  empty: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  list: {
    gap: THEME.spacing.sm,
  },
  insightCard: {
    paddingVertical: THEME.spacing.sm,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  emoji: {
    fontSize: 22,
    marginTop: 2,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
    flex: 1,
  },
});
