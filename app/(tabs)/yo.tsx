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
import { router, useFocusEffect } from 'expo-router';
import { LogOut, Settings, Circle as HelpCircle, CreditCard as Edit, X, Plus, Folder, RotateCcw, Lock, Bell, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { logger } from '@/lib/logger';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { pickDailyStreakEncouragement, getLocalDateKey } from '@/lib/streakDailyMessages';
import { ProgressChart } from '@/components/ProgressChart';
import { StreakAura } from '@/components/branding/StreakAura';
import { ProjectManager } from '@/components/projects/ProjectManager';
import * as Haptics from 'expo-haptics';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  getDailyReminderTime,
  setDailyReminderTime,
  DAILY_REMINDER_PRESETS,
  formatReminderTime,
} from '@/lib/notificationPreferences';
import { scheduleDailyReminder, checkNotificationPermissions } from '@/hooks/useNotifications';

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
  const { user, signOut } = useAuth();
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [notifReminderTime, setNotifReminderTime] = useState({ hour: 9, minute: 0 });
  const [notifSaving, setNotifSaving] = useState(false);
  /** Clave de día local para rotar mensajes de racha (actualiza al enfocar Yo). */
  const [streakMessageDayKey, setStreakMessageDayKey] = useState(getLocalDateKey);
  const [streakExplainerDismissed, setStreakExplainerDismissed] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STREAK_EXPLAINER_DISMISSED_KEY).then((v) => {
      if (v === '1') setStreakExplainerDismissed(true);
    });
  }, []);

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

      const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const dayLabel = dayLabels[date.getDay()];

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
  }, [user]);

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
        const errorMessage = getErrorMessage(error);
        const friendlyMessage = errorMessage.includes('conexión')
          ? 'No hay conexión a internet. Los datos se cargarán cuando tengas conexión.'
          : `No se pudo cargar tu perfil: ${errorMessage}`;
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
      const errorMessage = getErrorMessage(error);
      setProfileError(`Error al cargar perfil: ${errorMessage}. Intenta recargar la página.`);
    }
  }, [user]);

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

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  const handleChangePassword = async () => {
    setChangePasswordError(null);
    if (newPassword.length < 6) {
      setChangePasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('Las contraseñas no coinciden');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setChangePasswordError(getErrorMessage(error));
        return;
      }
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Listo', 'Tu contraseña se actualizó. La próxima vez que inicies sesión usa la nueva contraseña.');
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    if (!showSettingsModal || Platform.OS === 'web') return;
    void getDailyReminderTime().then(setNotifReminderTime);
  }, [showSettingsModal]);

  const applyNotificationPreset = async (hour: number, minute: number) => {
    if (Platform.OS === 'web') return;
    setNotifSaving(true);
    try {
      await setDailyReminderTime({ hour, minute });
      setNotifReminderTime({ hour, minute });
      const ok = await checkNotificationPermissions();
      if (!ok) {
        Alert.alert(
          'Permisos de notificación',
          'Activa las notificaciones para Koraa en los ajustes del sistema para recibir el recordatorio de Sentir.',
        );
      }
      await scheduleDailyReminder();
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Recordatorio guardado',
        `Te avisaremos sobre las ${formatReminderTime({ hour, minute })} si aún no hiciste check-in ese día.`,
      );
    } catch (e) {
      logger.error('Error guardando recordatorio:', e);
      Alert.alert('Error', 'No se pudo guardar la hora del recordatorio.');
    } finally {
      setNotifSaving(false);
    }
  };

  const MAX_ITEMS = 25; // Límite máximo de actividades/intereses

  const addActivity = useCallback(() => {
    const trimmedActivity = newActivity.trim();
    
    // Validar que no esté vacío
    if (!trimmedActivity) return;
    
    // Validar límite máximo
    if ((profile.favorite_activities || []).length >= MAX_ITEMS) {
      Alert.alert('Límite alcanzado', `Puedes agregar hasta ${MAX_ITEMS} actividades. Elimina algunas para agregar más.`);
      return;
    }
    
    // Validar longitud máxima (50 caracteres)
    if (trimmedActivity.length > 50) {
      Alert.alert('Muy largo', 'La actividad no puede tener más de 50 caracteres');
      return;
    }
    
    // Validar que no sea duplicado (case-insensitive)
    const existingActivities = (profile.favorite_activities || []).map(a => a.toLowerCase());
    if (existingActivities.includes(trimmedActivity.toLowerCase())) {
      Alert.alert('Duplicado', 'Esta actividad ya está en tu lista');
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
      Alert.alert('Límite alcanzado', `Puedes agregar hasta ${MAX_ITEMS} intereses. Elimina algunos para agregar más.`);
      return;
    }
    
    // Validar longitud máxima (50 caracteres)
    if (trimmedInterest.length > 50) {
      Alert.alert('Muy largo', 'El interés no puede tener más de 50 caracteres');
      return;
    }
    
    // Validar que no sea duplicado (case-insensitive)
    const existingInterests = (profile.interests || []).map(i => i.toLowerCase());
    if (existingInterests.includes(trimmedInterest.toLowerCase())) {
      Alert.alert('Duplicado', 'Este interés ya está en tu lista');
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
    return generateEmotionalInsights(progressData, currentStreak);
  }, [progressData, currentStreak]);

  const displayName = useMemo(() => {
    const fromProfile = profile.full_name?.trim();
    if (fromProfile) return fromProfile;
    const meta = user?.user_metadata;
    if (meta && typeof meta.full_name === 'string' && meta.full_name.trim()) {
      return meta.full_name.trim();
    }
    return 'Bienvenida';
  }, [profile.full_name, user?.user_metadata]);

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

  // Nivel de racha: etiqueta, icono y colores (el mensaje largo rota por día en `dailyStreakEncouragement`)
  const getStreakLevel = (streak: number) => {
    if (streak >= 90) {
      return {
        label: 'Maestra',
        icon: '⭐',
        colors: [THEME.colors.gradient.pink, THEME.colors.accent.yellow] as const,
      };
    }
    if (streak >= 60) {
      return {
        label: 'Experta',
        icon: '🌟',
        colors: [THEME.colors.gradient.pink, THEME.colors.accent.orange] as const,
      };
    }
    if (streak >= 30) {
      return {
        label: 'Avanzada',
        icon: '✨',
        colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
      };
    }
    if (streak >= 14) {
      return {
        label: 'Consistente',
        icon: '💫',
        colors: [THEME.colors.gradient.blue, THEME.colors.category.personal] as const,
      };
    }
    if (streak >= 7) {
      return {
        label: 'En camino',
        icon: '🔥',
        colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
      };
    }
    return {
      label: 'Comenzando',
      icon: '🔥',
      colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
    };
  };

  const streakLevel = getStreakLevel(currentStreak);

  const dailyStreakEncouragement = useMemo(
    () => pickDailyStreakEncouragement(currentStreak, streakMessageDayKey),
    [currentStreak, streakMessageDayKey],
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
          setProfileError('La edad debe ser un número entre 13 y 120 años');
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
        const errorMessage = getErrorMessage(error);
        const missingCol =
          (error as { code?: string; message?: string }).code === '42703' ||
          (typeof (error as { message?: string }).message === 'string' &&
            (error as { message: string }).message.includes('does not exist'));
        setProfileError(
          missingCol
            ? 'Faltan columnas en la base de datos. Ejecuta en Supabase el SQL de supabase/migrations/20260321140000_ensure_profiles_personalization_columns.sql'
            : `No se pudo guardar el perfil: ${errorMessage}`,
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
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setShowEditProfile(false);
    } catch (error) {
      logger.error('Error inesperado:', error);
      const errorMessage = getErrorMessage(error);
      setProfileError(`Error inesperado: ${errorMessage}`);
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
          accessibilityLabel="Editar perfil personal"
          accessibilityHint="Abre nombre, edad, actividades e intereses"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.headerEditHint}>
            <Edit size={14} color={THEME.colors.gradient.blue} />
            <Text style={styles.headerEditHintText}>Toca para editar tu perfil</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu progreso</Text>
          
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
                  {currentStreak === 1 ? 'día' : 'días'}
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
              <Text style={styles.streakMessage}>
                Haz tu check-in en Sentir para encender la racha.
              </Text>
            )}
          </LinearGradient>
          {!streakExplainerDismissed ? (
            <View style={styles.streakExplainerBox}>
              <Text style={styles.streakExplainer}>
                Un día cuenta cuando completas Sentir (cómo te sientes y energía). Meditar es un extra y no cambia este
                número.
              </Text>
              <TouchableOpacity
                onPress={dismissStreakExplainer}
                style={styles.streakExplainerDismissBtn}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Ocultar explicación de la racha"
              >
                <Text style={styles.streakExplainerDismissText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.sectionSubtitle}>
            Consistencia de check-ins en las últimas{' '}
            <Text style={styles.accentText}>2 semanas</Text>
          </Text>
          
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{consistencyPercentage}%</Text>
              <Text style={styles.progressSubtitle}>
                {completedDays}/{totalDays} días
              </Text>
            </View>
            <ProgressChart data={progressData} />
          </View>

          {/* Insights emocionales */}
          {emotionalInsights.length > 0 && (
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>Tus patrones emocionales</Text>
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
          <Text style={styles.sectionTitle}>Mi perfil</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => setShowEditProfile(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil personal"
            accessibilityHint={`Abre el modal para editar tu perfil. Tienes ${profile.favorite_activities?.length || 0} actividades y ${profile.interests?.length || 0} intereses`}
          >
            <Edit size={24} color={THEME.colors.gradient.blue} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>Editar perfil personal</Text>
              <Text style={styles.menuItemSubtext}>
                {(() => {
                  const n =
                    profile.full_name?.trim() ||
                    (typeof user?.user_metadata?.full_name === 'string'
                      ? user.user_metadata.full_name.trim()
                      : '');
                  return n ? `${n} · ` : '';
                })()}
                {profile.favorite_activities?.length || 0} actividades • {profile.interests?.length || 0} intereses
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => setShowProjects(true)}
            accessibilityRole="button"
            accessibilityLabel="Gestionar proyectos"
            accessibilityHint="Abre el gestor de proyectos para crear y organizar tus proyectos"
          >
            <Folder size={24} color={THEME.colors.gradient.blue} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>Gestionar proyectos</Text>
              <Text style={styles.menuItemSubtext}>
                Organiza tus tareas por proyectos
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>Configuración</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => setShowSettingsModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
            accessibilityHint="Abre la configuración de la aplicación"
          >
            <Settings size={24} color={THEME.colors.text.main} />
            <Text style={styles.menuItemText}>Ajustes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => router.push('/help')}
            accessibilityRole="button"
            accessibilityLabel="Ayuda"
            accessibilityHint="Abre la sección de ayuda y soporte"
          >
            <HelpCircle size={24} color={THEME.colors.text.main} />
            <Text style={styles.menuItemText}>Ayuda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowChangePassword(true);
              setNewPassword('');
              setConfirmPassword('');
              setChangePasswordError(null);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cambiar contraseña"
            accessibilityHint="Elige una nueva contraseña desde la app"
          >
            <Lock size={24} color={THEME.colors.text.main} />
            <Text style={styles.menuItemText}>Cambiar contraseña</Text>
          </TouchableOpacity>

          {/* Botón de desarrollo para resetear onboarding */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem('hasSeenQuickOnboarding');
                  Alert.alert(
                    'Onboarding reseteado',
                    'El onboarding se mostrará la próxima vez que abras la app. Cierra y vuelve a abrir la app para verlo.',
                    [{ text: 'OK' }]
                  );
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                } catch (error) {
                  logger.error('Error reseteando onboarding:', error);
                  Alert.alert('Error', 'No se pudo resetear el onboarding');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Resetear onboarding (solo desarrollo)"
              accessibilityHint="Limpia el estado del onboarding para probarlo nuevamente"
            >
              <RotateCcw size={24} color={THEME.colors.text.secondary} />
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemText, { color: THEME.colors.text.secondary }]}>
                  Resetear onboarding
                </Text>
                <Text style={styles.menuItemSubtext}>
                  Solo desarrollo
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSignOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            accessibilityHint="Cierra tu sesión y regresa a la pantalla de bienvenida"
          >
            <LogOut size={24} color={THEME.colors.gradient.pink} />
            <Text style={[styles.menuItemText, { color: THEME.colors.gradient.pink }]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Koraa v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={styles.footerSubtext}>
            Organiza tu día{' '}
            <Text style={styles.footerAccent}>sintiendo</Text>
            {'\n'}en lugar de estructurando
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
                <Text style={styles.modalTitle}>Mi perfil personal</Text>
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
                  accessibilityLabel="Cerrar modal"
                  accessibilityHint="Cierra el modal de edición de perfil"
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
              <Text style={styles.modalIntro}>
                Tu nombre, actividades e intereses alimentan las recomendaciones en Inicio.
              </Text>
              {/* Mensaje de error si existe */}
              {profileError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{profileError}</Text>
                </View>
              )}

              {/* Nombre para mostrar */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Tu nombre</Text>
                <TextInput
                  style={styles.formInput}
                  value={fullNameInput}
                  onChangeText={setFullNameInput}
                  placeholder="Cómo quieres que te llamemos"
                  placeholderTextColor={THEME.colors.text.secondary}
                  autoCapitalize="words"
                  autoCorrect
                  editable={!isSavingProfile}
                  maxLength={80}
                  accessibilityLabel="Tu nombre o apodo"
                  accessibilityHint="Se muestra en la cabecera de esta pantalla"
                />
                <Text style={styles.formHelpText}>
                  Opcional. El correo solo se cambia desde el proveedor de cuenta (no aquí).
                </Text>
              </View>

              {/* Edad */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Edad (opcional)</Text>
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
                      Alert.alert('Edad inválida', 'La edad debe ser entre 13 y 120 años');
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
                        Alert.alert('Edad inválida', 'La edad debe ser entre 13 y 120 años');
                        setAgeInput('13'); // Establecer mínimo
                      }
                    }
                  }}
                  placeholder="Ej: 28"
                  placeholderTextColor={THEME.colors.text.secondary}
                  keyboardType="number-pad"
                  editable={!isSavingProfile}
                  maxLength={3}
                />
                <Text style={styles.formHelpText}>
                  Debe ser un número entre 13 y 120 años
                </Text>
              </View>

              {/* Actividades favoritas */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Actividades favoritas</Text>
                {(profile.favorite_activities || []).length === 0 ? (
                  <Text style={styles.emptyListText}>
                    No has agregado actividades aún. Agrega tus actividades favoritas para recibir recomendaciones personalizadas.
                  </Text>
                ) : (
                  <View style={styles.chipContainer}>
                    {(profile.favorite_activities || []).map((activity, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{activity}</Text>
                        <TouchableOpacity
                          onPress={() => removeActivity(index)}
                          style={styles.chipRemove}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar actividad: ${activity}`}
                          accessibilityHint="Elimina esta actividad de tu lista"
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
                    placeholder="Ej: yoga, leer, cocinar..."
                    placeholderTextColor={THEME.colors.text.secondary}
                    onSubmitEditing={addActivity}
                    editable={!isSavingProfile}
                    maxLength={50}
                    accessibilityLabel="Campo para agregar actividad favorita"
                    accessibilityHint="Escribe una actividad que te gusta hacer. Máximo 50 caracteres"
                    accessibilityRole="none"
                  />
                  <TouchableOpacity
                    style={[styles.addButton, (!newActivity.trim() || isSavingProfile) && styles.addButtonDisabled]}
                    onPress={addActivity}
                    disabled={!newActivity.trim() || isSavingProfile}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar actividad"
                    accessibilityHint="Agrega la actividad escrita a tu lista de actividades favoritas"
                    accessibilityState={{ disabled: !newActivity.trim() || isSavingProfile }}
                  >
                    <Plus size={20} color={THEME.colors.fill[100]} />
                  </TouchableOpacity>
                </View>
                {newActivity.length > 40 && (
                  <Text style={styles.lengthWarning}>
                    {50 - newActivity.length} caracteres restantes
                  </Text>
                )}
              </View>

              {/* Intereses */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Intereses</Text>
                {(profile.interests || []).length === 0 ? (
                  <Text style={styles.emptyListText}>
                    No has agregado intereses aún. Agrega tus intereses para recibir recomendaciones más relevantes.
                  </Text>
                ) : (
                  <View style={styles.chipContainer}>
                    {(profile.interests || []).map((interest, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{interest}</Text>
                        <TouchableOpacity
                          onPress={() => removeInterest(index)}
                          style={styles.chipRemove}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar interés: ${interest}`}
                          accessibilityHint="Elimina este interés de tu lista"
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
                    placeholder="Ej: música, viajes, fotografía..."
                    placeholderTextColor={THEME.colors.text.secondary}
                    onSubmitEditing={addInterest}
                    editable={!isSavingProfile}
                    maxLength={50}
                    accessibilityLabel="Campo para agregar interés"
                    accessibilityHint="Escribe un interés o hobby. Máximo 50 caracteres"
                    accessibilityRole="none"
                  />
                  <TouchableOpacity
                    style={[styles.addButton, (!newInterest.trim() || isSavingProfile) && styles.addButtonDisabled]}
                    onPress={addInterest}
                    disabled={!newInterest.trim() || isSavingProfile}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar interés"
                    accessibilityHint="Agrega el interés escrito a tu lista de intereses"
                    accessibilityState={{ disabled: !newInterest.trim() || isSavingProfile }}
                  >
                    <Plus size={20} color={THEME.colors.fill[100]} />
                  </TouchableOpacity>
                </View>
                {newInterest.length > 40 && (
                  <Text style={styles.lengthWarning}>
                    {50 - newInterest.length} caracteres restantes
                  </Text>
                )}
              </View>

              <Text style={styles.formHelpText}>
                Estos datos nos ayudan a darte recomendaciones más personalizadas en Consejos
              </Text>
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
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
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
                  <Text style={styles.modalButtonSaveText}>Guardando...</Text>
                ) : (
                  <Text style={styles.modalButtonSaveText}>Guardar</Text>
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
              <Text style={styles.projectsModalTitle}>Mis Proyectos</Text>
              <TouchableOpacity
                onPress={() => setShowProjects(false)}
                style={styles.projectsModalCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
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

      {/* Modal de ajustes */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajustes</Text>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar ajustes"
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalScrollContent}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowEditProfile(true);
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Editar perfil personal"
              >
                <Edit size={22} color={THEME.colors.gradient.blue} />
                <Text style={styles.menuItemText}>Editar perfil personal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowSettingsModal(false);
                  router.push('/help');
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Ayuda"
              >
                <HelpCircle size={22} color={THEME.colors.text.main} />
                <Text style={styles.menuItemText}>Ayuda</Text>
              </TouchableOpacity>

              {Platform.OS === 'web' ? (
                <Text style={styles.notifWebNote}>
                  En la versión web no hay recordatorios push. Usa la app en el teléfono para programar el aviso de Sentir.
                </Text>
              ) : (
                <View style={styles.notifSection}>
                  <View style={styles.notifSectionHeader}>
                    <Bell size={20} color={THEME.colors.gradient.blue} />
                    <Text style={styles.notifSectionTitle}>Recordatorio Sentir</Text>
                  </View>
                  <Text style={styles.notifSectionHint}>
                    Hora actual: {formatReminderTime(notifReminderTime)}. Te recordamos hacer check-in si ese día aún no lo hiciste.
                  </Text>
                  <View style={styles.notifChipsWrap}>
                    {DAILY_REMINDER_PRESETS.map((p) => (
                      <TouchableOpacity
                        key={p.label}
                        style={[
                          styles.notifChip,
                          notifReminderTime.hour === p.hour &&
                            notifReminderTime.minute === p.minute &&
                            styles.notifChipActive,
                        ]}
                        onPress={() => applyNotificationPreset(p.hour, p.minute)}
                        disabled={notifSaving}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.notifChipText,
                            notifReminderTime.hour === p.hour &&
                              notifReminderTime.minute === p.minute &&
                              styles.notifChipTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowChangePassword(true);
                  setNewPassword('');
                  setConfirmPassword('');
                  setChangePasswordError(null);
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Cambiar contraseña"
              >
                <Lock size={22} color={THEME.colors.text.main} />
                <Text style={styles.menuItemText}>Cambiar contraseña</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowSettingsModal(false);
                  handleSignOut();
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
              >
                <LogOut size={22} color={THEME.colors.gradient.pink} />
                <Text style={[styles.menuItemText, { color: THEME.colors.gradient.pink }]}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal cambiar contraseña */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!changingPassword) {
            setShowChangePassword(false);
            setChangePasswordError(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Elegir nueva contraseña</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!changingPassword) {
                      setShowChangePassword(false);
                      setChangePasswordError(null);
                    }
                  }}
                  style={styles.modalCloseButton}
                  disabled={changingPassword}
                >
                  <X size={24} color={THEME.colors.text.main} />
                </TouchableOpacity>
              </View>
              <Text style={styles.changePasswordHint}>
                Mínimo 6 caracteres. La usarás la próxima vez que inicies sesión.
              </Text>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Nueva contraseña</Text>
                <TextInput
                  style={styles.formInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={THEME.colors.text.secondary}
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Confirmar contraseña</Text>
                <TextInput
                  style={styles.formInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={THEME.colors.text.secondary}
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>
              {changePasswordError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{changePasswordError}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.changePasswordButton, changingPassword && styles.changePasswordButtonDisabled]}
                onPress={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.changePasswordButtonGradient}
                >
                  <Text style={styles.changePasswordButtonText}>
                    {changingPassword ? 'Guardando…' : 'Guardar contraseña'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
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
  notifWebNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 20,
  },
  notifSection: {
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  notifSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  notifSectionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  notifSectionHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 20,
  },
  notifChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  notifChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  notifChipActive: {
    backgroundColor: THEME.colors.fill[100],
    borderColor: THEME.colors.gradient.blue,
  },
  notifChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
  },
  notifChipTextActive: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
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
  changePasswordHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  changePasswordButton: {
    marginTop: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    overflow: 'hidden',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  changePasswordButtonDisabled: {
    opacity: 0.6,
  },
  changePasswordButtonGradient: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePasswordButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontWeight: '600',
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
