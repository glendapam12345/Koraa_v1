import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import { LogOut, Settings, HelpCircle, Edit, X, Plus, Folder, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { ProgressChart } from '@/components/ProgressChart';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { ProjectManager } from '@/components/projects/ProjectManager';
import * as Haptics from 'expo-haptics';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DayData = {
  date: string;
  hasCheckIn: boolean;
  dayLabel: string;
  emotion?: string;
  energyLevel?: number;
};

type UserProfile = {
  age?: number;
  favorite_activities?: string[];
  interests?: string[];
  other_preferences?: Record<string, unknown>;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [progressData, setProgressData] = useState<DayData[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousStreak, setPreviousStreak] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [ageInput, setAgeInput] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);

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
      const { data, error } = await supabase
        .from('profiles')
        .select('age, favorite_activities, interests, other_preferences')
        .eq('id', user.id)
        .maybeSingle();

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
          age: data.age || undefined,
          favorite_activities: data.favorite_activities || [],
          interests: data.interests || [],
          other_preferences: data.other_preferences || {},
        });
        setAgeInput(data.age ? data.age.toString() : '');
        setProfileError(null); // Limpiar error si se cargó correctamente
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

  // Recargar datos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
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
    router.replace('/onboarding/welcome');
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

  // Función para obtener el nivel de racha y sus colores
  const getStreakLevel = (streak: number) => {
    if (streak >= 90) {
      return {
        label: 'Maestra',
        icon: '⭐',
        colors: [THEME.colors.gradient.pink, '#FFD700'] as const,
        message: '¡Eres una maestra de la consistencia!'
      };
    }
    if (streak >= 60) {
      return {
        label: 'Experta',
        icon: '🌟',
        colors: [THEME.colors.gradient.pink, '#FFA500'] as const,
        message: '¡Nivel experto alcanzado!'
      };
    }
    if (streak >= 30) {
      return {
        label: 'Avanzada',
        icon: '✨',
        colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
        message: '¡Racha avanzada! Sigue así'
      };
    }
    if (streak >= 14) {
      return {
        label: 'Consistente',
        icon: '💫',
        colors: [THEME.colors.gradient.blue, '#9B59B6'] as const,
        message: '¡Excelente consistencia!'
      };
    }
    if (streak >= 7) {
      return {
        label: 'En camino',
        icon: '🔥',
        colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
        message: '¡Buen comienzo! Sigue así'
      };
    }
    return {
      label: 'Comenzando',
      icon: '🔥',
      colors: [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const,
      message: '¡Cada día cuenta!'
    };
  };

  const streakLevel = getStreakLevel(currentStreak);

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

      const { error } = await supabase
        .from('profiles')
        .update({
          age: ageValue,
          favorite_activities: profile.favorite_activities || [],
          interests: profile.interests || [],
        })
        .eq('id', user.id);

      if (error) {
        logger.error('Error guardando perfil:', error);
        const errorMessage = getErrorMessage(error);
        setProfileError(`No se pudo guardar el perfil: ${errorMessage}`);
        setIsSavingProfile(false);
        return;
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
      {/* Confetti celebración */}
      {showConfetti && <ConfettiCelebration />}

      <ScrollView 
        contentContainerStyle={styles.content} 
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
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.[0].toUpperCase() || 'K'}
            </Text>
          </View>
          <Text style={styles.name}>Bienvenida</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu progreso</Text>
          
          {/* Streak Section */}
          <LinearGradient
            colors={streakLevel.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
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

            {/* Mensaje motivacional */}
            {currentStreak > 0 ? (
              <Text style={styles.streakMessage}>
                {streakLevel.message}
              </Text>
            ) : (
              <Text style={styles.streakMessage}>
                ¡Comienza hoy!
              </Text>
            )}
          </LinearGradient>

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
            accessibilityRole="button"
            accessibilityLabel="Ayuda"
            accessibilityHint="Abre la sección de ayuda y soporte"
          >
            <HelpCircle size={24} color={THEME.colors.text.main} />
            <Text style={styles.menuItemText}>Ayuda</Text>
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
          <Text style={styles.footerText}>Kora v1.0.0</Text>
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
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
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
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
              >
              {/* Mensaje de error si existe */}
              {profileError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{profileError}</Text>
                </View>
              )}

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
                Estos datos nos ayudan a darte recomendaciones más personalizadas en Tips
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '90%',
    paddingBottom: THEME.spacing.xl * 2,
  },
  modalScrollView: {
    flex: 1,
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
    backgroundColor: '#FFE5E5',
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    ...THEME.typography.body,
    color: '#FF6B6B',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
