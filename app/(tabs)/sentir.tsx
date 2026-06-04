import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { EmotionCard } from '@/components/EmotionCard';
import { GradientButton } from '@/components/GradientButton';
import { FlowIndicator } from '@/components/FlowIndicator';
import { getEmotionTips } from '@/lib/emotionTips';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Lightbulb, Heart, CircleHelp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { getLocalDateString } from '@/lib/dateLocal';
import { SentirTodayCheckInCard } from '@/components/sentir/SentirTodayCheckInCard';
import { SentirVisualCheckIn } from '@/components/sentir/SentirVisualCheckIn';

const QuickRecheckInModal = lazy(() =>
  import('@/components/QuickRecheckInModal').then((module) => ({
    default: module.QuickRecheckInModal,
  })),
);

const SENTIR_RITUAL_HINT_KEY = 'koraa_sentir_ritual_intro_v1';

const EMOTION_IDS = [
  { id: 'agotada', emoji: '😔' },
  { id: 'tranquila', emoji: '😌' },
  { id: 'ansiosa', emoji: '😰' },
  { id: 'motivada', emoji: '✨' },
  { id: 'abrumada', emoji: '🥺' },
  { id: 'enfocada', emoji: '🎯' },
] as const;

export default function SentirScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const emotions = EMOTION_IDS.map((e) => ({
    ...e,
    label: t(`sentir.emotions.${e.id}` as 'sentir.emotions.agotada'),
  }));
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [showRitualHint, setShowRitualHint] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<{
    emotion: string;
    energy_level: number;
  } | null>(null);
  const [showQuickRecheck, setShowQuickRecheck] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const emotionsSectionY = useRef(0);

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

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setTodayCheckIn(null);
        return;
      }
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level')
        .eq('user_id', authUser.id)
        .eq('date', getLocalDateString())
        .maybeSingle();

      if (error) {
        logger.error('Error cargando check-in de hoy:', error);
        setTodayCheckIn(null);
        return;
      }

      if (data?.emotion) {
        setTodayCheckIn({
          emotion: data.emotion,
          energy_level: data.energy_level || 0,
        });
      } else {
        setTodayCheckIn(null);
      }
    } catch (error) {
      logger.error('Error inesperado cargando check-in:', error);
      setTodayCheckIn(null);
    }
  }, []);

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

  useEffect(() => {
    checkTasks();
    void loadTodayCheckIn();
  }, [checkTasks, loadTodayCheckIn]);

  useFocusEffect(
    useCallback(() => {
      checkTasks();
      void loadTodayCheckIn();
    }, [checkTasks, loadTodayCheckIn]),
  );

  const todayEmotionLabel = todayCheckIn
    ? emotions.find((e) => e.id === todayCheckIn.emotion.toLowerCase())?.label ??
      todayCheckIn.emotion
    : '';

  const scrollToFullCheckIn = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(emotionsSectionY.current - THEME.spacing.md, 0),
      animated: true,
    });
  }, []);

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    const label = emotions.find((e) => e.id === emotionId)?.label;
    if (label && Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(
        t('sentirExtra.emotionSelectedAnnounce', { emotion: label }),
      );
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
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + THEME.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.helpHeaderRow}>
          <TouchableOpacity
            onPress={() => router.push('/help')}
            style={styles.helpHeaderBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('sentirExtra.a11yHelp')}
            accessibilityHint={t('sentirExtra.a11yHelpHint')}
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
                <Text style={styles.ritualHintTitle}>{t('sentir.ritualTitle')}</Text>
                <Text style={styles.ritualHintBody}>{t('sentir.ritualBody')}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => void dismissRitualHint()}
              style={styles.ritualHintDismiss}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('sentirExtra.a11yDismissRitual')}
            >
              <Text style={styles.ritualHintDismissText}>{t('sentir.ritualDismiss')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {todayCheckIn ? (
          <>
            <Text style={styles.title}>{t('sentir.title')}</Text>
            <Text style={styles.titleAccent}>{t('sentir.titleAccent')}</Text>
            <Text style={styles.subtitle}>{t('sentir.subtitle')}</Text>
            <Text style={styles.description}>{t('sentir.description')}</Text>
            <Text style={styles.inclusiveNote}>{t('sentir.inclusiveNote')}</Text>
            <SentirTodayCheckInCard
              emotion={todayCheckIn.emotion}
              emotionLabel={todayEmotionLabel}
              energyLevel={todayCheckIn.energy_level}
              onQuickRecheck={() => setShowQuickRecheck(true)}
              onFullCheckIn={scrollToFullCheckIn}
            />
          </>
        ) : (
          <SentirVisualCheckIn
            emotions={emotions}
            onSaved={() => void loadTodayCheckIn()}
          />
        )}

        {/* Banner si no hay tareas - Paso 1 del flujo */}
        {hasTasks === false && !todayCheckIn && (
          <TouchableOpacity
            style={styles.noTasksBanner}
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('sentirExtra.a11yNoTasks')}
            accessibilityHint={t('sentirExtra.a11yNoTasksHint')}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.pink, THEME.colors.gradient.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noTasksBannerGradient}
            >
              <Plus size={20} color={THEME.colors.onGradient} />
              <View style={styles.noTasksBannerContent}>
                <Text style={styles.noTasksBannerText}>{t('sentir.noTasksTitle')}</Text>
                <Text style={styles.noTasksBannerSubtext}>{t('sentir.noTasksSub')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {todayCheckIn ? (
          <>
            <View
              onLayout={(e) => {
                emotionsSectionY.current = e.nativeEvent.layout.y;
              }}
              style={styles.emotionsGrid}
              accessibilityRole="radiogroup"
              accessibilityLabel={t('sentirExtra.emotionGroupA11y')}
            >
              {emotions.map((emotion) => (
                <View key={emotion.id} style={styles.emotionWrapper}>
                  <EmotionCard
                    emoji={emotion.emoji}
                    label={emotion.label}
                    selected={selectedEmotion === emotion.id}
                    onPress={() => handleEmotionSelect(emotion.id)}
                  />
                </View>
              ))}
            </View>

            {selectedEmotion ? (
              <View style={styles.tipsSection}>
                <View style={styles.tipsHeader}>
                  <Lightbulb size={20} color={THEME.colors.gradient.blue} />
                  <Text style={styles.tipsTitle}>
                    {t('sentir.tipsFor', {
                      emotion: emotions.find((e) => e.id === selectedEmotion)?.label ?? '',
                    })}
                  </Text>
                </View>
                {getEmotionTips(selectedEmotion, locale).slice(0, 3).map((tip) => (
                  <View key={tip.id} style={styles.tipCard}>
                    <Text style={styles.tipText}>{tip.tip}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {todayCheckIn ? (
        <View style={styles.footer}>
          <GradientButton
            title={t('sentir.continue')}
            onPress={handleContinue}
            disabled={!selectedEmotion}
            accessibilityLabel={t('sentir.continue')}
            accessibilityHint={t('sentirExtra.continueA11yHint')}
          />
        </View>
      ) : null}

      <Suspense fallback={null}>
        <QuickRecheckInModal
          visible={showQuickRecheck}
          onClose={() => setShowQuickRecheck(false)}
          onComplete={() => {
            setShowQuickRecheck(false);
            void loadTodayCheckIn();
            router.push('/(tabs)');
          }}
          initialEmotion={todayCheckIn?.emotion ?? ''}
          initialEnergy={todayCheckIn?.energy_level ?? 0}
        />
      </Suspense>
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
    marginBottom: THEME.spacing.sm,
  },
  inclusiveNote: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
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
