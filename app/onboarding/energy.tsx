import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
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
  const { emotion } = useLocalSearchParams<{ emotion: string }>();
  const [selectedEnergy, setSelectedEnergy] = useState<number>(0);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  const handleSelect = (levelId: number) => {
    setSelectedEnergy(levelId);
    if (!emotion) return;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      router.push({
        pathname: '/onboarding/time',
        params: { emotion, energy: levelId.toString() },
      });
    }, 380);
  };

  return (
    <OnboardingScreenShell>
      <OnboardingCheckInProgress step={2} />
      <Text style={onboardingTypography.title}>{t('onboarding.energy.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.energy.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.energy.subtitle')}</Text>

      <View style={styles.optionsContainer} accessibilityRole="radiogroup">
        {ENERGY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            onPress={() => handleSelect(level.id)}
            style={[styles.option, selectedEnergy === level.id && styles.optionSelected]}
            activeOpacity={0.75}
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
            <Text
              style={[styles.optionText, selectedEnergy === level.id && styles.optionTextSelected]}
            >
              {t(level.key)}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  optionSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.mist,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    width: 8,
    height: 24,
    borderRadius: 4,
    backgroundColor: THEME.colors.calm.border,
  },
  barActive: {
    backgroundColor: THEME.colors.text.secondary,
  },
  barSelected: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.medium,
  },
});
