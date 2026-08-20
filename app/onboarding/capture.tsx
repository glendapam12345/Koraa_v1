import { Text, Alert, View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import {
  OnboardingCaptureField,
  OnboardingCaptureSkipLink,
} from '@/components/onboarding/OnboardingCaptureField';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { countOnboardingCaptureItems, saveOnboardingCaptureForUser } from '@/lib/onboardingCapture';
import { seedDefaultLifeAreasForUser } from '@/lib/finishOnboarding';
import { ONBOARDING_EMOTION_ROUTE } from '@/lib/onboardingNavigation';

export default function OnboardingCaptureScreen() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [captureText, setCaptureText] = useState('');
  const [saving, setSaving] = useState(false);

  const hasContent = captureText.trim().length > 0;
  const parsedCount = countOnboardingCaptureItems(captureText, locale);

  const goToCheckIn = () => {
    router.push(ONBOARDING_EMOTION_ROUTE);
  };

  const skipCapture = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    await seedDefaultLifeAreasForUser(user.id);
    goToCheckIn();
  };

  const fillExample = () => {
    setCaptureText(t('onboarding.capture.exampleText'));
  };

  const saveAndContinue = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }

    if (!hasContent) {
      Alert.alert(t('onboarding.capture.emptyTitle'), t('onboarding.capture.emptyBody'));
      return;
    }

    setSaving(true);
    await seedDefaultLifeAreasForUser(user.id);
    const result = await saveOnboardingCaptureForUser(user.id, captureText, locale);
    setSaving(false);

    if (result.error) {
      Alert.alert(t('errors.continueFailed'), t('onboarding.capture.saveError'));
      return;
    }

    if (result.partialFailure) {
      Alert.alert(
        t('onboarding.capture.partialSaveTitle'),
        t('onboarding.capture.partialSaveBody', {
          saved: result.savedCount,
          total: result.attemptedCount,
        }),
        [{ text: t('errors.ok'), onPress: goToCheckIn }],
      );
      return;
    }

    if (result.savedCount === 0) {
      Alert.alert(t('onboarding.capture.emptyTitle'), t('onboarding.capture.emptyBody'));
      return;
    }

    goToCheckIn();
  };

  return (
    <OnboardingScreenShell
      footer={
        <View style={styles.footerCol}>
          <CalmPrimaryButton
            label={saving ? t('onboarding.capture.saving') : t('onboarding.capture.continue')}
            onPress={() => void saveAndContinue()}
            disabled={saving || !hasContent}
            loading={saving}
            large
            accessibilityHint={t('onboardingA11y.captureContinueHint')}
            accessibilityState={{ disabled: saving || !hasContent, busy: saving }}
          />
          <OnboardingCaptureSkipLink
            label={t('onboarding.capture.skip')}
            onPress={() => void skipCapture()}
            disabled={saving}
          />
        </View>
      }
    >
      <OnboardingProgressDots
        total={3}
        current={1}
        accessibilityLabel={t('onboarding.tour.guidedProgressA11y', { current: 1, total: 3 })}
      />
      <OnboardingCheckInProgress loopStep={1} />
      <OnboardingEllieCoach message={t('onboarding.ellie.capture')} mood="grateful" size={64} />
      <Text style={onboardingTypography.title}>{t('onboarding.capture.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.capture.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.capture.subtitle')}</Text>

      <OnboardingHighlightCard
        title={t('onboarding.capture.hintTitle')}
        body={
          parsedCount > 0
            ? t('onboarding.capture.hintBodyWithCount', { count: Math.min(parsedCount, 8) })
            : t('onboarding.capture.hintBody')
        }
      />

      <OnboardingCaptureField
        value={captureText}
        onChange={setCaptureText}
        locale={locale}
        editable={!saving}
      />

      {!hasContent ? (
        <CalmPrimaryButton
          label={t('onboarding.capture.exampleBtn')}
          variant="soft"
          onPress={fillExample}
          disabled={saving}
          accessibilityHint={t('onboarding.capture.exampleBtnHint')}
        />
      ) : null}
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  footerCol: {
    gap: THEME.spacing.xs,
  },
});
