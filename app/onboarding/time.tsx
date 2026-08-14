import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
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
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  const handleSelect = (timeId: string) => {
    setSelectedTime(timeId);
    if (!emotion || !energy) return;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      router.push({
        pathname: '/onboarding/focus',
        params: { emotion, energy, time: timeId },
      });
    }, 380);
  };

  return (
    <OnboardingScreenShell>
      <OnboardingCheckInProgress step={3} />
      <OnboardingEllieCoach message={t('onboarding.ellie.time')} mood="default" size={52} />
      <Text style={onboardingTypography.title}>{t('onboarding.time.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.time.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.time.subtitle')}</Text>

      <View style={styles.optionsContainer} accessibilityRole="radiogroup">
        {TIME_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleSelect(option.id)}
            style={[styles.option, selectedTime === option.id && styles.optionSelected]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('onboardingA11y.selectTime', { label: t(option.labelKey) })}
            accessibilityHint={t('onboardingA11y.selectOptionHint')}
            accessibilityState={{ selected: selectedTime === option.id }}
          >
            <Text
              style={[styles.optionText, selectedTime === option.id && styles.optionTextSelected]}
            >
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
    marginTop: THEME.spacing.xs,
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
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.mist,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.medium,
  },
});
