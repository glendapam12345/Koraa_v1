import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';

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
            <TouchableOpacity
              style={styles.lockOverlay}
              onPress={() => openPaywall(router, paywallReturnTo)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={t('parami.patternUnlockA11y')}
            >
              <View style={styles.lockIconWrap}>
                <Lock size={16} color={THEME.colors.calm.lavenderDeep} />
              </View>
              <Text style={styles.lockHint}>{t('parami.patternUnlockHint')}</Text>
            </TouchableOpacity>
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: 'rgba(248, 245, 252, 0.55)',
    borderRadius: THEME.borderRadius.standard,
  },
  lockIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  lockHint: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
