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
  /** Oculta el bloque si ya hay hero de patrón (1 insight a la vez). */
  hidden?: boolean;
};

/** Un solo insight hero — sin lista competitiva. */
export function ParaMiInsights({
  insights,
  locked,
  hasEnoughData,
  loading,
  hidden = false,
}: ParaMiInsightsProps) {
  const { t } = useI18n();
  const primary = insights[0];

  if (hidden || loading || locked) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('paramiExtra.a11yInsightsSection')}
    >
      {!hasEnoughData || !primary ? (
        <Text style={styles.empty}>{t('parami.noInsightYet')}</Text>
      ) : (
        <CalmCard style={styles.card}>
          <Text style={styles.eyebrow}>{t('parami.insightHeroEyebrow')}</Text>
          <View style={styles.row}>
            {primary.emoji ? (
              <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
                {primary.emoji}
              </Text>
            ) : null}
            <Text style={styles.message}>{primary.message}</Text>
          </View>
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
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  emoji: {
    fontSize: THEME.typography.body.fontSize,
    lineHeight: 22,
    width: 22,
    textAlign: 'center',
    marginTop: 1,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
    flex: 1,
  },
});
