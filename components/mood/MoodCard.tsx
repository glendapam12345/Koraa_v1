import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { RefreshCw } from 'lucide-react-native';

interface MoodCardProps {
  todayMood: string;
  energy: string;
  time: string;
  focusLevel: string;
  onRefresh: () => void;
}

<<<<<<< HEAD
const getMoodEmoji = (mood: string): string => {
  const moodLower = mood.toLowerCase();
  switch (moodLower) {
    case 'tranquila':
      return '😌';
    case 'enfocada':
      return '🎯';
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
=======
export function MoodCard({ todayMood, energy, time, focusLevel, onRefresh }: MoodCardProps) {
  const emotionLabel = todayMood ? todayMood.charAt(0).toUpperCase() + todayMood.slice(1) : '';
>>>>>>> 6ef79bacec3f57e8cac55fb1e4deb269bf4a5d5f

  return (
    <LinearGradient
      colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.moodCard}
    >
      <View style={styles.moodHeader}>
        <View>
          <Text style={styles.moodLabel}>Hoy te sientes</Text>
<<<<<<< HEAD
          <View style={styles.moodTitleContainer}>
            <Text style={styles.moodTitle}>
              {moodEmoji} {moodTitle}
            </Text>
          </View>
=======
          <Text style={styles.moodTitle}>{emotionLabel}</Text>
>>>>>>> 6ef79bacec3f57e8cac55fb1e4deb269bf4a5d5f
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Actualizar check-in"
        >
          <RefreshCw size={20} color={THEME.colors.fill[100]} />
        </TouchableOpacity>
      </View>

      <View style={styles.moodStats}>
        {energy && (
          <View style={styles.moodStatItem}>
            <Text style={styles.moodStatLabel}>Energía</Text>
            <Text style={styles.moodStatValue}>{energy}</Text>
          </View>
        )}
        {time && (
          <View style={styles.moodStatItem}>
            <Text style={styles.moodStatLabel}>Tiempo</Text>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  moodCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  moodLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
  },
  moodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodStats: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    flexWrap: 'wrap',
  },
  moodStatItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minWidth: 100,
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
});
