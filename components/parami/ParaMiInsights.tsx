import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { EmotionalInsight } from '@/lib/emotionalInsights';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { openPaywall } from '@/lib/paywallNavigation';

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

  if (locked) {
    return (
      <View
        style={styles.wrap}
        accessibilityRole="summary"
        accessibilityLabel={`${t('parami.insightsLockedTitle')}. ${t('parami.insightsLockedBody')}`}
      >
        <CalmCard style={styles.lockedCard}>
          <View style={styles.lockedHeader}>
            <Lock size={18} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.lockedTitle}>{t('parami.insightsLockedTitle')}</Text>
          </View>
          <Text style={styles.lockedBody}>{t('parami.insightsLockedBody')}</Text>
          <CalmPrimaryButton
            label={t('parami.patternUnlockHint')}
            onPress={() => openPaywall(router, paywallReturnTo)}
            variant="soft"
            accessibilityHint={t('paramiExtra.a11yUnlockHint')}
          />
        </CalmCard>
      </View>
    );
  }

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
  lockedCard: {
    gap: THEME.spacing.sm,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  lockedTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  lockedBody: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
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
