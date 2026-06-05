import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type ParaMiMusaCardProps = {
  colors: readonly [string, string];
  title: string;
  body: string;
  locked: boolean;
  children?: ReactNode;
};

export function ParaMiMusaCard({
  colors,
  title,
  body,
  locked,
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
          style={styles.chartWrap}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={locked}
        >
          <View style={locked ? styles.chartLocked : styles.chartOpen}>{children}</View>
        </View>
        {locked ? (
          <Text style={styles.lockedFootnote}>{t('parami.lockedPremiumHint')}</Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.sm,
  },
  card: {
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    minHeight: 200,
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
  chartLocked: {
    opacity: 0.55,
  },
  chartOpen: {},
  lockedFootnote: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradientFaint,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
});
