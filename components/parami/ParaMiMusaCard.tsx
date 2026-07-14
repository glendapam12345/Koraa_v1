import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';

type ParaMiMusaCardProps = {
  colors: readonly [string, string];
  title: string;
  body: string;
  locked: boolean;
  chartSize?: 'week' | 'fortnight' | 'month';
  paywallReturnTo?: string;
  children?: ReactNode;
};

/** Card de patrón visual — centrada, aireosa, mist + acento suave. */
export function ParaMiMusaCard({
  colors,
  title,
  body,
  locked,
  chartSize = 'week',
  paywallReturnTo = '/(tabs)/parami',
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
        style={styles.card}
      >
        {locked ? (
          <View style={styles.lockRow} accessibilityElementsHidden>
            <Lock size={14} color={THEME.colors.calm.lavenderDeep} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <View
          style={[
            styles.chartWrap,
            chartSize === 'fortnight' && styles.chartWrapFortnight,
            chartSize === 'month' && styles.chartWrapMonth,
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
  lockRow: {
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  body: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  chartWrap: {
    position: 'relative',
    minHeight: 72,
    marginTop: THEME.spacing.xs,
  },
  chartWrapFortnight: {
    minHeight: 96,
  },
  chartWrapMonth: {
    minHeight: 112,
  },
  chartLocked: {
    opacity: 0.5,
  },
  chartOpen: {},
});
