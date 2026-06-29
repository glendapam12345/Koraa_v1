import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { LayoutGrid, HeartHandshake, PenLine, Heart, Route } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingForUser } from '@/lib/finishOnboarding';
import { goToOnboardingPaywall, ONBOARDING_AREAS_ROUTE } from '@/lib/onboardingNavigation';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const SETUP_STEPS = [
  {
    icon: LayoutGrid,
    titleKey: 'onboarding.setupFlow.step1Title',
    bodyKey: 'onboarding.setupFlow.step1Body',
  },
  {
    icon: HeartHandshake,
    titleKey: 'onboarding.setupFlow.step2Title',
    bodyKey: 'onboarding.setupFlow.step2Body',
  },
  {
    icon: PenLine,
    titleKey: 'onboarding.setupFlow.step3Title',
    bodyKey: 'onboarding.setupFlow.step3Body',
  },
  {
    icon: Heart,
    titleKey: 'onboarding.setupFlow.step4Title',
    bodyKey: 'onboarding.setupFlow.step4Body',
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
    goToOnboardingPaywall();
  };

  return (
    <OnboardingScreenShell
      footer={
        <>
          <CalmPrimaryButton
            label={t('onboarding.howItWorks.startCheckIn')}
            onPress={() => router.push(ONBOARDING_AREAS_ROUTE)}
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
      <View style={onboardingTypography.iconContainer}>
        <View style={onboardingTypography.iconCircle}>
          <Route size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

      <Text style={onboardingTypography.title}>{t('onboarding.howItWorks.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.howItWorks.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.howItWorks.subtitle')}</Text>

      <View
        style={styles.steps}
        accessibilityRole="summary"
        accessibilityLabel={t('onboardingA11y.howItWorksStepsGroup')}
      >
        {SETUP_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
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
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <View style={styles.stepTitleRow}>
                  <Icon size={18} color={THEME.colors.gradient.blue} />
                  <Text style={styles.stepTitle}>{t(step.titleKey as TranslationKey)}</Text>
                </View>
                <Text style={styles.stepDesc}>{t(step.bodyKey as TranslationKey)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <OnboardingHighlightCard
        title={t('onboarding.setupFlow.dailyTitle')}
        body={t('onboarding.setupFlow.dailyBody')}
      />

      <OnboardingProgressDots total={4} activeIndex={3} style={styles.dotContainer} />
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  steps: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    ...THEME.shadows.soft,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  stepBody: {
    flex: 1,
    gap: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  stepDesc: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  dotContainer: {
    marginTop: THEME.spacing.lg,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    marginTop: THEME.spacing.sm,
  },
  secondaryText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
