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
        <CalmCard style={styles.card}>
          {insights.map((insight, index) => (
            <View
              key={`${insight.type}-${index}`}
              style={[styles.row, index > 0 ? styles.rowDivider : null]}
            >
              {insight.emoji ? (
                <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
                  {insight.emoji}
                </Text>
              ) : (
                <View style={styles.emojiSpacer} />
              )}
              <Text style={styles.message}>{insight.message}</Text>
            </View>
          ))}
        </CalmCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  empty: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  card: {
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    minHeight: 40,
    paddingVertical: 6,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.fill[200],
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
    width: 22,
    textAlign: 'center',
  },
  emojiSpacer: {
    width: 22,
  },
  message: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 18,
    flex: 1,
  },
});
