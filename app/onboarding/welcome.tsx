import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingForUser } from '@/lib/finishOnboarding';
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
    router.replace('/(tabs)');
  };

  return (
    <OnboardingScreenShell
      footer={
        <>
          <CalmPrimaryButton
            label={t('onboarding.welcome.quickStart')}
            onPress={() => router.push('/onboarding/emotion')}
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
      <View style={onboardingTypography.iconContainer}>
        <View style={onboardingTypography.iconCircle}>
          <Sparkles size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

      <Text style={onboardingTypography.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.welcome.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.welcome.subtitle')}</Text>

      <OnboardingHighlightCard
        title={t('onboarding.howItWorks.adaptTitle')}
        body={t('onboarding.welcome.description')}
      />
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  secondaryButton: {
    marginTop: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.sizes.touchTarget,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: THEME.colors.gradient.blue,
  },
  secondaryText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
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
