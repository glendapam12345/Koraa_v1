import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Clock size={32} color={THEME.colors.gradient.blue} />
          </View>
        </View>

        <OnboardingCheckInProgress step={3} />
        <Text style={styles.title}>{t('onboarding.time.title')}</Text>
        <Text style={styles.titleAccent}>{t('onboarding.time.titleAccent')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.time.subtitle')}</Text>

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
      </ScrollView>

      <View style={styles.footer}>
        <CalmPrimaryButton
          label={t('onboarding.time.continue')}
          onPress={handleContinue}
          disabled={!selectedTime}
          accessibilityLabel={t('onboarding.time.continue')}
          accessibilityHint={t('onboardingA11y.continueTimeHint')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
  },
  iconContainer: {
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.lg,
  },
  optionsContainer: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  option: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
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
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
});
