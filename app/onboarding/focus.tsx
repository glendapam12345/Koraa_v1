import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Toast } from '@/components/Toast';
import { Focus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { publishCheckInCelebration } from '@/lib/checkInCelebration';
import { goToOnboardingPaywall } from '@/lib/onboardingNavigation';
import { saveDailyCheckInAndPrioritize } from '@/lib/checkInService';
import { getDisplayName } from '@/lib/displayName';
import { markPrioritiesReadyToast } from '@/lib/prioritiesReadyToast';
import { markQuickOnboardingGuideSeen } from '@/lib/quickOnboardingGuide';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const FOCUS_OPTIONS: { id: string; labelKey: TranslationKey }[] = [
  { id: 'Muy distraída', labelKey: 'onboarding.focus.scattered' },
  { id: 'Algo distraída', labelKey: 'onboarding.focus.somewhat' },
  { id: 'Normal', labelKey: 'onboarding.focus.normal' },
  { id: 'Enfocada', labelKey: 'onboarding.focus.focused' },
  { id: 'Súper enfocada', labelKey: 'onboarding.focus.veryFocused' },
];

export default function FocusScreen() {
  const { emotion, energy, time } = useLocalSearchParams<{ emotion: string; energy: string; time: string }>();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [selectedFocus, setSelectedFocus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
  };

  const handleContinue = async () => {
    if (!selectedFocus || !emotion || !energy || !time || !user) return;

    const energyLevel = parseInt(energy, 10);
    if (Number.isNaN(energyLevel) || energyLevel < 1 || energyLevel > 5) {
      showToast(t('onboarding.focus.invalidEnergy'), 'error');
      return;
    }

    setIsSaving(true);

    try {
      const emotionStored = emotion.trim().toLowerCase();
      const emotionLabel = t(`sentir.emotions.${emotionStored}` as TranslationKey);

      const result = await saveDailyCheckInAndPrioritize({
        userId: user.id,
        emotion: emotionStored,
        energyLevel,
        availableTime: time,
        focusLevel: selectedFocus,
        locale,
        displayName: getDisplayName(user, ''),
        emotionLabel,
      });

      if (!result.success) {
        showToast(result.errorMessage ?? t('onboarding.focus.saveCheckInError'), 'error');
        return;
      }

      if (result.offline) {
        showToast(t('onboarding.focus.savedOffline'), 'info');
      }

      try {
        const { scheduleDailyReminder, scheduleRecheckReminder } = await import('@/hooks/useNotifications');
        await scheduleDailyReminder();
        await scheduleRecheckReminder(locale);
      } catch {
        /* no crítico */
      }

      await markPrioritiesReadyToast();

      void track('check_in_completed', {
        source: 'onboarding',
        offline: Boolean(result.offline),
      });

      await markQuickOnboardingGuideSeen();

      goToOnboardingPaywall();

      if (result.onboardingMarkFailed) {
        showToast(t('onboarding.focus.closeOnboardingError'), 'info');
      }

      if (result.celebration) {
        setTimeout(() => publishCheckInCelebration(result.celebration!), 450);
      }
    } catch {
      showToast(t('onboarding.focus.genericError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <OnboardingScreenShell
        footer={
          <CalmPrimaryButton
            label={isSaving ? t('onboarding.focus.saving') : t('onboarding.focus.start')}
            onPress={() => void handleContinue()}
            disabled={!selectedFocus || isSaving}
            accessibilityLabel={
              isSaving ? t('onboarding.focus.saving') : t('onboarding.focus.start')
            }
            accessibilityHint={t('onboardingA11y.continueFocusHint')}
            accessibilityState={{ disabled: !selectedFocus || isSaving, busy: isSaving }}
          />
        }
      >
        <View style={onboardingTypography.iconContainer}>
          <View style={onboardingTypography.iconCircle}>
            <Focus size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <OnboardingCheckInProgress step={4} />
        <Text style={onboardingTypography.title}>{t('onboarding.focus.title')}</Text>
        <Text style={onboardingTypography.titleAccent}>{t('onboarding.focus.titleAccent')}</Text>
        <Text style={onboardingTypography.subtitle}>{t('onboarding.focus.subtitle')}</Text>

        <View style={styles.optionsContainer} accessibilityRole="radiogroup">
          {FOCUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelectedFocus(option.id)}
              style={[styles.option, selectedFocus === option.id && styles.optionSelected]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('onboardingA11y.selectFocus', { label: t(option.labelKey) })}
              accessibilityHint={t('onboardingA11y.selectOptionHint')}
              accessibilityState={{ selected: selectedFocus === option.id }}
            >
              <Text
                style={[styles.optionText, selectedFocus === option.id && styles.optionTextSelected]}
              >
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </OnboardingScreenShell>

      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onHide={() => setToastMessage(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  option: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.bold,
  },
});
