import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { Battery } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const ENERGY_LEVELS: { id: number; key: TranslationKey; bars: number }[] = [
  { id: 1, key: 'onboarding.energy.veryLow', bars: 1 },
  { id: 2, key: 'onboarding.energy.low', bars: 2 },
  { id: 3, key: 'onboarding.energy.medium', bars: 3 },
  { id: 4, key: 'onboarding.energy.high', bars: 4 },
  { id: 5, key: 'onboarding.energy.veryHigh', bars: 5 },
];

export default function EnergyScreen() {
  const { t } = useI18n();
  const { emotion, from } = useLocalSearchParams<{ emotion: string; from: string }>();
  const [selectedEnergy, setSelectedEnergy] = useState<number>(0);

  const handleContinue = () => {
    if (selectedEnergy > 0 && emotion) {
      router.push({
        pathname: '/onboarding/time',
        params: { emotion, energy: selectedEnergy.toString(), from: from || 'onboarding' },
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Battery size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <Text style={styles.title}>{t('onboarding.energy.title')}</Text>
        <Text style={styles.titleAccent}>{t('onboarding.energy.titleAccent')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.energy.subtitle')}</Text>

        <View style={styles.optionsContainer} accessibilityRole="radiogroup">
          {ENERGY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setSelectedEnergy(level.id)}
              style={[
                styles.option,
                selectedEnergy === level.id && styles.optionSelected,
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('onboardingA11y.selectEnergy', { label: t(level.key) })}
              accessibilityHint={t('onboardingA11y.selectOptionHint')}
              accessibilityState={{ selected: selectedEnergy === level.id }}
            >
              <View style={styles.barsContainer}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.bar,
                      index < level.bars && styles.barActive,
                      selectedEnergy === level.id && index < level.bars && styles.barSelected,
                    ]}
                  />
                ))}
              </View>
              <Text style={[
                styles.optionText,
                selectedEnergy === level.id && styles.optionTextSelected,
              ]}>
                {t(level.key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <CalmPrimaryButton
          label={t('onboarding.energy.continue')}
          onPress={handleContinue}
          disabled={selectedEnergy === 0}
          accessibilityLabel={t('onboarding.energy.continue')}
          accessibilityHint={t('onboardingA11y.continueEnergyHint')}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    ...THEME.shadows.soft,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    width: 8,
    height: 24,
    borderRadius: 4,
    backgroundColor: THEME.colors.stroke[100],
  },
  barActive: {
    backgroundColor: THEME.colors.text.secondary,
  },
  barSelected: {
    backgroundColor: THEME.colors.gradient.blue,
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
