import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { EmotionCard } from '@/components/EmotionCard';
import { Sparkles } from 'lucide-react-native';

const EMOTIONS = [
  { id: 'agotada', emoji: '😔', label: 'Agotada' },
  { id: 'tranquila', emoji: '😌', label: 'Tranquila' },
  { id: 'ansiosa', emoji: '😰', label: 'Ansiosa' },
  { id: 'motivada', emoji: '✨', label: 'Motivada' },
  { id: 'abrumada', emoji: '🥺', label: 'Abrumada' },
  { id: 'enfocada', emoji: '🎯', label: 'Enfocada' },
];

export default function EmotionScreen() {
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
      const rawFrom = typeof params.from === 'string' ? params.from : '';
      const fromParam =
        rawFrom === 'sentir' ? 'sentir' : rawFrom === 'quick' ? 'quick' : 'onboarding';
      router.push({
        pathname: '/onboarding/energy',
        params: { emotion: selectedEmotion, from: fromParam },
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color={THEME.colors.gradient.blue} />
          </View>
        </View>

        <Text style={styles.title}>¿Cómo te</Text>
        <Text style={styles.titleAccent}>sientes</Text>
        <Text style={styles.subtitle}>hoy?</Text>

        <View style={styles.emotionsGrid}>
          {EMOTIONS.map((emotion) => (
            <View key={emotion.id} style={styles.emotionWrapper}>
              <EmotionCard
                emoji={emotion.emoji}
                label={emotion.label}
                selected={selectedEmotion === emotion.id}
                onPress={() => setSelectedEmotion(emotion.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={handleContinue} disabled={!selectedEmotion} />
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
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
});
