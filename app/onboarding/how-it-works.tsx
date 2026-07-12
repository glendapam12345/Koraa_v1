import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingForUser } from '@/lib/finishOnboarding';
import {
  goToHoyAfterOnboarding,
  ONBOARDING_EMOTION_ROUTE,
} from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const SETUP_STEPS = [
  {
    titleKey: 'onboarding.setupFlow.stepFeelTitle',
    bodyKey: 'onboarding.setupFlow.stepFeelBody',
  },
  {
    titleKey: 'onboarding.setupFlow.stepPlanTitle',
    bodyKey: 'onboarding.setupFlow.stepPlanBody',
  },
  {
    titleKey: 'onboarding.setupFlow.stepRestTitle',
    bodyKey: 'onboarding.setupFlow.stepRestBody',
  },
] as const;

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

      <View
        style={styles.steps}
        accessibilityRole="summary"
        accessibilityLabel={t('onboardingA11y.howItWorksStepsGroup')}
      >
        {SETUP_STEPS.map((step, index) => (
          <View
            key={step.titleKey}
            style={styles.stepRow}
            accessible
            accessibilityRole="text"
            accessibilityLabel={t('onboardingA11y.flowStep', {
              step: index + 1,
              title: t(step.titleKey as TranslationKey),
              body: t(step.bodyKey as TranslationKey),
            })}
          >
            <Text style={styles.stepIndex}>{index + 1}</Text>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{t(step.titleKey as TranslationKey)}</Text>
              <Text style={styles.stepDesc}>{t(step.bodyKey as TranslationKey)}</Text>
            </View>
          </View>
        ))}
      </View>

      <OnboardingHighlightCard
        title={t('onboarding.setupFlow.dailyTitle')}
        body={t('onboarding.setupFlow.dailyBody')}
      />
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  steps: {
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  stepIndex: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    width: 20,
    marginTop: 2,
  },
  stepBody: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  stepDesc: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
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
