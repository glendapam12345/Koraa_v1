import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Plus, Lightbulb, Heart, CircleHelp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const SENTIR_RITUAL_HINT_KEY = 'koraa_sentir_ritual_intro_v1';

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
  const { user } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [, setHasCheckInToday] = useState<boolean | null>(null);
  const [showRitualHint, setShowRitualHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadHint = async () => {
      if (!user?.id) return;
      try {
        const done = await AsyncStorage.getItem(`${SENTIR_RITUAL_HINT_KEY}_${user.id}`);
        if (!cancelled && done !== '1') {
          setShowRitualHint(true);
        }
      } catch {
        if (!cancelled) setShowRitualHint(true);
      }
    };
    void loadHint();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const dismissRitualHint = async () => {
    if (user?.id) {
      try {
        await AsyncStorage.setItem(`${SENTIR_RITUAL_HINT_KEY}_${user.id}`, '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setShowRitualHint(false);
  };

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
        <View style={styles.helpHeaderRow}>
          <TouchableOpacity
            onPress={() => router.push('/help')}
            style={styles.helpHeaderBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Ayuda y preguntas frecuentes"
            accessibilityHint="Abre la pantalla de ayuda con preguntas sobre Sentir, Tareas y Hoy"
          >
            <CircleHelp size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
          </TouchableOpacity>
        </View>
        {/* Indicador de flujo */}
        <FlowIndicator currentStep="sentir" />

        {showRitualHint ? (
          <View style={styles.ritualHint}>
            <View style={styles.ritualHintHeader}>
              <View style={styles.ritualHintIconWrap}>
                <Heart size={18} color={THEME.colors.gradient.blue} />
              </View>
              <View style={styles.ritualHintTextCol}>
                <Text style={styles.ritualHintTitle}>Tu ritual diario</Text>
                <Text style={styles.ritualHintBody}>
                  Aquí haces el check-in del día (emoción, energía, tiempo y enfoque). Koraa prioriza tus tareas según
                  cómo te sientes. Es el mismo flujo que al empezar; puedes volver cada día desde esta pestaña.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => void dismissRitualHint()}
              style={styles.ritualHintDismiss}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Entendido, ocultar esta nota"
            >
              <Text style={styles.ritualHintDismissText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
  helpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: THEME.spacing.xs,
  },
  helpHeaderBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
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
  ritualHint: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    backgroundColor: THEME.colors.fill[100],
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  ritualHintHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  ritualHintIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.fill[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  ritualHintTextCol: {
    flex: 1,
  },
  ritualHintTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  ritualHintBody: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  ritualHintDismiss: {
    alignSelf: 'flex-end',
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
  },
  ritualHintDismissText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
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
