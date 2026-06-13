import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Sparkles, ArrowDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingCompleted } from '@/lib/onboardingGate';
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
    const { error } = await markOnboardingCompleted(user.id);
    setSkipLoading(false);
    if (error) {
      Alert.alert(t('errors.continueFailed'), t('errors.saveProgressFailed'));
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <OnboardingScreenShell>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Sparkles size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

      <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={styles.titleAccent}>{t('onboarding.welcome.titleAccent')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.welcome.subtitle')}</Text>

      <Text style={styles.description}>{t('onboarding.welcome.description')}</Text>

      <View style={styles.exampleContainer}>
        <View style={styles.exampleCard}>
          <View style={styles.exampleHeader}>
            <Text style={styles.exampleEmoji}>😔</Text>
            <Text style={styles.exampleTitle}>{t('onboarding.welcome.exampleExhausted')}</Text>
          </View>
          <Text style={styles.exampleSubtitle}>{t('onboarding.welcome.exampleEnergy', { n: 2 })}</Text>
          <View style={styles.exampleDivider} />
          <Text style={styles.exampleResult}>{t('onboarding.welcome.exampleResultLow')}</Text>
        </View>

        <View style={styles.arrowDown}>
          <ArrowDown size={20} color={THEME.colors.text.secondary} />
        </View>

        <View style={styles.exampleCard}>
          <View style={styles.exampleHeader}>
            <Text style={styles.exampleEmoji}>✨</Text>
            <Text style={styles.exampleTitle}>{t('onboarding.welcome.exampleMotivated')}</Text>
          </View>
          <Text style={styles.exampleSubtitle}>{t('onboarding.welcome.exampleEnergy', { n: 5 })}</Text>
          <View style={styles.exampleDivider} />
          <Text style={styles.exampleResult}>{t('onboarding.welcome.exampleResultHigh')}</Text>
        </View>
      </View>

      <CalmPrimaryButton
        label={t('onboarding.welcome.quickStart')}
        onPress={() => router.push('/onboarding/emotion')}
        accessibilityHint={t('onboarding.welcome.quickStartHint')}
      />

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/onboarding/intro2')}
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
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  title: {
    ...onboardingTypography.title,
    textAlign: 'center',
  },
  titleAccent: {
    ...onboardingTypography.titleAccent,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...onboardingTypography.subtitle,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  description: {
    ...onboardingTypography.body,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  exampleContainer: {
    marginBottom: THEME.spacing.lg,
  },
  exampleCard: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  exampleEmoji: {
    fontSize: 24,
  },
  exampleTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  exampleSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  exampleDivider: {
    height: 1,
    backgroundColor: THEME.colors.calm.border,
    marginVertical: THEME.spacing.sm,
  },
  exampleResult: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  arrowDown: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
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
