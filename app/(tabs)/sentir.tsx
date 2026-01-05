import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { THEME } from '@/constants/theme';
import { EmotionCard } from '@/components/EmotionCard';
import { GradientButton } from '@/components/GradientButton';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

const EMOTIONS = [
  { id: 'agotada', emoji: '😔', label: 'Agotada' },
  { id: 'tranquila', emoji: '😌', label: 'Tranquila' },
  { id: 'ansiosa', emoji: '😰', label: 'Ansiosa' },
  { id: 'motivada', emoji: '✨', label: 'Motivada' },
  { id: 'abrumada', emoji: '🥺', label: 'Abrumada' },
  { id: 'enfocada', emoji: '🎯', label: 'Enfocada' },
];

export default function SentirScreen() {
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');

  const handleContinue = async () => {
    if (!selectedEmotion) return;
    router.push({
      pathname: '/(tabs)/sentir-energy',
      params: { emotion: selectedEmotion },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>¿Cómo te</Text>
        <Text style={styles.titleAccent}>sientes</Text>
        <Text style={styles.subtitle}>hoy?</Text>

        <Text style={styles.description}>
          Kora prioriza por ti. Solo enfócate en lo que realmente importa hoy.
        </Text>

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
        <GradientButton
          title="Continuar →"
          onPress={handleContinue}
          disabled={!selectedEmotion}
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
    marginBottom: THEME.spacing.sm,
  },
  description: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
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
