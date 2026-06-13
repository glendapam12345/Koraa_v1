import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { EmotionCard } from '@/components/EmotionCard';
import { OnboardingCheckInProgress } from '@/components/onboarding/OnboardingCheckInProgress';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Sparkles } from 'lucide-react-native';
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

  useEffect(() => {
    if (preSelectedEmotion) {
      setSelectedEmotion(preSelectedEmotion);
    }
  }, [preSelectedEmotion]);

  const handleContinue = () => {
    if (selectedEmotion) {
      router.push({
        pathname: '/onboarding/energy',
        params: { emotion: selectedEmotion },
      });
    }
  };

  return (
    <OnboardingScreenShell
      footer={
        <CalmPrimaryButton
          label={t('onboarding.emotion.continue')}
          onPress={handleContinue}
          disabled={!selectedEmotion}
          accessibilityLabel={t('onboarding.emotion.continue')}
          accessibilityHint={t('onboardingA11y.continueEmotionHint')}
        />
      }
    >
      <View style={onboardingTypography.iconContainer}>
        <View style={onboardingTypography.iconCircle}>
          <Sparkles size={32} color={THEME.colors.gradient.blue} />
        </View>
      </View>

      <OnboardingCheckInProgress step={1} />
      <Text style={onboardingTypography.title}>{t('onboarding.emotion.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.emotion.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.emotion.subtitle')}</Text>
      <Text style={styles.checkInHint}>{t('onboarding.emotion.checkInHint')}</Text>
      <Text style={styles.inclusiveNote}>{t('sentir.inclusiveNote')}</Text>

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
              onPress={() => setSelectedEmotion(emotion.id)}
            />
          </View>
        ))}
      </View>
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  checkInHint: {
    ...onboardingTypography.body,
    marginBottom: THEME.spacing.sm,
  },
  inclusiveNote: {
    ...THEME.typography.meta,
    color: THEME.colors.text.metaOnFill,
    lineHeight: 18,
    marginBottom: THEME.spacing.lg,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: THEME.spacing.md,
  },
  emotionWrapper: {
    width: '50%',
    paddingBottom: THEME.spacing.xs,
  },
});
