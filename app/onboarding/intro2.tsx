import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Wind } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingCompleted } from '@/lib/onboardingGate';
import { useI18n } from '@/contexts/I18nContext';

export default function Intro2Screen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [skipLoading, setSkipLoading] = useState(false);

  const handleSkipIntro = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    setSkipLoading(true);
    const { error } = await markOnboardingCompleted(user.id);
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
            label={t('onboarding.intro2.continue')}
            onPress={() => router.push('/onboarding/how-it-works')}
            accessibilityHint={t('onboardingA11y.intro2ContinueHint')}
          />
          <TouchableOpacity
            onPress={handleSkipIntro}
            style={styles.skipButton}
            disabled={skipLoading}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.intro2.skip')}
            accessibilityHint={t('onboardingA11y.skipIntroHint')}
            accessibilityState={{ disabled: skipLoading, busy: skipLoading }}
          >
            {skipLoading ? (
              <ActivityIndicator size="small" color={THEME.colors.gradient.blue} />
            ) : (
              <Text style={styles.skipText}>{t('onboarding.intro2.skip')}</Text>
            )}
          </TouchableOpacity>
        </>
      }
    >
      <View style={onboardingTypography.iconContainer}>
        <View style={onboardingTypography.iconCircle}>
          <Wind size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

      <Text style={onboardingTypography.title}>{t('onboarding.intro2.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.intro2.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.intro2.subtitle')}</Text>

      <View
        style={styles.previewContainer}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        accessibilityLabel={t('onboardingA11y.previewDecorative')}
      >
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{t('onboarding.intro2.previewTitle')}</Text>
          </View>
          <View style={styles.previewInput}>
            <Text style={styles.previewInputText}>{t('onboarding.intro2.preview')}</Text>
          </View>
          <View style={styles.previewExamples}>
            <View style={styles.previewExampleItem}>
              <Text style={styles.previewExampleText}>{t('onboarding.intro2.example1')}</Text>
            </View>
            <View style={styles.previewExampleItem}>
              <Text style={styles.previewExampleText}>{t('onboarding.intro2.example2')}</Text>
            </View>
            <View style={styles.previewExampleItem}>
              <Text style={styles.previewExampleText}>{t('onboarding.intro2.example3')}</Text>
            </View>
          </View>
          <View style={styles.previewFooter}>
            <Text style={styles.previewFooterText}>{t('onboarding.intro2.saveTask')}</Text>
          </View>
        </View>
      </View>

      <OnboardingProgressDots total={3} activeIndex={1} style={styles.dotContainer} />
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xl,
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
  previewContainer: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  previewCard: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  previewHeader: {
    marginBottom: THEME.spacing.md,
  },
  previewTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  previewInput: {
    backgroundColor: THEME.colors.calm.background,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    minHeight: 60,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  previewInputText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
  },
  previewExamples: {
    marginBottom: THEME.spacing.md,
  },
  previewExampleItem: {
    marginBottom: THEME.spacing.xs,
  },
  previewExampleText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  previewFooter: {
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    alignItems: 'center',
  },
  previewFooterText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
