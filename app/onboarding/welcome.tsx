import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { OnboardingFlowSteps } from '@/components/onboarding/OnboardingFlowSteps';
import { KoraaMascotAvatar } from '@/components/branding/KoraaMascotAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingForUser } from '@/lib/finishOnboarding';
import {
  goToHoyAfterOnboarding,
  ONBOARDING_EMOTION_ROUTE,
} from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';

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
      <View style={styles.mascot} accessibilityElementsHidden>
        <KoraaMascotAvatar size={112} variant="ellie" breathe />
      </View>
      <Text style={styles.brand}>{t('onboarding.welcome.brand')}</Text>
      <Text style={onboardingTypography.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.welcome.titleAccent')}</Text>
      <Text style={styles.lead}>{t('onboarding.welcome.subtitle')}</Text>
      <OnboardingFlowSteps />
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  mascot: {
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
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
    marginBottom: THEME.spacing.md,
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
