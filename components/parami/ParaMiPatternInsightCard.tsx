import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import type { ParamiPatternInsightState } from '@/hooks/useParamiPatternInsight';
import { savePatternHoyApply } from '@/lib/patternHoyBridge';
import { track } from '@/lib/analytics';

type ParaMiPatternInsightCardProps = {
  insight: ParamiPatternInsightState | null;
  loading?: boolean;
};

/** Hero de patrón — correlación ánimo × cierres + CTA a Hoy. */
export function ParaMiPatternInsightCard({
  insight,
  loading = false,
}: ParaMiPatternInsightCardProps) {
  const { t } = useI18n();
  const isWork = insight?.source === 'work';

  if (loading && !insight) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
      </View>
    );
  }

  if (!insight) return null;

  const handleApply = () => {
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
      router.push('/(tabs)');
    })();
  };

  return (
    <LinearGradient
      colors={[...THEME.colors.parami.moodCard, THEME.colors.calm.mist]}
      start={{ x: 0.12, y: 0 }}
      end={{ x: 0.92, y: 1 }}
      style={[styles.hero, isWork && styles.heroWork]}
      accessibilityRole="summary"
    >
      <View style={styles.eyebrowRow}>
        {isWork ? (
          <Sparkles size={14} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
        ) : null}
        <Text style={styles.eyebrow}>
          {insight.correlationLabel
            ? insight.correlationLabel
            : isWork
              ? t('parami.patternInsightWorkEyebrow')
              : t('parami.patternInsightEyebrow')}
        </Text>
      </View>

      {insight.fromAi ? (
        <View style={styles.aiPill}>
          <Text style={styles.aiPillText}>{t('parami.patternInsightAiBadge')}</Text>
        </View>
      ) : null}

      {insight.headline ? <Text style={styles.headline}>{insight.headline}</Text> : null}

      {insight.summary ? <Text style={styles.summary}>{insight.summary}</Text> : null}

      <Text style={styles.patternLabel}>{t('parami.patternInsightPatternLabel')}</Text>
      <Text style={styles.patternNote}>{insight.patternNote}</Text>

      <View style={styles.tipRule} />
      <Text style={styles.tipLabel}>{t('parami.patternInsightTipLabel')}</Text>
      <Text style={styles.gentleTip}>{insight.gentleTip}</Text>

      <View style={styles.ctaWrap}>
        <CalmPrimaryButton
          label={t('parami.patternApplyHoyCta')}
          onPress={handleApply}
          variant="soft"
          accessibilityHint={t('parami.patternApplyHoyHint')}
        />
      </View>
    </LinearGradient>
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
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: THEME.spacing.xs,
  },
  heroWork: {
    borderColor: THEME.colors.tint.blue.border,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  aiPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  aiPillText: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  headline: {
    ...THEME.typography.sectionTitle,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  summary: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: THEME.spacing.sm,
  },
  patternLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  patternNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: THEME.fonts.heading.medium,
    maxWidth: 340,
  },
  tipRule: {
    width: 36,
    height: 1,
    backgroundColor: THEME.colors.calm.border,
    marginVertical: THEME.spacing.sm,
  },
  tipLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
  },
  gentleTip: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: THEME.fonts.accent.italic,
    maxWidth: 320,
  },
  ctaWrap: {
    alignSelf: 'stretch',
    marginTop: THEME.spacing.sm,
  },
});
