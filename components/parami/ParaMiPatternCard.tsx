import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';
import { ParaMiChartInsightFooter } from '@/components/parami/ParaMiChartInsightFooter';
import type { ParamiChartInsight } from '@/lib/paramiChartInsights';

type ParaMiPatternCardProps = {
  title: string;
  body: string;
  locked?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  chartSize?: 'week' | 'fortnight' | 'month';
  /** Pie estilo Musa: cifra + interpretación personal. */
  insight?: ParamiChartInsight | null;
  children?: ReactNode;
  paywallReturnTo?: string;
};

export function ParaMiPatternCard({
  title,
  body,
  locked = false,
  empty = false,
  emptyMessage,
  children,
  chartSize = 'week',
  insight = null,
  paywallReturnTo = '/(tabs)/parami',
}: ParaMiPatternCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      {locked ? (
        <View style={styles.lockRow} accessibilityElementsHidden>
          <Lock size={14} color={THEME.colors.calm.lavenderDeep} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {empty ? (
        <Text style={styles.empty}>{emptyMessage ?? t('parami.patternsNeedCheckIns')}</Text>
      ) : (
        <>
          <View
            style={[
              styles.chartWrap,
              chartSize === 'fortnight' && styles.chartWrapFortnight,
              chartSize === 'month' && styles.chartWrapMonth,
            ]}
          >
            <View style={locked ? styles.chartDimmed : undefined}>{children}</View>
            {locked ? (
              <PremiumLockOverlay
                onPress={() => openPaywall(router, paywallReturnTo)}
                accessibilityLabel={t('parami.patternUnlockA11y')}
                hint={t('parami.patternUnlockHint')}
                tone="surface"
              />
            ) : null}
          </View>
          {!locked && insight ? <ParaMiChartInsightFooter insight={insight} /> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 148,
  },
  lockRow: {
    alignItems: 'center',
  },
  title: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  body: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  empty: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
  },
  chartWrap: {
    position: 'relative',
    minHeight: 64,
    marginTop: THEME.spacing.xs,
  },
  chartWrapFortnight: {
    minHeight: 88,
  },
  chartWrapMonth: {
    minHeight: 104,
  },
  chartDimmed: {
    opacity: 0.45,
  },
});
