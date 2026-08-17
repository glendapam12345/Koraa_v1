import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { FeelingEnergyScale } from '@/components/checkin/FeelingEnergyScale';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboardingCheckInAndGoHoy } from '@/lib/completeOnboardingCheckIn';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

export default function EnergyScreen() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { emotion } = useLocalSearchParams<{ emotion: string }>();
  const [selectedEnergy, setSelectedEnergy] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
  };

  const finish = async (energyLevel: number) => {
    if (advanceRef.current) {
      clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
    if (!emotion || !user || finishingRef.current) return;
    if (energyLevel < 1 || energyLevel > 5) {
      showToast(t('onboarding.focus.invalidEnergy'), 'error');
      return;
    }

    finishingRef.current = true;
    setIsSaving(true);
    try {
      const emotionStored = emotion.trim().toLowerCase();
      const emotionLabel = t(`sentir.emotions.${emotionStored}` as TranslationKey);
      const result = await completeOnboardingCheckInAndGoHoy({
        user,
        emotion: emotionStored,
        energyLevel,
        locale,
        emotionLabel,
      });

      if (!result.success) {
        finishingRef.current = false;
        setIsSaving(false);
        showToast(result.errorMessage ?? t('onboarding.focus.saveCheckInError'), 'error');
        return;
      }

      if (result.offline) {
        showToast(t('onboarding.focus.savedOffline'), 'info');
      }

      if (result.onboardingMarkFailed) {
        showToast(t('onboarding.focus.closeOnboardingError'), 'info');
      }
    } catch {
      finishingRef.current = false;
      setIsSaving(false);
      showToast(t('onboarding.focus.genericError'), 'error');
    }
  };

  const handleSelect = (levelId: number) => {
    if (finishingRef.current) return;
    setSelectedEnergy(levelId);
    if (!emotion || !user) return;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    // Auto-avance suave: deja ver la selección y cierra el onboarding.
    advanceRef.current = setTimeout(() => {
      void finish(levelId);
    }, 520);
  };

  return (
    <>
      <OnboardingScreenShell
        footer={
          selectedEnergy > 0 ? (
            <CalmPrimaryButton
              label={isSaving ? t('onboarding.focus.saving') : t('onboarding.energy.continue')}
              onPress={() => void finish(selectedEnergy)}
              disabled={isSaving}
              loading={isSaving}
              large
              accessibilityHint={t('onboardingA11y.continueFocusHint')}
            />
          ) : null
        }
      >
        <OnboardingCheckInProgress loopStep={3} />
        <OnboardingEllieCoach message={t('onboarding.ellie.energy')} mood="happy" size={52} />
        <Text style={onboardingTypography.title}>{t('onboarding.energy.title')}</Text>
        <Text style={onboardingTypography.titleAccent}>{t('onboarding.energy.titleAccent')}</Text>
        <Text style={onboardingTypography.subtitle}>{t('onboarding.energy.subtitle')}</Text>

        <View style={styles.scaleWrap}>
          <FeelingEnergyScale
            value={selectedEnergy || 0}
            onChange={(levelId) => {
              if (isSaving) return;
              handleSelect(levelId);
            }}
          />
        </View>
        <Text style={styles.adaptHint}>{t('onboarding.energy.adaptHint')}</Text>
      </OnboardingScreenShell>

      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onHide={() => setToastMessage(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  scaleWrap: {
    marginTop: THEME.spacing.md,
  },
  adaptHint: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.accent.italic,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    lineHeight: 20,
  },
});
