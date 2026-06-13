import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';
import { openEmergencyKit } from '@/lib/emergencyKitNavigation';
import { openPaywall } from '@/lib/paywallNavigation';
import { useCrisisMode } from '@/hooks/useCrisisMode';

type EmergencyKitEntryCardProps = {
  /** Tarjeta más pequeña para Para mí (debajo de consejos). */
  compact?: boolean;
};

export function EmergencyKitEntryCard({ compact = false }: EmergencyKitEntryCardProps) {
  const { t } = useI18n();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const { lastSession } = useCrisisMode();
  const locked = !subscriptionLoading && !isSubscribed;

  const handleOpen = () => {
    if (subscriptionLoading) return;
    openEmergencyKit(isSubscribed, lastSession, router);
  };

  const handleUnlock = () => {
    if (subscriptionLoading) return;
    openPaywall(router, '/emergency-kit');
  };

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${t('emergencyKit.entryTitle')}. ${t('emergencyKit.entrySubtitle')}${
        locked ? t('paramiExtra.a11yCardLockedSuffix') : ''
      }`}
    >
      <LinearGradient
        colors={[...THEME.colors.emergencyKit.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, compact && styles.cardCompact]}
      >
        <Text style={[styles.title, compact && styles.titleCompact]}>{t('emergencyKit.entryTitle')}</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
          {t('emergencyKit.entrySubtitle')}
        </Text>

        {locked ? (
          <View style={[styles.lockedArea, compact && styles.lockedAreaCompact]}>
            <View style={styles.lockedPreview} />
            <PremiumLockOverlay
              onPress={handleUnlock}
              accessibilityLabel={t('emergencyKit.entryLockedA11y')}
              hint={t('parami.patternUnlockHint')}
              iconSize={20}
              tone="gradient"
            />
          </View>
        ) : (
          <View style={styles.actions}>
            <CalmPrimaryButton
              label={t('emergencyKit.entryCta')}
              onPress={handleOpen}
              disabled={subscriptionLoading}
              variant="soft"
              large={!compact}
              accessibilityHint={t('emergencyKit.entryCtaHint')}
            />
            {lastSession ? (
              <TouchableOpacity
                onPress={() => openEmergencyKit(isSubscribed, lastSession, router, { resume: true })}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('emergencyKit.resumeSessionA11y', {
                  event: t(`emergencyKit.events.${lastSession.eventId}`),
                })}
                style={styles.resumeLink}
              >
                <Text style={styles.resumeText}>
                  {t('emergencyKit.resumeSession', {
                    event: t(`emergencyKit.events.${lastSession.eventId}`),
                  })}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.card,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  cardCompact: {
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.rounded,
  },
  title: {
    ...THEME.typography.h2,
    fontSize: 24,
    color: THEME.colors.fill[100],
  },
  titleCompact: {
    ...THEME.typography.h3,
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    lineHeight: 22,
    marginBottom: THEME.spacing.xs,
  },
  subtitleCompact: {
    ...THEME.typography.caption,
    lineHeight: 20,
    marginBottom: 0,
  },
  lockedArea: {
    position: 'relative',
    minHeight: THEME.sizes.touchTarget + THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  lockedAreaCompact: {
    minHeight: THEME.sizes.touchTarget,
    marginTop: 0,
  },
  lockedPreview: {
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    opacity: 0.55,
  },
  actions: {
    gap: THEME.spacing.xs,
  },
  resumeLink: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  resumeText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.medium,
    textDecorationLine: 'underline',
  },
});
