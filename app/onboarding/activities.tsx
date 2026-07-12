import { Text, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import {
  OnboardingActivitiesPicker,
  OnboardingActivitiesSkipLink,
  useOnboardingActivitiesForm,
} from '@/components/onboarding/OnboardingActivitiesForm';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { saveOnboardingFavoriteActivitiesForUser } from '@/lib/finishOnboarding';
import { ONBOARDING_CAPTURE_ROUTE } from '@/lib/onboardingNavigation';

export default function OnboardingActivitiesScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const {
    activities,
    draft,
    setDraft,
    removeActivity,
    toggleSuggestion,
    isSuggestionSelected,
    submitDraft,
    atLimit,
  } = useOnboardingActivitiesForm();

  const goToCapture = () => {
    router.push(ONBOARDING_CAPTURE_ROUTE);
  };

  const saveAndContinue = async (skipSave: boolean) => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }

    setSaving(true);
    const { error } = skipSave
      ? { error: null }
      : await saveOnboardingFavoriteActivitiesForUser(user.id, activities);
    setSaving(false);

    if (error) {
      Alert.alert(t('errors.continueFailed'), t('onboarding.activities.saveError'));
      return;
    }

    goToCapture();
  };

  return (
    <OnboardingScreenShell
      footer={
        <>
          <CalmPrimaryButton
            label={saving ? t('onboarding.activities.saving') : t('onboarding.activities.continue')}
            onPress={() => void saveAndContinue(false)}
            disabled={saving}
            accessibilityHint={t('onboardingA11y.activitiesContinueHint')}
            accessibilityState={{ disabled: saving, busy: saving }}
          />
          <OnboardingActivitiesSkipLink
            label={t('onboarding.activities.skip')}
            disabled={saving}
            onPress={() => void saveAndContinue(true)}
          />
        </>
      }
    >
      <Text style={onboardingTypography.title}>{t('onboarding.activities.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.activities.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.activities.subtitle')}</Text>

      <OnboardingHighlightCard
        title={t('onboarding.activities.hintTitle')}
        body={t('onboarding.activities.hintBody')}
      />

      <OnboardingActivitiesPicker
        activities={activities}
        draft={draft}
        onDraftChange={setDraft}
        onSubmitDraft={submitDraft}
        onRemoveActivity={removeActivity}
        onToggleSuggestion={toggleSuggestion}
        isSuggestionSelected={isSuggestionSelected}
        atLimit={atLimit}
      />
    </OnboardingScreenShell>
  );
}
