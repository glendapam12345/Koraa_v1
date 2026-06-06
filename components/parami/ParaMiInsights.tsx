import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { EmotionalInsight } from '@/lib/emotionalInsights';
import { getInsightAction } from '@/lib/paramiActionSummary';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type ParaMiInsightsProps = {
  insights: EmotionalInsight[];
  locked: boolean;
  hasEnoughData: boolean;
  loading: boolean;
};

export function ParaMiInsights({
  insights,
  locked,
  hasEnoughData,
  loading,
}: ParaMiInsightsProps) {
  const { t } = useI18n();

  if (loading) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('paramiExtra.a11yInsightsSection')}
    >
      <Text style={styles.title} accessibilityRole="header">
        {t('parami.insightTitle')}
      </Text>
      <Text style={styles.lead}>{t('parami.insightLead')}</Text>

      {!hasEnoughData ? (
        <Text style={styles.empty}>{t('parami.noInsightYet')}</Text>
      ) : locked ? (
        <TouchableOpacity
          onPress={() => router.push('/paywall')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('paramiExtra.a11yInsightsLocked')}
          accessibilityHint={t('paramiExtra.a11yUnlockHint')}
        >
          <CalmCard style={styles.lockedCard}>
            <View style={styles.lockedRow}>
              <Lock size={18} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.lockedTitle}>{t('parami.insightsLockedTitle')}</Text>
            </View>
            <Text style={styles.lockedBody}>{t('parami.insightsLockedBody')}</Text>
          </CalmCard>
        </TouchableOpacity>
      ) : (
        <View style={styles.list}>
          {insights.map((insight, index) => {
            const action = getInsightAction(insight);
            return (
              <CalmCard key={`${insight.type}-${index}`} style={styles.insightCard}>
                <View style={styles.insightContent}>
                  {insight.emoji ? <Text style={styles.emoji}>{insight.emoji}</Text> : null}
                  <View style={styles.insightTextCol}>
                    <Text style={styles.message}>{insight.message}</Text>
                    <TouchableOpacity
                      onPress={() => router.push(action.route)}
                      activeOpacity={0.85}
                      style={styles.actionRow}
                      accessibilityRole="button"
                      accessibilityLabel={t(action.labelKey)}
                    >
                      <Text style={styles.actionLabel}>{t(action.labelKey)}</Text>
                      <ChevronRight size={16} color={THEME.colors.calm.lavenderDeep} />
                    </TouchableOpacity>
                  </View>
                </View>
              </CalmCard>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  lead: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
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
  insightTextCol: {
    flex: 1,
    gap: THEME.spacing.xs,
  },
  emoji: {
    fontSize: 22,
    marginTop: 2,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 2,
  },
  actionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  lockedCard: {
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  lockedTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  lockedBody: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
