import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingForUser } from '@/lib/finishOnboarding';
import {
  goToHoyAfterOnboarding,
  ONBOARDING_EMOTION_ROUTE,
} from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const RHYTHM_KEYS = [
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
      centered
      footer={
        <>
          <CalmPrimaryButton
            label={t('onboarding.welcome.quickStart')}
            onPress={() => router.push(ONBOARDING_EMOTION_ROUTE)}
            large
            accessibilityHint={t('onboarding.welcome.quickStartHint')}
          />
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
      <Text style={styles.brand}>{t('onboarding.welcome.brand')}</Text>
      <Text style={onboardingTypography.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.welcome.titleAccent')}</Text>
      <Text style={styles.lead}>{t('onboarding.welcome.subtitle')}</Text>

      <View
        style={styles.rhythm}
        accessibilityRole="summary"
        accessibilityLabel={t('onboardingA11y.howItWorksStepsGroup')}
      >
        <Text style={styles.rhythmTitle}>{t('onboarding.welcome.howItWorksTitle')}</Text>
        {RHYTHM_KEYS.map((key, index) => (
          <Text key={key} style={styles.rhythmLine}>
            {index + 1}. {t(key as TranslationKey)}
          </Text>
        ))}
        <Text style={styles.rhythmHint}>{t('onboarding.welcome.howItWorksHint')}</Text>
      </View>
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: THEME.spacing.sm,
  },
  lead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
  },
  rhythm: {
    gap: 6,
    paddingTop: THEME.spacing.sm,
  },
  rhythmTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  rhythmLine: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
  },
  rhythmHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    lineHeight: 20,
  },
  skipButton: {
    marginTop: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.sizes.touchTarget,
    padding: THEME.spacing.sm,
  },
  skipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
