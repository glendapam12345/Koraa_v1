import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type YoPatternCardProps = {
  title: string;
  subtitle: string;
  locked: boolean;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export function YoPatternCard({
  title,
  subtitle,
  locked,
  children,
  empty,
  emptyMessage,
}: YoPatternCardProps) {
  const { t } = useI18n();

  const openPaywall = () => router.push('/paywall');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {locked ? (
          <View style={styles.premiumBadge}>
            <Crown size={12} color={THEME.colors.gradient.blue} />
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {empty ? (
        <Text style={styles.emptyText}>{emptyMessage ?? t('yo.patternsNeedData')}</Text>
      ) : (
        <View style={styles.chartWrap}>
          <View style={locked ? styles.chartLocked : undefined}>{children}</View>
          {locked ? (
            <TouchableOpacity
              style={styles.lockOverlay}
              onPress={openPaywall}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={t('yo.patternLockedCta')}
            >
              <View style={styles.lockIconWrap}>
                <Lock size={22} color={THEME.colors.gradient.blue} />
              </View>
              <Text style={styles.lockTitle}>{t('yo.patternLockedTitle')}</Text>
              <Text style={styles.lockCta}>{t('yo.patternLockedCta')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  premiumBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  chartWrap: {
    position: 'relative',
    minHeight: 56,
  },
  chartLocked: {
    opacity: 0.28,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceOverlay.light,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
  },
  lockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  lockTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  lockCta: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: 4,
  },
  emptyText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
  },
});
