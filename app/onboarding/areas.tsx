import { View, Text, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import {
  OnboardingAreasSkipLink,
  OnboardingLifeAreasList,
  useOnboardingLifeAreasForm,
} from '@/components/onboarding/OnboardingLifeAreasForm';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { LayoutGrid } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  saveDefaultOnboardingLifeAreasForUser,
  saveOnboardingLifeAreasForUser,
} from '@/lib/finishOnboarding';
import { ONBOARDING_ACTIVITIES_ROUTE } from '@/lib/onboardingNavigation';

export default function OnboardingAreasScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const { selections, enabledCount, toggleArea, setExamples } = useOnboardingLifeAreasForm();

  const goToActivities = () => {
    router.push(ONBOARDING_ACTIVITIES_ROUTE);
  };

  const saveAndContinue = async (useDefaults: boolean) => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    if (!useDefaults && enabledCount === 0) {
      Alert.alert(t('onboarding.areas.minOneArea'));
      return;
    }

    setSaving(true);
    const { error } = useDefaults
      ? await saveDefaultOnboardingLifeAreasForUser(user.id)
      : await saveOnboardingLifeAreasForUser(user.id, selections);
    setSaving(false);

    if (error) {
      Alert.alert(t('errors.continueFailed'), t('onboarding.areas.saveError'));
      return;
    }

    goToActivities();
  };

  return (
    <OnboardingScreenShell
      footer={
        <>
          <CalmPrimaryButton
            label={saving ? t('onboarding.areas.saving') : t('onboarding.areas.continue')}
            onPress={() => void saveAndContinue(false)}
            disabled={saving || enabledCount === 0}
            accessibilityHint={t('onboardingA11y.areasContinueHint')}
            accessibilityState={{ disabled: saving || enabledCount === 0, busy: saving }}
          />
          <OnboardingAreasSkipLink
            label={t('onboarding.areas.skip')}
            disabled={saving}
            onPress={() => void saveAndContinue(true)}
          />
        </>
      }
    >
      <View style={onboardingTypography.iconContainer}>
        <View style={onboardingTypography.iconCircle}>
          <LayoutGrid size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

      <Text style={onboardingTypography.title}>{t('onboarding.areas.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.areas.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.areas.subtitle')}</Text>

      <OnboardingHighlightCard
        title={t('onboarding.areas.hint')}
        body={t('onboarding.areas.selectedCount', { count: enabledCount })}
      />

      <OnboardingLifeAreasList
        selections={selections}
        onToggleArea={toggleArea}
        onExamplesChange={setExamples}
      />
    </OnboardingScreenShell>
  );
}
