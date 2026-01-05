import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LogOut, Settings, HelpCircle, Flame } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { ProgressChart } from '@/components/ProgressChart';

type DayData = {
  date: string;
  hasCheckIn: boolean;
  dayLabel: string;
  emotion?: string;
  energyLevel?: number;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [progressData, setProgressData] = useState<DayData[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  useEffect(() => {
    loadProgressData();
    loadStreak();
  }, [user]);

  const loadProgressData = async () => {
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
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/onboarding/welcome');
  };

  const loadStreak = async () => {
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
  };

  const createTestCheckIns = async () => {
    if (!user) return;

    const EMOTIONS = ['Tranquila', 'Enfocada', 'Motivada', 'Ansiosa', 'Agotada', 'Abrumada'];
    const TIME_OPTIONS = ['Poco (1-2hrs)', 'Medio (2-4hrs)', 'Bastante (4-6hrs)', 'Todo el día'];
    const FOCUS_OPTIONS = ['Muy distraída', 'Algo distraída', 'Normal', 'Enfocada', 'Súper enfocada'];

    const today = new Date();
    const checkIns = [];

    // Crear check-ins para los últimos 14 días
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Variar emociones y energía para mostrar diferentes colores
      const emotionIndex = i % EMOTIONS.length;
      const emotion = EMOTIONS[emotionIndex];
      
      // Variar energía (1-5) para mostrar diferentes alturas
      const energyLevel = (i % 5) + 1;
      
      // Valores aleatorios pero consistentes para tiempo y enfoque
      const timeIndex = i % TIME_OPTIONS.length;
      const focusIndex = i % FOCUS_OPTIONS.length;

      checkIns.push({
        user_id: user.id,
        date: dateString,
        emotion: emotion,
        energy_level: energyLevel,
        available_time: TIME_OPTIONS[timeIndex],
        focus_level: FOCUS_OPTIONS[focusIndex],
      });
    }

    // Insertar check-ins en la base de datos
    const { error } = await supabase
      .from('daily_check_ins')
      .upsert(checkIns, { onConflict: 'user_id,date' });

    if (error) {
      console.error('Error creando check-ins de prueba:', error);
      Alert.alert('Error', 'Error al crear check-ins de prueba');
      return;
    }

    // Recargar datos
    await loadProgressData();
    await loadStreak();
    Alert.alert('Éxito', `✅ Creados ${checkIns.length} check-ins de prueba`);
  };

  const completedDays = progressData.filter(day => day.hasCheckIn).length;
  const totalDays = progressData.length;
  const consistencyPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <View style={styles.streakCard}>
            <View style={styles.streakContent}>
              <View style={styles.streakIconContainer}>
                <Flame size={32} color={THEME.colors.gradient.pink} />
              </View>
              <View style={styles.streakTextContainer}>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>
                  {currentStreak === 1 ? 'día consecutivo' : 'días consecutivos'}
                </Text>
              </View>
            </View>
            {currentStreak > 0 && (
              <Text style={styles.streakMessage}>
                ¡Sigue así! Cada día cuenta{' '}
                <Text style={styles.accentText}>sintiendo</Text>
              </Text>
            )}
          </View>

          <Text style={styles.sectionSubtitle}>
            Consistencia de check-ins en las últimas{' '}
            <Text style={styles.accentText}>2 semanas</Text>
          </Text>
          
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{consistencyPercentage}%</Text>
              <Text style={styles.progressSubtitle}>
                {completedDays} de {totalDays} días
              </Text>
            </View>
            <ProgressChart data={progressData} />
          </View>
        </View>

        {/* Botón temporal para crear check-ins de prueba */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={createTestCheckIns}
            activeOpacity={0.7}
          >
            <Text style={styles.testButtonText}>
              🧪 Crear check-ins de prueba (14 días)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Settings size={24} color={THEME.colors.text.main} />
            <Text style={styles.menuItemText}>Ajustes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <HelpCircle size={24} color={THEME.colors.text.main} />
            <Text style={styles.menuItemText}>Ayuda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSignOut}
            activeOpacity={0.7}
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
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
  },
  streakIconContainer: {
    marginRight: THEME.spacing.sm,
  },
  streakTextContainer: {
    alignItems: 'flex-start',
  },
  streakNumber: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    lineHeight: 40,
  },
  streakLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  streakMessage: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  progressCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  progressTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  progressSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  menuItemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
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
  testButton: {
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  testButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
});
