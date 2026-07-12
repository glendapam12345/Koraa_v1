import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Heart } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingForUser } from '@/lib/finishOnboarding';
import {
  goToHoyAfterOnboarding,
  ONBOARDING_EMOTION_ROUTE,
} from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const PREVIEW_STEP_KEYS = [
  'onboarding.setupFlow.stepFeelTitle',
  'onboarding.setupFlow.stepPlanTitle',
  'onboarding.setupFlow.stepRestTitle',
] as const;

export default function WelcomeScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [skipLoading, setSkipLoading] = useState(false);

  const handleSkipIntro = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    setSkipLoading(true);
    const { error } = await completeOnboardingForUser(user.id);
    setSkipLoading(false);
    if (error) {
      Alert.alert(t('errors.continueFailed'), t('errors.saveProgressFailed'));
      return;
    }
    await goToHoyAfterOnboarding(user.id);
  };

  return (
    <OnboardingScreenShell
      ethereal
      footer={
        <>
          <CalmPrimaryButton
            label={t('onboarding.welcome.quickStart')}
            onPress={() => router.push(ONBOARDING_EMOTION_ROUTE)}
            large
            accessibilityHint={t('onboarding.welcome.quickStartHint')}
          />
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/onboarding/how-it-works')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.welcome.seeHowItWorks')}
            accessibilityHint={t('onboardingA11y.welcomeSeeHowHint')}
          >
            <Text style={styles.secondaryText}>{t('onboarding.welcome.seeHowItWorks')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => void handleSkipIntro()}
            disabled={skipLoading}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.welcome.skip')}
            accessibilityHint={t('onboardingA11y.skipIntroHint')}
            accessibilityState={{ disabled: skipLoading, busy: skipLoading }}
          >
            {skipLoading ? (
              <ActivityIndicator color={THEME.colors.text.secondary} />
            ) : (
              <Text style={styles.skipText}>{t('onboarding.welcome.skip')}</Text>
            )}
          </TouchableOpacity>
        </>
      }
    >
      <View style={styles.heroOrbWrap} accessibilityElementsHidden>
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroOrb}
        >
          <Heart size={36} color={THEME.colors.onGradient} strokeWidth={2} fill="rgba(255,255,255,0.25)" />
        </LinearGradient>
      </View>

      <Text style={styles.brand}>{t('onboarding.welcome.brand')}</Text>
      <Text style={onboardingTypography.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.welcome.titleAccent')}</Text>
      <Text style={[onboardingTypography.subtitle, styles.lead]}>
        {t('onboarding.welcome.subtitle')}
      </Text>

      <View
        style={styles.previewCard}
        accessibilityRole="summary"
        accessibilityLabel={t('onboardingA11y.howItWorksStepsGroup')}
      >
        <Text style={styles.previewTitle}>{t('onboarding.welcome.previewTitle')}</Text>
        {PREVIEW_STEP_KEYS.map((key, index) => (
          <View key={key} style={styles.previewRow}>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.previewLabel}>{t(key as TranslationKey)}</Text>
          </View>
        ))}
      </View>
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  heroOrbWrap: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  heroOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.soft,
  },
  brand: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: THEME.spacing.xs,
  },
  lead: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
    lineHeight: 24,
  },
  previewCard: {
    marginTop: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  previewTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 6,
  },
  previewBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBadgeText: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  previewLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
    lineHeight: 22,
  },
  secondaryButton: {
    marginTop: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.sizes.touchTarget,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  secondaryText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  skipButton: {
    marginTop: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.sizes.touchTarget,
    padding: THEME.spacing.sm,
  },
  skipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
});
