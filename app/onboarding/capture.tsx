import { View, Text, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import {
  OnboardingCaptureField,
  OnboardingCaptureSkipLink,
} from '@/components/onboarding/OnboardingCaptureField';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { PenLine } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { countOnboardingCaptureItems, saveOnboardingCaptureForUser } from '@/lib/onboardingCapture';
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

  const saveAndContinue = async (skipSave: boolean) => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }

    if (!skipSave && !hasContent) {
      Alert.alert(t('onboarding.capture.emptyTitle'), t('onboarding.capture.emptyBody'));
      return;
    }

    setSaving(true);
    const result = skipSave
      ? { error: null, savedCount: 0, attemptedCount: 0, partialFailure: false }
      : await saveOnboardingCaptureForUser(user.id, captureText, locale);
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

    goToCheckIn();
  };

  return (
    <OnboardingScreenShell
      footer={
        <>
          <CalmPrimaryButton
            label={saving ? t('onboarding.capture.saving') : t('onboarding.capture.continue')}
            onPress={() => void saveAndContinue(false)}
            disabled={saving || !hasContent}
            accessibilityHint={t('onboardingA11y.captureContinueHint')}
            accessibilityState={{ disabled: saving || !hasContent, busy: saving }}
          />
          <OnboardingCaptureSkipLink
            label={t('onboarding.capture.skip')}
            disabled={saving}
            onPress={() => void saveAndContinue(true)}
          />
        </>
      }
    >
      <View style={onboardingTypography.iconContainer}>
        <View style={onboardingTypography.iconCircle}>
          <PenLine size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

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
    </OnboardingScreenShell>
  );
}
