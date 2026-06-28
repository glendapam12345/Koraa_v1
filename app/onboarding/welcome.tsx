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
import { ONBOARDING_AREAS_ROUTE } from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const PREVIEW_STEP_KEYS = [
  'onboarding.setupFlow.step1Title',
  'onboarding.setupFlow.step2Title',
  'onboarding.setupFlow.step3Title',
  'onboarding.setupFlow.step4Title',
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
    router.replace('/(tabs)');
  };

  return (
    <OnboardingScreenShell
      footer={
        <>
          <CalmPrimaryButton
            label={t('onboarding.welcome.quickStart')}
            onPress={() => router.push(ONBOARDING_AREAS_ROUTE)}
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
        title={t('onboarding.welcome.previewTitle')}
        body={t('onboarding.welcome.description')}
      />

      <View
        style={styles.previewList}
        accessibilityRole="summary"
        accessibilityLabel={t('onboardingA11y.howItWorksStepsGroup')}
      >
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
  previewList: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 6,
  },
  previewBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
