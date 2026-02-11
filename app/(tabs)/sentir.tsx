import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { EmotionCard } from '@/components/EmotionCard';
import { GradientButton } from '@/components/GradientButton';
import { Tooltip } from '@/components/Tooltip';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';

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
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkTasks();
    checkTodayCheckIn();
  }, []);

  // Recargar banner cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      checkTasks();
      checkTodayCheckIn();
    }, [])
  );

  const checkTodayCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error verificando check-in:', error);
        return;
      }

      const hasCheckIn = !!data;
      setHasCheckInToday(hasCheckIn);
      
      // Mostrar tooltip solo si hay tareas pero no hay check-in hoy (primera vez del día)
      if (hasTasks && !hasCheckIn) {
        setShowTooltip(true);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  const checkTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .limit(1);

      if (error) {
        console.error('Error verificando tareas:', error);
        return;
      }

      setHasTasks((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  const handleContinue = async () => {
    if (!selectedEmotion) return;
    router.push({
      pathname: '/onboarding/energy',
      params: { emotion: selectedEmotion, from: 'sentir' },
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

        {/* Banner si no hay tareas */}
        {hasTasks === false && (
          <TouchableOpacity
            style={styles.noTasksBanner}
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.pink, THEME.colors.gradient.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noTasksBannerGradient}
            >
              <Plus size={20} color="#FFFFFF" />
              <View style={styles.noTasksBannerContent}>
                <Text style={styles.noTasksBannerText}>
                  Agrega tareas primero
                </Text>
                <Text style={styles.noTasksBannerSubtext}>
                  Ve a "Vaciar" para agregar lo que necesitas hacer hoy
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

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
      
      <Tooltip
        visible={showTooltip}
        title="Haz tu check-in diario"
        message="Di cómo te sientes hoy (emoción, energía, tiempo y enfoque) y Kora priorizará automáticamente tus tareas según tu estado. Hazlo cada día para mejores resultados."
        onClose={() => setShowTooltip(false)}
      />
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
  noTasksBanner: {
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.lg,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  noTasksBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  noTasksBannerContent: {
    flex: 1,
  },
  noTasksBannerText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  noTasksBannerSubtext: {
    ...THEME.typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
