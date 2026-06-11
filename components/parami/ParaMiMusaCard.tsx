import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';

type ParaMiMusaCardProps = {
  colors: readonly [string, string];
  title: string;
  body: string;
  locked: boolean;
  /** Altura del área de gráfica según periodo. */
  chartSize?: 'week' | 'fortnight' | 'month';
  paywallReturnTo?: string;
  children?: ReactNode;
};

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
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
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
            <TouchableOpacity
              style={styles.lockOverlay}
              onPress={() => openPaywall(router, paywallReturnTo)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={t('parami.patternUnlockA11y')}
            >
              <View style={styles.lockIconWrap}>
                <Lock size={20} color={THEME.colors.calm.lavenderDeep} />
              </View>
              <Text style={styles.lockHint}>{t('parami.patternUnlockHint')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  card: {
    borderRadius: THEME.borderRadius.card,
    padding: THEME.spacing.md,
    minHeight: 168,
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  title: {
    ...THEME.typography.h2,
    fontSize: 22,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.sm,
  },
  chartWrap: {
    position: 'relative',
    minHeight: 96,
    marginBottom: THEME.spacing.xs,
  },
  chartWrapFortnight: {
    minHeight: 168,
  },
  chartWrapMonth: {
    minHeight: 248,
  },
  chartLocked: {
    opacity: 0.55,
  },
  chartOpen: {},
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: THEME.borderRadius.standard,
  },
  lockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  lockHint: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.medium,
  },
});
