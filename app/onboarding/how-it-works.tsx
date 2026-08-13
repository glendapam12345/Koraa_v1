import { Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { OnboardingFlowSteps } from '@/components/onboarding/OnboardingFlowSteps';
import { OnboardingValuePreview } from '@/components/onboarding/OnboardingValuePreview';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingForUser } from '@/lib/finishOnboarding';
import {
  goToHoyAfterOnboarding,
  ONBOARDING_EMOTION_ROUTE,
} from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';

export default function HowItWorksScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  const finishToApp = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    setSaving(true);
    const { error } = await completeOnboardingForUser(user.id);
    setSaving(false);
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
            label={t('onboarding.howItWorks.startCheckIn')}
            onPress={() => router.push(ONBOARDING_EMOTION_ROUTE)}
            large
            accessibilityHint={t('onboardingA11y.howItWorksCheckInHint')}
          />
          <TouchableOpacity
            onPress={() => void finishToApp()}
            disabled={saving}
            style={styles.secondaryBtn}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.howItWorks.enterApp')}
            accessibilityHint={t('onboardingA11y.howItWorksContinueHint')}
            accessibilityState={{ disabled: saving, busy: saving }}
          >
            <Text style={styles.secondaryText}>{t('onboarding.howItWorks.enterApp')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={onboardingTypography.title}>{t('onboarding.howItWorks.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.howItWorks.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.howItWorks.subtitle')}</Text>
      <OnboardingFlowSteps />
      <OnboardingValuePreview />
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    marginTop: THEME.spacing.sm,
  },
  secondaryText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
