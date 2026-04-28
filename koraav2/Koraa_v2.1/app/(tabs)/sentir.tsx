import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { EmotionCard } from '@/components/EmotionCard';
import { GradientButton } from '@/components/GradientButton';
import { Tooltip } from '@/components/Tooltip';
import { FlowIndicator } from '@/components/FlowIndicator';
import { getEmotionTips } from '@/lib/emotionTips';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Lightbulb } from 'lucide-react-native';

const EMOTIONS = [
  { id: 'agotada', emoji: '😔', label: 'Agotada' },
  { id: 'tranquila', emoji: '😌', label: 'Tranquila' },
  { id: 'ansiosa', emoji: '😰', label: 'Ansiosa' },
  { id: 'motivada', emoji: '✨', label: 'Motivada' },
  { id: 'abrumada', emoji: '🥺', label: 'Abrumada' },
  { id: 'enfocada', emoji: '🎯', label: 'Enfocada' },
];

export default function SentirScreen() {
  const insets = useSafeAreaInsets();
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [, setHasCheckInToday] = useState<boolean | null>(null);

  const checkTasks = useCallback(async () => {
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
        logger.error('Error verificando tareas:', error);
        return;
      }

      setHasTasks((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  }, []);

  const checkTodayCheckIn = useCallback(async () => {
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
        logger.error('Error verificando check-in:', error);
        return;
      }

      const hasCheckIn = !!data;
      setHasCheckInToday(hasCheckIn);
      setShowTooltip((prev) => (hasTasks && !hasCheckIn ? true : prev));
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  }, [hasTasks]);

  useEffect(() => {
    checkTasks();
    checkTodayCheckIn();
  }, [checkTasks, checkTodayCheckIn]);

  useFocusEffect(
    useCallback(() => {
      checkTasks();
      checkTodayCheckIn();
    }, [checkTasks, checkTodayCheckIn])
  );

  const handleContinue = async () => {
    if (!selectedEmotion) return;
    router.push({
      pathname: '/onboarding/energy',
      params: { emotion: selectedEmotion, from: 'sentir' },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + THEME.spacing.lg }]} showsVerticalScrollIndicator={false}>
        {/* Indicador de flujo */}
        <FlowIndicator currentStep="sentir" />

        <Text style={styles.title}>¿Cómo te</Text>
        <Text style={styles.titleAccent}>sientes</Text>
        <Text style={styles.subtitle}>hoy?</Text>

        <Text style={styles.description}>
          Koraa prioriza por ti. Solo enfócate en lo que realmente importa hoy.
        </Text>

        {/* Banner si no hay tareas - Paso 1 del flujo */}
        {hasTasks === false && (
          <TouchableOpacity
            style={styles.noTasksBanner}
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Paso 1: Agrega tus tareas primero"
            accessibilityHint="Abre la pestaña Tareas para agregar lo pendiente antes del check-in"
          >
            <LinearGradient
              colors={[THEME.colors.gradient.pink, THEME.colors.gradient.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noTasksBannerGradient}
            >
              <Plus size={20} color={THEME.colors.onGradient} />
              <View style={styles.noTasksBannerContent}>
                <Text style={styles.noTasksBannerText}>
                  Paso 1: Agrega tus tareas primero
                </Text>
                <Text style={styles.noTasksBannerSubtext}>
                  Ve a la pestaña Tareas para agregar lo que necesitas hacer hoy, luego regresa aquí
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

        {/* Tips contextuales después de seleccionar emoción */}
        {selectedEmotion && (
          <View style={styles.tipsSection}>
            <View style={styles.tipsHeader}>
              <Lightbulb size={20} color={THEME.colors.gradient.blue} />
              <Text style={styles.tipsTitle}>
                Tips para {EMOTIONS.find(e => e.id === selectedEmotion)?.label}
              </Text>
            </View>
            {getEmotionTips(selectedEmotion).slice(0, 3).map((tip, index) => (
              <View key={tip.id} style={styles.tipCard}>
                <Text style={styles.tipText}>{tip.tip}</Text>
              </View>
            ))}
          </View>
        )}
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
        message="Di cómo te sientes hoy (emoción, energía, tiempo y enfoque) y Koraa priorizará automáticamente tus tareas según tu estado. Hazlo cada día para mejores resultados."
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
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  noTasksBannerSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
  },
  flowGuide: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  flowGuideText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  flowGuideAccent: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
  },
  tipsSection: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
  tipsTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  tipCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  tipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
});
