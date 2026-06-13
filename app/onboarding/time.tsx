import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Clock } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const TIME_OPTIONS: { id: string; labelKey: TranslationKey }[] = [
  { id: 'Poco (1-2hrs)', labelKey: 'onboarding.time.little' },
  { id: 'Medio (2-4hrs)', labelKey: 'onboarding.time.medium' },
  { id: 'Bastante (4-6hrs)', labelKey: 'onboarding.time.plenty' },
  { id: 'Todo el día', labelKey: 'onboarding.time.allDay' },
];

export default function TimeScreen() {
  const { t } = useI18n();
  const { emotion, energy } = useLocalSearchParams<{ emotion: string; energy: string }>();
  const [selectedTime, setSelectedTime] = useState<string>('');

  const handleContinue = () => {
    if (selectedTime && emotion && energy) {
      router.push({
        pathname: '/onboarding/focus',
        params: { emotion, energy, time: selectedTime },
      });
    }
  };

  return (
    <OnboardingScreenShell
      footer={
        <CalmPrimaryButton
          label={t('onboarding.time.continue')}
          onPress={handleContinue}
          disabled={!selectedTime}
          accessibilityLabel={t('onboarding.time.continue')}
          accessibilityHint={t('onboardingA11y.continueTimeHint')}
        />
      }
    >
      <View style={onboardingTypography.iconContainer}>
        <View style={onboardingTypography.iconCircle}>
          <Clock size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

      <OnboardingCheckInProgress step={3} />
      <Text style={onboardingTypography.title}>{t('onboarding.time.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.time.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.time.subtitle')}</Text>

      <View style={styles.optionsContainer} accessibilityRole="radiogroup">
          {TIME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelectedTime(option.id)}
              style={[
                styles.option,
                selectedTime === option.id && styles.optionSelected,
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('onboardingA11y.selectTime', { label: t(option.labelKey) })}
              accessibilityHint={t('onboardingA11y.selectOptionHint')}
              accessibilityState={{ selected: selectedTime === option.id }}
            >
              <Text style={[
                styles.optionText,
                selectedTime === option.id && styles.optionTextSelected,
              ]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
    </OnboardingScreenShell>
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
