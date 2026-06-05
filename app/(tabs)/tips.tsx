import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '@/constants/theme';
import { Tooltip } from '@/components/Tooltip';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { getLocalDateString } from '@/lib/dateLocal';
import { generatePersonalizedRecommendations } from '@/lib/personalizedRecommendations';
import { countTipsByCategory, getTipsDailyInsight } from '@/lib/tipsPersonalization';
import type { TipCategoryId } from '@/lib/tipsTypes';
import { TipsCategoryGrid } from '@/components/tips/TipsCategoryGrid';
import { TipsWeekChart } from '@/components/tips/TipsWeekChart';
import { TipsMoodEnergyCards } from '@/components/tips/TipsMoodEnergyCards';
import { useCheckInInsightsData } from '@/hooks/useCheckInInsightsData';
import { Lightbulb } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { useI18n } from '@/contexts/I18nContext';
import { TipsMoodHeader } from '@/components/tips/TipsMoodHeader';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';
import type { TranslationKey } from '@/lib/i18n';

const TIPS_TOOLTIP_SEEN_KEY = 'koraa_tips_tooltip_seen';
const FREE_RECOMMENDATIONS_LIMIT = 2;
const FREE_GENERIC_TIPS_LIMIT = 3;

const EMOTIONS = [
  { id: 'agotada', emoji: '😔', color: [THEME.colors.calm.lavenderDeep, THEME.colors.gradient.pink] },
  { id: 'tranquila', emoji: '😌', color: [THEME.colors.gradient.blue, THEME.colors.calm.lavender] },
  { id: 'ansiosa', emoji: '😰', color: [THEME.colors.gradient.pink, THEME.colors.calm.lavenderDeep] },
  { id: 'motivada', emoji: '✨', color: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] },
  { id: 'abrumada', emoji: '🥺', color: [THEME.colors.calm.lavender, THEME.colors.gradient.pink] },
  { id: 'enfocada', emoji: '🎯', color: [THEME.colors.gradient.blue, THEME.colors.calm.lavenderDeep] },
] as const;

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const TIP_CATEGORY_ORDER: TipCategoryId[] = ['mindset', 'rest', 'action', 'productivity'];

export default function TipsScreen() {
  const { t, locale } = useI18n();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const [todayMood, setTodayMood] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [availableTime, setAvailableTime] = useState<string>('');
  const [focusLevel, setFocusLevel] = useState<string>('');
  type UserProfile = {
    age?: number;
    favorite_activities?: string[];
    interests?: string[];
    other_preferences?: Record<string, any>;
  };
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
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
  const { progressData, loading: insightsLoading, load: loadInsights } = useCheckInInsightsData(
    monthNames,
    dayLabels,
  );
  const weekChartData = useMemo(() => progressData.slice(-7), [progressData]);

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = getLocalDateString();
      const { data: checkIn, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time, focus_level')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando check-in:', error);
        setLoading(false);
        return;
      }

      if (checkIn) {
        setTodayMood(checkIn.emotion.toLowerCase());
        setEnergyLevel(checkIn.energy_level);
        setAvailableTime(checkIn.available_time);
        setFocusLevel(checkIn.focus_level || '');
      } else {
        setTodayMood('');
        setEnergyLevel(0);
        setAvailableTime('');
        setFocusLevel('');
      }

      const { data: prefs, error: profileError } = await fetchProfilePreferences(user.id);

      if (profileError) {
        console.error('Error cargando perfil:', profileError);
        setUserProfile(null);
      } else if (prefs) {
        setUserProfile({
          age: prefs.age ?? undefined,
          favorite_activities: prefs.favorite_activities,
          interests: prefs.interests,
          other_preferences: prefs.other_preferences,
        });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayCheckIn();
  }, [loadTodayCheckIn]);

  useEffect(() => {
    return subscribeCheckInRefresh(() => {
      void loadTodayCheckIn();
    });
  }, [loadTodayCheckIn]);

  useFocusEffect(
    useCallback(() => {
      loadTodayCheckIn();
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) void loadInsights(user.id);
      })();
    }, [loadTodayCheckIn, loadInsights])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const seen = await AsyncStorage.getItem(TIPS_TOOLTIP_SEEN_KEY);
          if (!cancelled && seen !== '1') {
            setShowTooltip(true);
          }
        } catch {
          /* ignore */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodayCheckIn();
    setRefreshing(false);
  };

  const getEmotionData = () => {
    return EMOTIONS.find(e => e.id === todayMood) || null;
  };

  const emotionData = getEmotionData();

  const tipsContext = useMemo(
    () => ({
      emotion: todayMood || 'tranquila',
      energyLevel: energyLevel || 3,
      availableTime,
      focusLevel,
    }),
    [todayMood, energyLevel, availableTime, focusLevel],
  );

  const categoryCounts = useMemo(
    () => (todayMood ? countTipsByCategory(tipsContext, locale) : null),
    [todayMood, tipsContext, locale],
  );

  const patternLine = useMemo(
    () => (todayMood ? getTipsDailyInsight(tipsContext, locale) : ''),
    [todayMood, tipsContext, locale],
  );

  const openCategory = useCallback(
    (category: TipCategoryId) => {
      router.push({
        pathname: '/tips/[category]',
        params: {
          category,
          emotion: todayMood,
          energy: String(energyLevel || 3),
        },
      });
    },
    [todayMood, energyLevel],
  );

  // Generar recomendaciones personalizadas
  const hasPersonalizationProfile = Boolean(
    (userProfile?.favorite_activities?.length ?? 0) > 0 ||
      (userProfile?.interests?.length ?? 0) > 0,
  );

  const personalizedRecommendations = useMemo(() => {
    if (!todayMood) return [];

    try {
      return generatePersonalizedRecommendations(
        {
          age: userProfile?.age,
          favorite_activities: userProfile?.favorite_activities ?? [],
          interests: userProfile?.interests ?? [],
          other_preferences: userProfile?.other_preferences ?? {},
        },
        {
          emotion: todayMood,
          energyLevel,
          availableTime,
          focusLevel,
        },
        locale,
      );
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return []; // Retornar array vacío en caso de error
    }
  }, [todayMood, userProfile, energyLevel, availableTime, focusLevel, locale]);

  const visiblePersonalizedRecommendations = useMemo(() => {
    if (isSubscribed) return personalizedRecommendations;
    return personalizedRecommendations.slice(0, FREE_RECOMMENDATIONS_LIMIT);
  }, [isSubscribed, personalizedRecommendations]);

  if (loading || subscriptionLoading) {
    return (
      <CalmScreen scroll={false}>
        <Text style={styles.loadingText}>{t('tips.loading')}</Text>
      </CalmScreen>
    );
  }

  return (
    <CalmScreen
      contentStyle={{ gap: THEME.layout.sectionGapCompact }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={THEME.colors.calm.lavenderDeep}
        />
      }
    >
        {!todayMood ? (
          <View style={styles.emptyState} accessibilityRole="summary">
            <ScreenHeader title={t('tips.title')} />
            <View
              style={styles.emptyIconContainer}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              <Lightbulb size={56} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.emptyTitle} accessibilityRole="header">
              {t('tips.emptyTitle')}
            </Text>
            <Text style={styles.emptyMessage}>{t('tips.emptyBody')}</Text>
            <CalmPrimaryButton
              label={t('tips.goToFeel')}
              onPress={() => router.push(CHECK_IN_ROUTE)}
              accessibilityLabel={t('tipsExtra.a11yGoFeel')}
              accessibilityHint={t('tipsExtra.a11yEmptyCtaHint')}
            />
            <View style={styles.emptyActionContainer}>
              <Text style={styles.emptyActionText}>
                {t('tipsExtra.emptySecondaryLead')}
                <Text style={styles.emptyAccent}>{t('tipsExtra.emptySecondaryTab')}</Text>
                {t('tipsExtra.emptySecondaryTrail')}
              </Text>
            </View>
          </View>
        ) : emotionData ? (
          <>
            <ScreenHeader title={t('tips.title')} subtitle={t('tips.subtitle')} />
            <Text style={styles.flowHint}>{t('tips.flowHint')}</Text>

            <TipsMoodHeader
              emoji={emotionData.emoji}
              emotionName={t(`sentir.emotions.${emotionData.id}` as TranslationKey)}
              energyLevel={energyLevel || 3}
              patternLine={patternLine}
              onPressEmotion={() => openRecheckCheckIn('tips_mood')}
            />

            <TipsMoodEnergyCards
              emotionEmoji={emotionData.emoji}
              emotionLabel={t(`sentir.emotions.${emotionData.id}` as TranslationKey)}
              energyLevel={energyLevel || 3}
              weekData={weekChartData}
              loading={insightsLoading}
            />

            {categoryCounts ? (
              <View accessibilityRole="summary" accessibilityLabel={t('tipsExtra.a11yCategoryGrid')}>
                <Text style={styles.gridSectionTitle} accessibilityRole="header">
                  {t('tips.exploreGrid')}
                </Text>
                <Text style={styles.exploreLead}>{t('tips.exploreLead')}</Text>
                <TipsCategoryGrid
                  order={TIP_CATEGORY_ORDER}
                  labels={{
                    mindset: t('tips.categoriesShort.mindset'),
                    rest: t('tips.categoriesShort.rest'),
                    action: t('tips.categoriesShort.action'),
                    productivity: t('tips.categoriesShort.productivity'),
                  }}
                  counts={{
                    mindset: isSubscribed
                      ? categoryCounts.mindset
                      : Math.min(categoryCounts.mindset, FREE_GENERIC_TIPS_LIMIT),
                    rest: isSubscribed
                      ? categoryCounts.rest
                      : Math.min(categoryCounts.rest, FREE_GENERIC_TIPS_LIMIT),
                    action: isSubscribed
                      ? categoryCounts.action
                      : Math.min(categoryCounts.action, FREE_GENERIC_TIPS_LIMIT),
                    productivity: isSubscribed
                      ? categoryCounts.productivity
                      : Math.min(categoryCounts.productivity, FREE_GENERIC_TIPS_LIMIT),
                  }}
                  tipsLabel={t('tips.tipsCountLabel')}
                  onPressCategory={openCategory}
                />
              </View>
            ) : null}

            {!hasPersonalizationProfile ? (
              <TouchableOpacity
                style={styles.profileHintCompact}
                onPress={() => router.push('/(tabs)/yo')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('tips.profileLinkShort')}
                accessibilityHint={t('tipsExtra.a11yProfileHint')}
              >
                <Text style={styles.profileHintCompactText}>{t('tips.profileHintCompact')}</Text>
                <Text style={styles.profileHintCompactLink}>{t('tips.profileHintCta')}</Text>
              </TouchableOpacity>
            ) : null}

            <TipsWeekChart />
          </>
        ) : null}

      <Tooltip
        visible={showTooltip}
        title={t('tips.tooltipTitle')}
        message={t('tips.tooltipBody')}
        onClose={async () => {
          setShowTooltip(false);
          try {
            await AsyncStorage.setItem(TIPS_TOOLTIP_SEEN_KEY, '1');
          } catch {
            /* ignore */
          }
        }}
      />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  headerBlock: {
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  screenTitle: {
    ...THEME.typography.h1,
    fontSize: 28,
    color: THEME.colors.text.main,
    alignSelf: 'stretch',
  },
  screenSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    alignSelf: 'stretch',
  },
  featuredRec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    ...THEME.surfaces.muted,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  featuredRecEmoji: {
    fontSize: 24,
  },
  featuredRecText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
  },
  profileHintCompact: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    gap: 4,
  },
  profileHintCompactText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  profileHintCompactLink: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyState: {
    alignItems: 'stretch',
    gap: THEME.layout.sectionGap,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    ...THEME.surfaces.muted,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: THEME.spacing.md,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
    alignSelf: 'center',
  },
  emptyMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
  },
  emptyAccent: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyActionContainer: {
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
  },
  emptyActionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  header: {
    marginBottom: THEME.spacing.lg,
  },
  updatedSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  profileHintCard: {
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  profileHintText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  profileHintLink: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
    ...THEME.shadows.soft,
  },
  emotionEmoji: {
    fontSize: 48,
    marginRight: THEME.spacing.md,
  },
  emotionHeaderContent: {
    flex: 1,
  },
  emotionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    marginBottom: 4,
  },
  emotionName: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  categorySection: {
    marginBottom: THEME.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  tipCard: {
    flexDirection: 'row',
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderLeftWidth: 3,
  },
  tipIndicator: {
    width: 3,
    marginRight: THEME.spacing.sm,
  },
  tipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  footerMessage: {
    flexDirection: 'row',
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  flowHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    alignSelf: 'stretch',
  },
  gridSectionTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  exploreLead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginBottom: 0,
    alignSelf: 'stretch',
    width: '100%',
  },
  footerText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: THEME.spacing.lg,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  recommendationsTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  recommendationCard: {
    flexDirection: 'row',
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  recommendationEmoji: {
    fontSize: 32,
    marginRight: THEME.spacing.xs,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  recommendationMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.sm,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    ...THEME.surfaces.chip,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
});
