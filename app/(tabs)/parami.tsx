import { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import { useCheckInInsightsData } from '@/hooks/useCheckInInsightsData';
import {
  buildEmotionMix,
  buildEnergySparkline,
  hasEnoughPatternData,
} from '@/lib/checkInPatterns';
import { MiniSparklineChart } from '@/components/yo/MiniSparklineChart';
import { MiniEmotionBars } from '@/components/yo/MiniEmotionBars';
import { FocusSessionCard } from '@/components/focus/FocusSessionCard';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ParaMiMusaHeader } from '@/components/parami/ParaMiMusaHeader';
import { ParaMiMusaCard } from '@/components/parami/ParaMiMusaCard';
import { LockedChartPreview } from '@/components/parami/LockedChartPreview';
import { getDisplayName, getFirstName } from '@/lib/displayName';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import type { TranslationKey } from '@/lib/i18n';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const EMOTION_IDS = ['agotada', 'tranquila', 'ansiosa', 'motivada', 'abrumada', 'enfocada'] as const;

export default function ParaMiScreen() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [profileFullName, setProfileFullName] = useState<string | undefined>();
  const [todayEmotion, setTodayEmotion] = useState<string>('');
  const [todayEnergy, setTodayEnergy] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    void fetchProfilePreferences(user.id).then(({ data }) => {
      setProfileFullName(data?.full_name?.trim() || undefined);
    });
  }, [user?.id]);

  const loadTodayCheckIn = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('daily_check_ins')
      .select('emotion, energy_level')
      .eq('user_id', user.id)
      .eq('date', getLocalDateString())
      .maybeSingle();
    if (data?.emotion) {
      setTodayEmotion(data.emotion);
      setTodayEnergy(data.energy_level ?? 0);
    } else {
      setTodayEmotion('');
      setTodayEnergy(0);
    }
  }, [user?.id]);

  const displayName = getDisplayName(
    { full_name: profileFullName, user_metadata: user?.user_metadata, email: user?.email },
    t('yo.welcomeName'),
  );
  const firstName = getFirstName(displayName);

  const todayEmotionLabel = useMemo(() => {
    if (!todayEmotion) return undefined;
    const id = todayEmotion.toLowerCase();
    if (EMOTION_IDS.includes(id as (typeof EMOTION_IDS)[number])) {
      return t(`sentir.emotions.${id}` as TranslationKey);
    }
    return todayEmotion;
  }, [todayEmotion, t]);

  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const dayLabels = useMemo(
    () => [
      t('yo.dayShortSun'),
      t('yo.dayShortMon'),
      t('yo.dayShortTue'),
      t('yo.dayShortWed'),
      t('yo.dayShortThu'),
      t('yo.dayShortFri'),
      t('yo.dayShortSat'),
    ],
    [t],
  );

  const { progressData, loading, load } = useCheckInInsightsData(monthNames, dayLabels);

  const refresh = useCallback(() => {
    if (user?.id) {
      void load(user.id);
      void loadTodayCheckIn();
    }
  }, [user?.id, load, loadTodayCheckIn]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const energySparkline = useMemo(() => buildEnergySparkline(progressData), [progressData]);
  const emotionMix = useMemo(() => buildEmotionMix(progressData), [progressData]);
  const hasPatternData = useMemo(() => hasEnoughPatternData(progressData), [progressData]);
  const locked = !isSubscribed;

  const moodChart = locked ? (
    <LockedChartPreview variant="mood" />
  ) : hasPatternData ? (
    <MiniEmotionBars items={emotionMix} />
  ) : (
    <Text style={styles.placeholder}>{t('yo.patternsNeedData')}</Text>
  );

  const energyChart = locked ? (
    <LockedChartPreview variant="energy" />
  ) : hasPatternData ? (
    <MiniSparklineChart values={energySparkline} />
  ) : (
    <Text style={styles.placeholder}>{t('yo.patternsNeedData')}</Text>
  );

  const symptomsChart = locked ? (
    <LockedChartPreview variant="symptoms" />
  ) : hasPatternData ? (
    <MiniEmotionBars items={emotionMix} />
  ) : (
    <Text style={styles.placeholder}>{t('yo.patternsNeedData')}</Text>
  );

  return (
    <CalmScreen
      contentStyle={{ gap: THEME.layout.sectionGapCompact }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={THEME.colors.calm.lavenderDeep} />
      }
    >
      <ParaMiMusaHeader
        firstName={firstName}
        isSubscribed={isSubscribed}
        progressData={progressData}
        todayEmotionLabel={todayEmotionLabel}
        todayEnergyLevel={todayEnergy}
      />

      <Text style={styles.flowHint}>{t('parami.flowHint')}</Text>

      <FocusSessionCard />

      <Text style={styles.sectionTitle} accessibilityRole="header">
        {t('parami.patternsSectionTitle')}
      </Text>
      {locked && !subscriptionLoading ? (
        <Text style={styles.sectionSub}>{t('parami.chartsFreeNote')}</Text>
      ) : null}

      <ParaMiMusaCard
        colors={[...THEME.colors.parami.moodCard]}
        title={t('parami.moodCardTitle')}
        body={t('parami.moodCardBody')}
        locked={locked}
      >
        {moodChart}
      </ParaMiMusaCard>

      <ParaMiMusaCard
        colors={[...THEME.colors.parami.energyCard]}
        title={t('yo.patternEnergyTitle')}
        body={t('parami.energyCardBody')}
        locked={locked}
      >
        {energyChart}
      </ParaMiMusaCard>

      <ParaMiMusaCard
        colors={[...THEME.colors.parami.symptomsCard]}
        title={t('parami.symptomsCardTitle')}
        body={t('parami.symptomsCardBody')}
        locked={locked}
      >
        {symptomsChart}
      </ParaMiMusaCard>

      {locked && !subscriptionLoading ? (
        <CalmPrimaryButton
          label={t('parami.unlockCta')}
          onPress={() => router.push('/paywall')}
          accessibilityHint={t('paramiExtra.a11yUnlockHint')}
        />
      ) : null}

      {!locked && !subscriptionLoading && !hasPatternData && !loading ? (
        <Text style={styles.footerHint}>{t('parami.patternsNeedCheckIns')}</Text>
      ) : null}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  flowHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  sectionTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  sectionSub: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.xs,
  },
  placeholder: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
  },
  footerHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: THEME.spacing.sm,
  },
});
