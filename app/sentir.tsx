import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Heart, CircleHelp, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { getLocalDateString } from '@/lib/dateLocal';
import { SentirTodayCheckInCard } from '@/components/sentir/SentirTodayCheckInCard';
import { SentirVisualCheckIn } from '@/components/sentir/SentirVisualCheckIn';
import { FlowIndicator, resolveFlowStep } from '@/components/FlowIndicator';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';

const SENTIR_RITUAL_HINT_KEY = 'koraa_sentir_ritual_intro_v1';

const EMOTION_IDS = [
  { id: 'agotada', emoji: '😔' },
  { id: 'tranquila', emoji: '😌' },
  { id: 'ansiosa', emoji: '😰' },
  { id: 'motivada', emoji: '✨' },
  { id: 'abrumada', emoji: '🥺' },
  { id: 'enfocada', emoji: '🎯' },
] as const;

function closeCheckInModal() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)');
}

export default function SentirScreen() {
  const { full } = useLocalSearchParams<{ full?: string }>();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const emotions = EMOTION_IDS.map((e) => ({
    ...e,
    label: t(`sentir.emotions.${e.id}` as 'sentir.emotions.agotada'),
  }));
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [showRitualHint, setShowRitualHint] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<{
    emotion: string;
    energy_level: number;
    available_time?: string;
    focus_level?: string;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

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
        .select('emotion, energy_level, available_time, focus_level')
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
          available_time: data.available_time ?? undefined,
          focus_level: data.focus_level ?? undefined,
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

  useEffect(() => {
    if (full === '1' && todayCheckIn) {
      openRecheckCheckIn('sentir_full');
    }
  }, [full, todayCheckIn]);

  useEffect(() => {
    return subscribeCheckInRefresh(() => {
      void loadTodayCheckIn();
    });
  }, [loadTodayCheckIn]);

  const todayEmotionLabel = todayCheckIn
    ? emotions.find((e) => e.id === todayCheckIn.emotion.toLowerCase())?.label ??
      todayCheckIn.emotion
    : '';

  return (
    <View style={styles.container}>
      <CalmScreen
        ref={scrollRef}
        topInset="md"
        reserveFloatingTabBar={false}
        contentStyle={{ paddingBottom: THEME.spacing.xl }}
      >
        <View style={styles.modalHeaderRow}>
          <TouchableOpacity
            onPress={closeCheckInModal}
            style={styles.modalHeaderBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('sentirExtra.a11yClose')}
          >
            <X size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('sentir.modalTitle')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/help')}
            style={styles.modalHeaderBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('sentirExtra.a11yHelp')}
            accessibilityHint={t('sentirExtra.a11yHelpHint')}
          >
            <CircleHelp size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
          </TouchableOpacity>
        </View>

        {showRitualHint ? (
          <View style={styles.ritualHint}>
            <View style={styles.ritualHintHeader}>
              <View style={styles.ritualHintIconWrap}>
                <Heart size={18} color={THEME.colors.gradient.blue} />
              </View>
              <View style={styles.ritualHintTextCol}>
                <Text style={styles.ritualHintTitle}>{t('sentir.ritualTitle')}</Text>
                <Text style={styles.ritualHintBody}>{t('sentir.ritualBodyModal')}</Text>
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

        <Text style={styles.modalLead}>{t('sentir.modalLead')}</Text>

        <FlowIndicator
          currentStep={resolveFlowStep({
            hasCheckIn: Boolean(todayCheckIn),
            hasTasks: hasTasks === true,
          })}
        />

        {todayCheckIn ? (
          <SentirTodayCheckInCard
            emotion={todayCheckIn.emotion}
            emotionLabel={todayEmotionLabel}
            energyLevel={todayCheckIn.energy_level}
            onAdjustCheckIn={() => openRecheckCheckIn('sentir')}
          />
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('hoy.howFeelToday')}</Text>
            <CalmCard>
              <SentirVisualCheckIn
                emotions={emotions}
                embedded
                showQuickBadge
                onSaved={() => {
                  void loadTodayCheckIn();
                  closeCheckInModal();
                }}
              />
            </CalmCard>
          </>
        )}

        {hasTasks === false && !todayCheckIn ? (
          <TouchableOpacity
            onPress={() => {
              closeCheckInModal();
              router.push('/(tabs)/vaciar');
            }}
            activeOpacity={0.75}
            accessibilityRole="link"
            accessibilityLabel={t('sentir.noTasksLink')}
            style={styles.noTasksLinkWrap}
          >
            <Text style={styles.noTasksLink}>{t('sentir.noTasksLink')}</Text>
          </TouchableOpacity>
        ) : null}
      </CalmScreen>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  modalHeaderBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
    textAlign: 'center',
  },
  modalLead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
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
  noTasksLinkWrap: {
    alignSelf: 'flex-start',
  },
  noTasksLink: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
