import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

type ParaMiMusaCardProps = {
  colors: readonly [string, string];
  title: string;
  body: string;
  locked: boolean;
  onUnlock: () => void;
  unlockCta: string;
  children?: ReactNode;
};

export function ParaMiMusaCard({
  colors,
  title,
  body,
  locked,
  onUnlock,
  unlockCta,
  children,
}: ParaMiMusaCardProps) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        {locked ? (
          <View style={styles.lockBadge}>
            <Lock size={20} color={THEME.colors.onGradient} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <View style={locked ? styles.chartLocked : styles.chartOpen}>{children}</View>
        {locked ? (
          <TouchableOpacity
            style={styles.cta}
            onPress={onUnlock}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={unlockCta}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{unlockCta}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.lg,
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    minHeight: 220,
    ...THEME.shadows.soft,
  },
  lockBadge: {
    alignSelf: 'center',
    marginBottom: THEME.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: THEME.spacing.md,
  },
  chartLocked: {
    opacity: 0.35,
    marginBottom: THEME.spacing.md,
  },
  chartOpen: {
    marginBottom: THEME.spacing.md,
  },
  cta: {
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
  },
  ctaText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
