import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { memo, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';

const getMoodEmoji = (mood: string): string => {
  const moodLower = mood.toLowerCase();
  switch (moodLower) {
    case 'tranquila':
      return '😌';
    case 'enfocada':
      return '😊';
    case 'motivada':
      return '✨';
    case 'ansiosa':
      return '😰';
    case 'agotada':
      return '😔';
    case 'abrumada':
      return '🥺';
    default:
      return '💭';
  }
};

interface MoodCardProps {
  todayMood: string;
  energy: string;
  time: string;
  focusLevel: string;
  onRefresh: () => void;
}

export const MoodCard = memo(function MoodCard({ todayMood, energy, time, focusLevel, onRefresh }: MoodCardProps) {
  const moodTitle = useMemo(
    () => todayMood.charAt(0).toUpperCase() + todayMood.slice(1),
    [todayMood]
  );

  const moodEmoji = useMemo(
    () => getMoodEmoji(todayMood),
    [todayMood]
  );

  const hasStats = useMemo(
    () => !!(energy || time || focusLevel),
    [energy, time, focusLevel]
  );

  return (
    <LinearGradient
      colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.moodCard}
    >
      <View style={styles.moodHeader}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Actualizar información"
          accessibilityHint="Recarga el check-in y las tareas del día"
        >
          <RefreshCw size={20} color={THEME.colors.fill[100]} />
        </TouchableOpacity>
        <View style={styles.moodTitleCenterContainer}>
          <Text style={styles.moodLabel}>Hoy te sientes</Text>
          <Text style={styles.moodTitle}>
            {moodEmoji} {moodTitle}
          </Text>
        </View>
        <View style={styles.refreshButtonPlaceholder} />
      </View>
      {hasStats ? (
        <View style={styles.moodStats}>
          {energy && (
            <View style={styles.moodStatItem}>
              <Text style={styles.moodStatLabel}>Energía</Text>
              <Text style={styles.moodStatValue}>{energy}</Text>
            </View>
          )}
          {time && (
            <View style={styles.moodStatItem}>
              <Text style={styles.moodStatLabel}>Tiempo disponible</Text>
              <Text style={styles.moodStatValue}>{time}</Text>
            </View>
          )}
          {focusLevel && (
            <View style={styles.moodStatItem}>
              <Text style={styles.moodStatLabel}>Enfoque</Text>
              <Text style={styles.moodStatValue}>{focusLevel}</Text>
            </View>
          )}
        </View>
      ) : null}
      
      {/* Botón para actualizar check-in */}
      <TouchableOpacity
        style={styles.updateCheckInButton}
        onPress={() => router.push('/(tabs)/sentir')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Actualizar cómo me siento"
        accessibilityHint="Abre la pantalla para actualizar tu estado emocional del día"
      >
        <Text style={styles.updateCheckInButtonText}>
          Actualizar cómo me siento
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.todayMood === nextProps.todayMood &&
    prevProps.energy === nextProps.energy &&
    prevProps.time === nextProps.time &&
    prevProps.focusLevel === nextProps.focusLevel
  );
});

const styles = StyleSheet.create({
  moodCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  moodTitleCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs / 2,
  },
  moodTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
    fontSize: 24,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  refreshButtonPlaceholder: {
    width: 32,
    height: 32,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodStats: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    flexWrap: 'wrap',
  },
  moodStatItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 4,
    minWidth: 80,
  },
  moodStatLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.8,
    fontSize: 10,
    marginBottom: 2,
  },
  moodStatValue: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 13,
  },
  updateCheckInButton: {
    marginTop: THEME.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  updateCheckInButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 11,
  },
});
