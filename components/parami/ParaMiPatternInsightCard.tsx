import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { goToHoyTab } from '@/lib/tabNavigation';
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
  /** Menos altura — debajo de los gráficos de patrón. */
  compact?: boolean;
};

/** Correlación ánimo × cierres + CTA a Hoy (hero o compacto). */
export function ParaMiPatternInsightCard({
  insight,
  loading = false,
  compact = false,
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
      goToHoyTab();
    })();
  };

  return (
    <LinearGradient
      colors={[...THEME.colors.parami.moodCard, THEME.colors.calm.mist]}
      start={{ x: 0.12, y: 0 }}
      end={{ x: 0.92, y: 1 }}
      style={[styles.hero, compact && styles.heroCompact, isWork && styles.heroWork]}
      accessibilityRole="summary"
    >
      <View style={styles.eyebrowRow}>
        {isWork ? (
          <Sparkles size={compact ? 12 : 14} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
        ) : null}
        <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>
          {insight.correlationLabel
            ? insight.correlationLabel
            : isWork
              ? t('parami.patternInsightWorkEyebrow')
              : t('parami.patternInsightEyebrow')}
        </Text>
      </View>

      {insight.fromAi && !compact ? (
        <View style={styles.aiPill}>
          <Text style={styles.aiPillText}>{t('parami.patternInsightAiBadge')}</Text>
        </View>
      ) : null}

      {insight.headline ? (
        <Text style={[styles.headline, compact && styles.headlineCompact]} numberOfLines={compact ? 2 : undefined}>
          {insight.headline}
        </Text>
      ) : null}

      {insight.summary ? (
        <Text
          style={[styles.summary, compact && styles.summaryCompact]}
          numberOfLines={compact ? 2 : undefined}
        >
          {insight.summary}
        </Text>
      ) : null}

      {!compact ? (
        <>
          <Text style={styles.patternLabel}>{t('parami.patternInsightPatternLabel')}</Text>
          <Text style={styles.patternNote}>{insight.patternNote}</Text>
        </>
      ) : (
        <Text style={styles.patternNoteCompact} numberOfLines={3}>
          {insight.patternNote}
        </Text>
      )}

      {!compact ? (
        <>
          <View style={styles.tipRule} />
          <Text style={styles.tipLabel}>{t('parami.patternInsightTipLabel')}</Text>
          <Text style={styles.gentleTip}>{insight.gentleTip}</Text>
        </>
      ) : (
        <Text style={styles.gentleTipCompact} numberOfLines={2}>
          {insight.gentleTip}
        </Text>
      )}

      <View style={[styles.ctaWrap, compact && styles.ctaWrapCompact]}>
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
  heroCompact: {
    alignItems: 'flex-start',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    gap: 6,
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
  eyebrowCompact: {
    textAlign: 'left',
    fontSize: 11,
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
  headlineCompact: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'left',
    marginTop: 0,
    marginBottom: 0,
  },
  summary: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: THEME.spacing.sm,
  },
  summaryCompact: {
    textAlign: 'left',
    maxWidth: undefined,
    marginBottom: 0,
    lineHeight: 18,
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
  patternNoteCompact: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    textAlign: 'left',
    fontFamily: THEME.fonts.heading.medium,
    maxWidth: undefined,
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
  gentleTipCompact: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    textAlign: 'left',
    fontFamily: THEME.fonts.accent.italic,
    maxWidth: undefined,
  },
  ctaWrap: {
    alignSelf: 'stretch',
    marginTop: THEME.spacing.sm,
  },
  ctaWrapCompact: {
    marginTop: THEME.spacing.xs,
  },
});
