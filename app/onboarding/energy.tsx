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
      <Text style={onboardingTypography.title}>{t('onboarding.energy.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.energy.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.energy.subtitle')}</Text>

      <View style={styles.scaleWrap}>
        <FeelingEnergyScale value={selectedEnergy || 0} onChange={handleSelect} />
      </View>
      <Text style={styles.adaptHint}>{t('onboarding.energy.adaptHint')}</Text>

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
  cta: {
    marginTop: THEME.spacing.lg,
  },
});
