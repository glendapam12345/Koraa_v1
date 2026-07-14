import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

/** Entrada al kit — mist calmado, sin gradiente de presión. */
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
      style={[styles.card, compact && styles.cardCompact]}
    >
      <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>
        {t('emergencyKit.entryEyebrow')}
      </Text>
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
          <Lock size={compact ? 14 : 16} color={THEME.colors.calm.lavenderDeep} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  cardCompact: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  eyebrowCompact: {
    ...THEME.typography.meta,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  titleCompact: {
    ...THEME.typography.cardTitle,
    lineHeight: 22,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.xs,
  },
  subtitleCompact: {
    ...THEME.typography.meta,
    lineHeight: 18,
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
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    marginTop: THEME.spacing.xs,
  },
  lockedCtaCompact: {
    alignSelf: 'stretch',
    marginTop: 0,
  },
  lockedCtaText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  lockedCtaTextCompact: {
    ...THEME.typography.caption,
  },
  actions: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  resumeLink: {
    alignItems: 'center',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  resumeText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
