import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { EmotionCard } from '@/components/EmotionCard';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const EMOTIONS = [
  { id: 'agotada', emoji: '😔' },
  { id: 'tranquila', emoji: '😌' },
  { id: 'ansiosa', emoji: '😰' },
  { id: 'motivada', emoji: '✨' },
  { id: 'abrumada', emoji: '🥺' },
  { id: 'enfocada', emoji: '🌿' },
] as const;

export default function EmotionScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const preSelectedEmotion = params.emotion as string | undefined;
  const [selectedEmotion, setSelectedEmotion] = useState<string>(preSelectedEmotion || '');
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (preSelectedEmotion) {
      setSelectedEmotion(preSelectedEmotion);
    }
  }, [preSelectedEmotion]);

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  const handleSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      router.push({
        pathname: '/onboarding/energy',
        params: { emotion: emotionId },
      });
    }, 380);
  };

  return (
    <OnboardingScreenShell>
      <OnboardingCheckInProgress step={1} />
      <Text style={onboardingTypography.title}>{t('onboarding.emotion.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.emotion.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.emotion.subtitle')}</Text>
      <Text style={[onboardingTypography.body, styles.hint]}>{t('onboarding.emotion.checkInHint')}</Text>

      <View
        style={styles.emotionsGrid}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('sentirExtra.emotionGroupA11y')}
      >
        {EMOTIONS.map((emotion) => (
          <View key={emotion.id} style={styles.emotionWrapper}>
            <EmotionCard
              emoji={emotion.emoji}
              label={t(`sentir.emotions.${emotion.id}` as TranslationKey)}
              selected={selectedEmotion === emotion.id}
              onPress={() => handleSelect(emotion.id)}
              tintKey={emotion.id}
            />
          </View>
        ))}
      </View>
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginBottom: THEME.spacing.md,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
    marginTop: THEME.spacing.sm,
  },
  emotionWrapper: {
    width: '33.33%',
    paddingBottom: THEME.spacing.xs,
  },
});
