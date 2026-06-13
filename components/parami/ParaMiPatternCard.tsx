import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';

type ParaMiPatternCardProps = {
  title: string;
  body: string;
  locked?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  chartSize?: 'week' | 'fortnight' | 'month';
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
  paywallReturnTo = '/(tabs)/parami',
}: ParaMiPatternCardProps) {
  const { t } = useI18n();

  return (
    <CalmCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {empty ? (
        <Text style={styles.empty}>{emptyMessage ?? t('parami.patternsNeedCheckIns')}</Text>
      ) : (
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
      )}
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  body: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  empty: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginTop: THEME.spacing.xs,
  },
  chartWrap: {
    position: 'relative',
    minHeight: 56,
    marginTop: 4,
  },
  chartWrapFortnight: {
    minHeight: 80,
  },
  chartWrapMonth: {
    minHeight: 96,
  },
  chartDimmed: {
    opacity: 0.45,
  },
});
