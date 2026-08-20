import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { EmotionCard } from '@/components/EmotionCard';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
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
      <OnboardingProgressDots
        total={3}
        current={2}
        accessibilityLabel={t('onboarding.tour.guidedProgressA11y', { current: 2, total: 3 })}
      />
      <OnboardingCheckInProgress loopStep={2} />
      <OnboardingEllieCoach message={t('onboarding.ellie.emotion')} mood="breathing" size={64} />
      <Text style={onboardingTypography.title}>{t('onboarding.emotion.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.emotion.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.emotion.subtitle')}</Text>

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
