import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';
import { ParaMiChartInsightFooter } from '@/components/parami/ParaMiChartInsightFooter';
import type { ParamiChartInsight } from '@/lib/paramiChartInsights';

type ParaMiMusaCardProps = {
  colors: readonly [string, string];
  title: string;
  body: string;
  locked: boolean;
  chartSize?: 'week' | 'fortnight' | 'month';
  paywallReturnTo?: string;
  /** Pie estilo Musa: cifra + interpretación personal. */
  insight?: ParamiChartInsight | null;
  /** Menos padding y sin subtítulo largo — Para mí. */
  compact?: boolean;
  children?: ReactNode;
};

/** Card de patrón visual — tipografía unificada (cardTitle + caption). */
export function ParaMiMusaCard({
  colors,
  title,
  body,
  locked,
  chartSize = 'week',
  paywallReturnTo = '/(tabs)/parami',
  insight = null,
  compact = false,
  children,
}: ParaMiMusaCardProps) {
  const { t } = useI18n();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${body}${locked ? t('paramiExtra.a11yCardLockedSuffix') : ''}`}
    >
      <LinearGradient
        colors={[colors[0], colors[1], THEME.colors.calm.mist]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.card, compact && styles.cardCompact]}
      >
        {locked ? (
          <View style={styles.lockRow} accessibilityElementsHidden>
            <Lock size={14} color={THEME.colors.calm.lavenderDeep} />
          </View>
        ) : null}
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        {!compact ? <Text style={styles.body}>{body}</Text> : null}
        <View
          style={[
            styles.chartWrap,
            compact && styles.chartWrapCompact,
            chartSize === 'fortnight' && styles.chartWrapFortnight,
            chartSize === 'month' && styles.chartWrapMonth,
            compact && chartSize === 'fortnight' && styles.chartWrapFortnightCompact,
            compact && chartSize === 'month' && styles.chartWrapMonthCompact,
          ]}
        >
          <View style={locked ? styles.chartLocked : styles.chartOpen}>{children}</View>
          {locked ? (
            <PremiumLockOverlay
              onPress={() => openPaywall(router, paywallReturnTo)}
              accessibilityLabel={t('parami.patternUnlockA11y')}
              hint={t('parami.patternUnlockHint')}
              tone="gradient"
            />
          ) : null}
        </View>
        {!locked && insight ? (
          <ParaMiChartInsightFooter insight={insight} compact={compact} />
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  card: {
    borderRadius: THEME.borderRadius.xl,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    minHeight: 168,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: THEME.spacing.xs,
  },
  cardCompact: {
    minHeight: 0,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    gap: 6,
  },
  lockRow: {
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  titleCompact: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'left',
  },
  body: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  chartWrap: {
    position: 'relative',
    minHeight: 72,
    marginTop: THEME.spacing.xs,
  },
  chartWrapCompact: {
    minHeight: 56,
    marginTop: 0,
  },
  chartWrapFortnight: {
    minHeight: 96,
  },
  chartWrapMonth: {
    minHeight: 112,
  },
  chartWrapFortnightCompact: {
    minHeight: 72,
  },
  chartWrapMonthCompact: {
    minHeight: 88,
  },
  chartLocked: {
    opacity: 0.5,
  },
  chartOpen: {},
});
