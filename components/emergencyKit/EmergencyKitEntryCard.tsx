import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
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
          <TouchableOpacity
            style={[styles.lockedCta, compact && styles.lockedCtaCompact]}
            onPress={handleUnlock}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('emergencyKit.entryLockedA11y')}
            accessibilityHint={t('paramiExtra.a11yUnlockHint')}
          >
            <Lock size={compact ? 14 : 16} color={THEME.colors.onGradient} />
            <Text style={[styles.lockedCtaText, compact && styles.lockedCtaTextCompact]}>
              {t('emergencyKit.entryLockedCta')}
            </Text>
          </TouchableOpacity>
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
    color: THEME.colors.onGradient,
  },
  titleCompact: {
    ...THEME.typography.subheading,
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
  lockedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.surfaceOverlay.washLight,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.glassBorderFaint,
    minHeight: THEME.sizes.touchTarget,
  },
  lockedCtaCompact: {
    alignSelf: 'stretch',
    paddingVertical: 10,
  },
  lockedCtaText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  lockedCtaTextCompact: {
    ...THEME.typography.small,
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
