import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { FeelingEnergyScale } from '@/components/checkin/FeelingEnergyScale';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { useI18n } from '@/contexts/I18nContext';

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

  const goNext = (levelId: number) => {
    if (!emotion) return;
    router.push({
      pathname: '/onboarding/time',
      params: { emotion, energy: levelId.toString() },
    });
  };

  const handleSelect = (levelId: number) => {
    setSelectedEnergy(levelId);
    if (!emotion) return;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => goNext(levelId), 420);
  };

  return (
    <OnboardingScreenShell>
      <OnboardingCheckInProgress step={2} />
      <Text style={styles.title}>{t('quickRecheck.mockTitle')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('quickRecheck.mockSubtitle')}</Text>

      <View style={styles.scaleWrap}>
        <FeelingEnergyScale value={selectedEnergy || 0} onChange={handleSelect} />
      </View>

      {selectedEnergy > 0 ? (
        <CalmPrimaryButton
          label={t('onboarding.energy.continue')}
          onPress={() => goNext(selectedEnergy)}
          large
          style={styles.cta}
        />
      ) : null}
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  scaleWrap: {
    marginTop: THEME.spacing.md,
  },
  cta: {
    marginTop: THEME.spacing.lg,
  },
});
