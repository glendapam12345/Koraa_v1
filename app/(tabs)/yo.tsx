import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Settings,
  Crown,
  CreditCard as Edit,
  X,
  Plus,
  Folder,
  RotateCcw,
  Flame,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { logger } from '@/lib/logger';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { pickDailyStreakEncouragement, getLocalDateKey } from '@/lib/streakDailyMessages';
import { ProgressChart } from '@/components/ProgressChart';
import { PremiumTeaserCard } from '@/components/PremiumTeaserCard';
import { StreakAura } from '@/components/branding/StreakAura';
import { ProjectManager } from '@/components/projects/ProjectManager';
import * as Haptics from 'expo-haptics';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import { useI18n } from '@/contexts/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const WINDOW_H = Dimensions.get('window').height;
const PROFILE_MODAL_SCROLL_MAX = Math.min(WINDOW_H * 0.58, 520);

const STREAK_EXPLAINER_DISMISSED_KEY = 'koraa_streak_explainer_dismissed_v1';

type DayData = {
  date: string;
  hasCheckIn: boolean;
  dayLabel: string;
  emotion?: string;
  energyLevel?: number;
};

type UserProfile = {
  full_name?: string;
  age?: number;
  favorite_activities?: string[];
  interests?: string[];
  other_preferences?: Record<string, unknown>;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { editProfile: editProfileParam } = useLocalSearchParams<{ editProfile?: string }>();
  const { user } = useAuth();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const [progressData, setProgressData] = useState<DayData[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [, setShowConfetti] = useState(false);
  const [previousStreak, setPreviousStreak] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [fullNameInput, setFullNameInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  /** Clave de día local para rotar mensajes de racha (actualiza al enfocar Yo). */
  const [streakMessageDayKey, setStreakMessageDayKey] = useState(getLocalDateKey);
  const [streakExplainerDismissed, setStreakExplainerDismissed] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STREAK_EXPLAINER_DISMISSED_KEY).then((v) => {
      if (v === '1') setStreakExplainerDismissed(true);
    });
  }, []);

  useEffect(() => {
    if (editProfileParam !== '1') return;
    setShowEditProfile(true);
    router.setParams({ editProfile: undefined });
  }, [editProfileParam]);

  const dismissStreakExplainer = useCallback(async () => {
    setStreakExplainerDismissed(true);
    try {
      await AsyncStorage.setItem(STREAK_EXPLAINER_DISMISSED_KEY, '1');
    } catch {
      /* no-op */
    }
  }, []);

  const loadProgressData = useCallback(async () => {
    if (!user) return;

    // Get last 14 days
    const today = new Date();
    const days: DayData[] = [];
    const checkInMap = new Map<string, { emotion: string; energy_level: number }>();

    // Fetch check-ins from last 14 days with emotion and energy_level
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 13); // 14 days total (0-13)

    const { data: checkIns } = await supabase
      .from('daily_check_ins')
      .select('date, emotion, energy_level')
      .eq('user_id', user.id)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (checkIns) {
      checkIns.forEach((checkIn) => {
        checkInMap.set(checkIn.date, {
          emotion: checkIn.emotion,
          energy_level: checkIn.energy_level,
        });
      });
    }

    // Create data for last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayLabels = [
        t('yo.dayShortSun'),
        t('yo.dayShortMon'),
        t('yo.dayShortTue'),
        t('yo.dayShortWed'),
        t('yo.dayShortThu'),
        t('yo.dayShortFri'),
        t('yo.dayShortSat'),
      ];
      const dayLabel = dayLabels[date.getDay()]!;

      const checkInData = checkInMap.get(dateString);

      days.push({
        date: dateString,
        hasCheckIn: !!checkInData,
        dayLabel,
        emotion: checkInData?.emotion,
        energyLevel: checkInData?.energy_level,
      });
    }

    setProgressData(days);
  }, [user, t]);

  const loadStreak = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    const checkInDates = new Set<string>();

    // Fetch all check-ins from last 365 days to calculate streak
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 365);

    const { data: checkIns } = await supabase
      .from('daily_check_ins')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', oneYearAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (checkIns) {
      checkIns.forEach((checkIn) => {
        checkInDates.add(checkIn.date);
      });
    }

    // Calculate streak from today backwards
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];

      if (checkInDates.has(dateString)) {
        streak++;
      } else if (i === 0) {
        // If today doesn't have check-in, start from yesterday
        continue;
      } else {
        // Break on first day without check-in
        break;
      }
    }

    setCurrentStreak(streak);
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await fetchProfilePreferences(user.id);

      if (error) {
        logger.error('Error cargando perfil:', error);
        const errorMessage = getErrorMessage(error, locale);
        const friendlyMessage =
          errorMessage === t('supabaseErrors.noConnection')
            ? t('yo.profileLoadOffline')
            : t('yo.profileLoadError');
        setProfileError(friendlyMessage);
        return;
      }

      if (data) {
        setProfile({
          full_name: data.full_name?.trim() || undefined,
          age: data.age ?? undefined,
          favorite_activities: data.favorite_activities,
          interests: data.interests,
          other_preferences: data.other_preferences,
        });
        setAgeInput(data.age != null ? String(data.age) : '');
        setProfileError(null);
      }
    } catch (error) {
      logger.error('Error inesperado:', error);
      setProfileError(t('yo.profileLoadError'));
    }
  }, [user, locale, t]);

  useEffect(() => {
    loadProgressData();
    loadStreak();
    loadProfile();
  }, [loadProgressData, loadStreak, loadProfile]);

  useEffect(() => {
    const unsub = subscribeCheckInCelebration(() => {
      void loadStreak();
      void loadProgressData();
    });
    return unsub;
  }, [loadStreak, loadProgressData]);

  // Recargar datos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      setStreakMessageDayKey(getLocalDateKey());
      loadProgressData();
      loadStreak();
      loadProfile();
    }, [loadProgressData, loadStreak, loadProfile])
  );

  // Detectar cuando se alcanza un milestone de streak y mostrar confetti
  useEffect(() => {
    if (currentStreak > 0 && previousStreak !== currentStreak) {
      // Celebrar cada 7 días (7, 14, 21, 28, etc.)
      if (currentStreak % 7 === 0 && currentStreak > previousStreak) {
        setShowConfetti(true);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // Ocultar confetti después de 3 segundos
        const timer = setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
      setPreviousStreak(currentStreak);
    }
  }, [currentStreak, previousStreak]);

  const MAX_ITEMS = 25; // Límite máximo de actividades/intereses

  const addActivity = useCallback(() => {
    const trimmedActivity = newActivity.trim();
    
    // Validar que no esté vacío
    if (!trimmedActivity) return;
    
    // Validar límite máximo
    if ((profile.favorite_activities || []).length >= MAX_ITEMS) {
      Alert.alert(t('yo.limitReachedTitle'), t('yo.limitActivities', { max: MAX_ITEMS }));
      return;
    }
    
    // Validar longitud máxima (50 caracteres)
    if (trimmedActivity.length > 50) {
      Alert.alert(t('yo.tooLongTitle'), t('yo.activityTooLong'));
      return;
    }
    
    // Validar que no sea duplicado (case-insensitive)
    const existingActivities = (profile.favorite_activities || []).map(a => a.toLowerCase());
    if (existingActivities.includes(trimmedActivity.toLowerCase())) {
      Alert.alert(t('yo.duplicateTitle'), t('yo.duplicateActivity'));
      return;
    }
    
    setProfile({
      ...profile,
      favorite_activities: [...(profile.favorite_activities || []), trimmedActivity],
    });
    setNewActivity('');
    // Feedback visual
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newActivity, profile]);

  const removeActivity = useCallback((index: number) => {
    const updated = [...(profile.favorite_activities || [])];
    updated.splice(index, 1);
    setProfile({ ...profile, favorite_activities: updated });
    // Feedback visual
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [profile]);

  const addInterest = useCallback(() => {
    const trimmedInterest = newInterest.trim();
    
    // Validar que no esté vacío
    if (!trimmedInterest) return;
    
    // Validar límite máximo
    if ((profile.interests || []).length >= MAX_ITEMS) {
      Alert.alert(t('yo.limitReachedTitle'), t('yo.limitInterests', { max: MAX_ITEMS }));
      return;
    }
    
    // Validar longitud máxima (50 caracteres)
    if (trimmedInterest.length > 50) {
      Alert.alert(t('yo.tooLongTitle'), t('yo.interestTooLong'));
      return;
    }
    
    // Validar que no sea duplicado (case-insensitive)
    const existingInterests = (profile.interests || []).map(i => i.toLowerCase());
    if (existingInterests.includes(trimmedInterest.toLowerCase())) {
      Alert.alert(t('yo.duplicateTitle'), t('yo.duplicateInterest'));
      return;
    }
    
    setProfile({
      ...profile,
      interests: [...(profile.interests || []), trimmedInterest],
    });
    setNewInterest('');
    // Feedback visual
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newInterest, profile]);

  const removeInterest = useCallback((index: number) => {
    const updated = [...(profile.interests || [])];
    updated.splice(index, 1);
    setProfile({ ...profile, interests: updated });
    // Feedback visual
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [profile]);

  const completedDays = progressData.filter(day => day.hasCheckIn).length;
  const totalDays = progressData.length;
  const consistencyPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Generar insights emocionales
  const emotionalInsights = useMemo(() => {
    return generateEmotionalInsights(progressData, currentStreak, locale);
  }, [progressData, currentStreak, locale]);

  const displayName = useMemo(() => {
    const fromProfile = profile.full_name?.trim();
    if (fromProfile) return fromProfile;
    const meta = user?.user_metadata;
    if (meta && typeof meta.full_name === 'string' && meta.full_name.trim()) {
      return meta.full_name.trim();
    }
    return t('yo.welcomeName');
  }, [profile.full_name, user?.user_metadata, t]);

  const avatarLetter = useMemo(() => {
    const fromProfile = profile.full_name?.trim();
    const fromMeta =
      typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
    const base = fromProfile || fromMeta;
    if (base) return base[0]!.toUpperCase();
    return user?.email?.[0]?.toUpperCase() ?? 'K';
  }, [profile.full_name, user?.user_metadata?.full_name, user?.email]);

  /** Al abrir el modal, sincroniza el campo nombre con perfil o metadata. */
  useEffect(() => {
    if (!showEditProfile) return;
    const fromProfile = profile.full_name?.trim() ?? '';
    const fromMeta =
      typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
    setFullNameInput(fromProfile || fromMeta);
  }, [showEditProfile, profile.full_name, user?.user_metadata?.full_name]);

  const streakLevel = useMemo(() => {
    if (currentStreak >= 90) {
      return {
        label: t('yo.streakLevelMaster'),
        icon: '⭐',
        colors: [THEME.colors.gradient.pink, THEME.colors.accent.yellow] as const,
      };
    }
    if (currentStreak >= 60) {
      return {
        label: t('yo.streakLevelExpert'),
        icon: '🌟',
        colors: [THEME.colors.gradient.pink, THEME.colors.accent.orange] as const,
      };
    }
    if (currentStreak >= 30) {
      return {
        label: t('yo.streakLevelAdvanced'),
        icon: '✨',
        colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
      };
    }
    if (currentStreak >= 14) {
      return {
        label: t('yo.streakLevelConsistent'),
        icon: '💫',
        colors: [THEME.colors.gradient.blue, THEME.colors.category.personal] as const,
      };
    }
    if (currentStreak >= 7) {
      return {
        label: t('yo.streakLevelOnTrack'),
        icon: '🔥',
        colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
      };
    }
    return {
      label: t('yo.streakLevelStarting'),
      icon: '🔥',
      colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
    };
  }, [currentStreak, t]);

  const dailyStreakEncouragement = useMemo(
    () => pickDailyStreakEncouragement(currentStreak, streakMessageDayKey, locale),
    [currentStreak, streakMessageDayKey, locale],
  );

  // Función para manejar pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProgressData(),
        loadStreak(),
        loadProfile(),
      ]);
    } catch (error) {
      logger.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  };


  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      // Validar y parsear edad
      let ageValue: number | undefined = undefined;
      if (ageInput.trim()) {
        const parsedAge = parseInt(ageInput.trim());
        if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
          setProfileError(t('yo.invalidAgeBody'));
          setIsSavingProfile(false);
          return;
        }
        ageValue = parsedAge;
      }

      const trimmedDisplayName = fullNameInput.trim();

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedDisplayName || null,
          age: ageValue,
          favorite_activities: profile.favorite_activities || [],
          interests: profile.interests || [],
        })
        .eq('id', user.id);

      if (error) {
        logger.error('Error guardando perfil:', error);
        const missingCol =
          (error as { code?: string; message?: string }).code === '42703' ||
          (typeof (error as { message?: string }).message === 'string' &&
            (error as { message: string }).message.includes('does not exist'));
        setProfileError(
          missingCol ? t('yo.profileSaveSchemaError') : t('yo.profileSaveError'),
        );
        setIsSavingProfile(false);
        return;
      }

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { full_name: trimmedDisplayName },
      });
      if (metaErr) {
        logger.warn('Nombre guardado en perfil; no se pudo sincronizar en la sesión:', metaErr);
      }

      // Recargar perfil después de guardar
      await loadProfile();
      
      Alert.alert(t('yo.profileSavedTitle'), t('yo.profileSavedBody'));
      setShowEditProfile(false);
    } catch (error) {
      logger.error('Error inesperado:', error);
      setProfileError(t('yo.profileSaveUnexpected'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Confetti celebración - Deshabilitado temporalmente por incompatibilidad con Expo Go */}
      {/* {showConfetti && <ConfettiCelebration />} */}

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + THEME.spacing.lg }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.gradient.blue}
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          />
        }
      >
        <TouchableOpacity
          style={styles.header}
          onPress={() => setShowEditProfile(true)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('yoExtra.editProfileA11y')}
          accessibilityHint={t('yoExtra.editProfileHint')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.headerEditHint}>
            <Edit size={14} color={THEME.colors.gradient.blue} />
            <Text style={styles.headerEditHintText}>{t('yo.tapToEdit')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('yo.progressTitle')}</Text>
          
          {/* Streak Section */}
          <LinearGradient
            colors={streakLevel.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakLeftRow}>
              <StreakAura contentSize={48} intensity={Math.min(1, currentStreak / 21)}>
                <View style={styles.streakSymbolBadge}>
                  <Flame size={26} color={THEME.colors.fill[100]} strokeWidth={2.25} />
                </View>
              </StreakAura>
              <View style={styles.streakContent}>
              {/* Número de racha */}
              <View style={styles.streakNumberContainer}>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>
                  {currentStreak === 1 ? t('yo.streakDayOne') : t('yo.streakDayMany')}
                </Text>
              </View>

              {/* Nivel de racha */}
              {currentStreak > 0 && (
                <View style={styles.streakLevelContainer}>
                  <Text style={styles.streakLevelIcon}>{streakLevel.icon}</Text>
                  <Text style={styles.streakLevelLabel}>{streakLevel.label}</Text>
                </View>
              )}
            </View>
            </View>

            {/* Mensaje motivacional */}
            {currentStreak > 0 ? (
              <Text style={styles.streakMessage}>
                {dailyStreakEncouragement}
              </Text>
            ) : (
              <Text style={styles.streakMessage}>{t('yo.streakEmpty')}</Text>
            )}
          </LinearGradient>
          {!streakExplainerDismissed ? (
            <View style={styles.streakExplainerBox}>
              <Text style={styles.streakExplainer}>{t('yo.streakExplainer')}</Text>
              <TouchableOpacity
                onPress={dismissStreakExplainer}
                style={styles.streakExplainerDismissBtn}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t('yoExtra.hideStreakExplainerA11y')}
              >
                <Text style={styles.streakExplainerDismissText}>{t('yo.streakExplainerDismiss')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.sectionSubtitle}>
            {t('yo.consistencyLead')}{' '}
            <Text style={styles.accentText}>{t('yo.twoWeeks')}</Text>
          </Text>
          
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{consistencyPercentage}%</Text>
              <Text style={styles.progressSubtitle}>
                {t('yo.daysProgress', { completed: completedDays, total: totalDays })}
              </Text>
            </View>
            <ProgressChart data={progressData} />
          </View>

          {/* Insights emocionales */}
          {emotionalInsights.length > 0 && (
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>{t('yo.patternsTitle')}</Text>
              {emotionalInsights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  {insight.emoji && (
                    <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                  )}
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('yo.myProfileSection')}</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => setShowEditProfile(true)}
            accessibilityRole="button"
            accessibilityLabel={t('yoExtra.editProfileA11y')}
            accessibilityHint={t('yoExtra.editProfileMenuHint', {
              activities: profile.favorite_activities?.length || 0,
              interests: profile.interests?.length || 0,
            })}
          >
            <Edit size={24} color={THEME.colors.gradient.blue} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>{t('yo.editProfile')}</Text>
              <Text style={styles.menuItemSubtext}>
                {(() => {
                  const n =
                    profile.full_name?.trim() ||
                    (typeof user?.user_metadata?.full_name === 'string'
                      ? user.user_metadata.full_name.trim()
                      : '');
                  return n ? `${n} · ` : '';
                })()}
                {t('yo.menuActivitiesInterests', {
                  activities: profile.favorite_activities?.length || 0,
                  interests: profile.interests?.length || 0,
                })}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => setShowProjects(true)}
            accessibilityRole="button"
            accessibilityLabel={t('yoExtra.manageProjectsA11y')}
            accessibilityHint={t('yoExtra.manageProjectsHint')}
          >
            <Folder size={24} color={THEME.colors.gradient.blue} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>{t('yo.manageProjects')}</Text>
              <Text style={styles.menuItemSubtext}>{t('yo.manageProjectsSub')}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>{t('yo.configSection')}</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel={t('yo.settings')}
            accessibilityHint={t('yoExtra.settingsHint')}
          >
            <Settings size={24} color={THEME.colors.text.main} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>{t('yo.settings')}</Text>
              <Text style={styles.menuItemSubtext}>{t('yo.settingsSub')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/paywall')}
            accessibilityRole="button"
            accessibilityLabel={t('yo.subscription')}
            accessibilityHint={t('yoExtra2.a11yManagePremium')}
          >
            <Crown size={24} color={THEME.colors.gradient.blue} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>{t('yo.subscription')}</Text>
              <Text style={styles.menuItemSubtext}>{t('yo.subscriptionSub')}</Text>
            </View>
          </TouchableOpacity>

          {/* Botón de desarrollo para resetear onboarding */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem('hasSeenQuickOnboarding');
                  Alert.alert(t('yo.devResetTitle'), t('yo.devResetBody'), [{ text: t('errors.ok') }]);
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                } catch (error) {
                  logger.error('Error reseteando onboarding:', error);
                  Alert.alert(t('yoExtra.resetOnboardingError'), t('yoExtra.resetOnboardingErrorBody'));
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={t('yoExtra.devResetA11y')}
              accessibilityHint={t('yoExtra.devResetHint')}
            >
              <RotateCcw size={24} color={THEME.colors.text.secondary} />
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemText, { color: THEME.colors.text.secondary }]}>
                  {t('yo.devResetLabel')}
                </Text>
                <Text style={styles.menuItemSubtext}>{t('yo.devResetSub')}</Text>
              </View>
            </TouchableOpacity>
          )}

        </View>

        {!subscriptionLoading && !isSubscribed ? (
          <PremiumTeaserCard title={t('yo.subscription')} body={t('premiumTeaser.yoBody')} />
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Koraa v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={styles.footerSubtext}>
            {t('yo.footerTagline')}{' '}
            <Text style={styles.footerAccent}>{t('yo.footerAccent')}</Text>
            {'\n'}
            {t('yo.footerTaglineEnd')}
          </Text>
        </View>
      </ScrollView>

      {/* Modal de edición de perfil */}
      <Modal
        visible={showEditProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isSavingProfile) {
            setShowEditProfile(false);
            setProfileError(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('yoExtra.profileModalTitle')}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!isSavingProfile) {
                      setShowEditProfile(false);
                      setProfileError(null);
                    }
                  }}
                  style={styles.modalCloseButton}
                  disabled={isSavingProfile}
                  accessibilityRole="button"
                  accessibilityLabel={t('yoExtra.closeModalA11y')}
                  accessibilityHint={t('yoExtra.closeModalHint')}
                  accessibilityState={{ disabled: isSavingProfile }}
                >
                  <X size={24} color={THEME.colors.text.main} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={[styles.modalScrollView, { maxHeight: PROFILE_MODAL_SCROLL_MAX }]}
                contentContainerStyle={styles.modalScrollContent}
                nestedScrollEnabled
              >
              <Text style={styles.modalIntro}>{t('yoExtra.profileModalIntro')}</Text>
              {/* Mensaje de error si existe */}
              {profileError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{profileError}</Text>
                </View>
              )}

              {/* Nombre para mostrar */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.yourNameLabel')}</Text>
                <TextInput
                  style={styles.formInput}
                  value={fullNameInput}
                  onChangeText={setFullNameInput}
                  placeholder={t('yoExtra.namePlaceholder')}
                  placeholderTextColor={THEME.colors.text.secondary}
                  autoCapitalize="words"
                  autoCorrect
                  editable={!isSavingProfile}
                  maxLength={80}
                  accessibilityLabel={t('yoExtra.yourNameA11y')}
                  accessibilityHint={t('yoExtra.yourNameHint')}
                />
                <Text style={styles.formHelpText}>{t('yoExtra.nameHelp')}</Text>
              </View>

              {/* Edad */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.ageLabel')}</Text>
                <TextInput
                  style={styles.formInput}
                  value={ageInput}
                  onChangeText={(text) => {
                    // Solo permitir números
                    const numericText = text.replace(/[^0-9]/g, '');
                    if (numericText === '') {
                      setAgeInput('');
                      return;
                    }
                    
                    const age = parseInt(numericText);
                    
                    // Validar rango 13-120
                    if (age >= 13 && age <= 120) {
                      setAgeInput(numericText);
                    } else if (age > 120) {
                      Alert.alert(t('yo.invalidAgeTitle'), t('yo.invalidAgeBody'));
                      setAgeInput('120'); // Limitar a máximo
                    } else if (age < 13 && numericText.length > 0) {
                      // No permitir valores menores a 13
                      if (numericText.length === 1) {
                        // Si solo tiene 1 dígito y es menor a 1, permitir (puede estar escribiendo)
                        if (age >= 1) {
                          setAgeInput(numericText);
                        } else {
                          setAgeInput('');
                        }
                      } else {
                        // Si tiene 2 dígitos y es menor a 13, bloquear
                        Alert.alert(t('yo.invalidAgeTitle'), t('yo.invalidAgeBody'));
                        setAgeInput('13'); // Establecer mínimo
                      }
                    }
                  }}
                  placeholder={t('yoExtra.agePlaceholder')}
                  placeholderTextColor={THEME.colors.text.secondary}
                  keyboardType="number-pad"
                  editable={!isSavingProfile}
                  maxLength={3}
                />
                <Text style={styles.formHelpText}>{t('yoExtra.ageHelp')}</Text>
              </View>

              {/* Actividades favoritas */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.activitiesLabel')}</Text>
                {(profile.favorite_activities || []).length === 0 ? (
                  <Text style={styles.emptyListText}>{t('yoExtra.activitiesEmpty')}</Text>
                ) : (
                  <View style={styles.chipContainer}>
                    {(profile.favorite_activities || []).map((activity, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{activity}</Text>
                        <TouchableOpacity
                          onPress={() => removeActivity(index)}
                          style={styles.chipRemove}
                          accessibilityRole="button"
                          accessibilityLabel={t('yoExtra.removeActivityA11y', { name: activity })}
                          accessibilityHint={t('yoExtra.removeActivityHint')}
                        >
                          <X size={14} color={THEME.colors.text.secondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.addInputContainer}>
                  <TextInput
                    style={styles.addInput}
                    value={newActivity}
                    onChangeText={setNewActivity}
                    placeholder={t('yoExtra.activitiesPlaceholder')}
                    placeholderTextColor={THEME.colors.text.secondary}
                    onSubmitEditing={addActivity}
                    editable={!isSavingProfile}
                    maxLength={50}
                    accessibilityLabel={t('yoExtra.addActivityFieldA11y')}
                    accessibilityHint={t('yoExtra.addActivityFieldHint')}
                    accessibilityRole="none"
                  />
                  <TouchableOpacity
                    style={[styles.addButton, (!newActivity.trim() || isSavingProfile) && styles.addButtonDisabled]}
                    onPress={addActivity}
                    disabled={!newActivity.trim() || isSavingProfile}
                    accessibilityRole="button"
                    accessibilityLabel={t('yoExtra.addActivityA11y')}
                    accessibilityHint={t('yoExtra.addActivityHint')}
                    accessibilityState={{ disabled: !newActivity.trim() || isSavingProfile }}
                  >
                    <Plus size={20} color={THEME.colors.fill[100]} />
                  </TouchableOpacity>
                </View>
                {newActivity.length > 40 && (
                  <Text style={styles.lengthWarning}>
                    {t('yoExtra.charsRemaining', { count: 50 - newActivity.length })}
                  </Text>
                )}
              </View>

              {/* Intereses */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.interestsLabel')}</Text>
                {(profile.interests || []).length === 0 ? (
                  <Text style={styles.emptyListText}>{t('yoExtra.interestsEmpty')}</Text>
                ) : (
                  <View style={styles.chipContainer}>
                    {(profile.interests || []).map((interest, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{interest}</Text>
                        <TouchableOpacity
                          onPress={() => removeInterest(index)}
                          style={styles.chipRemove}
                          accessibilityRole="button"
                          accessibilityLabel={t('yoExtra.removeInterestA11y', { name: interest })}
                          accessibilityHint={t('yoExtra.removeInterestHint')}
                        >
                          <X size={14} color={THEME.colors.text.secondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.addInputContainer}>
                  <TextInput
                    style={styles.addInput}
                    value={newInterest}
                    onChangeText={setNewInterest}
                    placeholder={t('yoExtra.interestsPlaceholder')}
                    placeholderTextColor={THEME.colors.text.secondary}
                    onSubmitEditing={addInterest}
                    editable={!isSavingProfile}
                    maxLength={50}
                    accessibilityLabel={t('yoExtra.addInterestFieldA11y')}
                    accessibilityHint={t('yoExtra.addInterestFieldHint')}
                    accessibilityRole="none"
                  />
                  <TouchableOpacity
                    style={[styles.addButton, (!newInterest.trim() || isSavingProfile) && styles.addButtonDisabled]}
                    onPress={addInterest}
                    disabled={!newInterest.trim() || isSavingProfile}
                    accessibilityRole="button"
                    accessibilityLabel={t('yoExtra.addInterestA11y')}
                    accessibilityHint={t('yoExtra.addInterestHint')}
                    accessibilityState={{ disabled: !newInterest.trim() || isSavingProfile }}
                  >
                    <Plus size={20} color={THEME.colors.fill[100]} />
                  </TouchableOpacity>
                </View>
                {newInterest.length > 40 && (
                  <Text style={styles.lengthWarning}>
                    {t('yoExtra.charsRemaining', { count: 50 - newInterest.length })}
                  </Text>
                )}
              </View>

              <Text style={styles.formHelpText}>{t('yoExtra.profileDataHelp')}</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  if (!isSavingProfile) {
                    setShowEditProfile(false);
                    setProfileError(null);
                  }
                }}
                disabled={isSavingProfile}
              >
                <Text style={styles.modalButtonCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  isSavingProfile && styles.modalButtonDisabled,
                ]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <Text style={styles.modalButtonSaveText}>{t('yoExtra.saving')}</Text>
                ) : (
                  <Text style={styles.modalButtonSaveText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal de gestión de proyectos */}
      <Modal
        visible={showProjects}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProjects(false)}
      >
        <View style={styles.projectsModalOverlay}>
          <View style={styles.projectsModalContent}>
            <View style={styles.projectsModalHeader}>
              <Text style={styles.projectsModalTitle}>{t('yoExtra.projectsModalTitle')}</Text>
              <TouchableOpacity
                onPress={() => setShowProjects(false)}
                style={styles.projectsModalCloseButton}
                accessibilityRole="button"
                accessibilityLabel={t('yoExtra.projectsCloseA11y')}
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>
            {user && (
              <ProjectManager
                userId={user.id}
                onProjectSelect={() => {
                  // Opcional: hacer algo cuando se selecciona un proyecto
                }}
              />
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  avatarText: {
    ...THEME.typography.h1,
    color: THEME.colors.fill[100],
  },
  name: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  email: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  headerEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  headerEditHintText: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  sectionSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 24,
  },
  accentText: {
    fontFamily: THEME.fonts.accent.italic,
  },
  streakCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: THEME.spacing.sm,
  },
  streakLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: THEME.spacing.sm,
  },
  streakSymbolBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.borderStrong,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: THEME.spacing.md,
  },
  streakNumberContainer: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    color: THEME.colors.fill[100],
    lineHeight: 36,
    fontFamily: THEME.fonts.heading.bold,
  },
  streakLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 11,
  },
  streakLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
  },
  streakLevelIcon: {
    fontSize: 14,
  },
  streakLevelLabel: {
    ...THEME.typography.small,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 11,
  },
  streakMessage: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
    fontSize: 11,
    width: '100%',
    textAlign: 'left',
    lineHeight: 16,
  },
  streakExplainerBox: {
    marginBottom: THEME.spacing.md,
    marginTop: THEME.spacing.xs,
  },
  streakExplainer: {
    ...THEME.typography.caption,
    color: THEME.colors.accent.purple,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: THEME.spacing.xs,
    opacity: 0.92,
  },
  streakExplainerDismissBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: THEME.spacing.xs,
  },
  streakExplainerDismissText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 12,
    color: THEME.colors.accent.purple,
    textDecorationLine: 'underline',
  },
  accentTextWhite: {
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.fill[100],
  },
  progressCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
  },
  progressTitle: {
    fontSize: 28,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  progressSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 11,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: THEME.colors.stroke[100],
    marginVertical: THEME.spacing.md,
  },
  menuItemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    width: '100%',
    maxHeight: Math.min(WINDOW_H * 0.92, 720),
    paddingBottom: THEME.spacing.lg,
  },
  modalScrollView: {},
  modalIntro: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.md,
  },
  modalScrollContent: {
    padding: THEME.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
  },
  modalCloseButton: {
    padding: THEME.spacing.xs,
  },
  formSection: {
    marginBottom: THEME.spacing.lg,
  },
  formLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.sm,
  },
  formInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.gradient.blue + '20',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    gap: THEME.spacing.xs,
  },
  chipText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
  },
  chipRemove: {
    padding: 2,
  },
  addInputContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.gradient.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  formHelpText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: THEME.colors.fill[200],
  },
  modalButtonSave: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  modalButtonCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalButtonSaveText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.medium,
  },
  footer: {
    alignItems: 'center',
    paddingTop: THEME.spacing.xl,
  },
  footerText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  footerSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerAccent: {
    fontFamily: THEME.fonts.accent.italic,
  },
  insightsCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  insightsTitle: {
    fontSize: 16,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.xs,
    gap: THEME.spacing.xs,
  },
  insightEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  insightText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: THEME.colors.errorSurface,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.errorBorder,
  },
  errorText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.medium,
  },
  lengthWarning: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    fontStyle: 'italic',
  },
  emptyListText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: THEME.spacing.md,
  },
  projectsModalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  projectsModalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '90%',
    flex: 1,
  },
  projectsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.fill[200],
  },
  projectsModalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  projectsModalCloseButton: {
    padding: THEME.spacing.xs,
  },
});
