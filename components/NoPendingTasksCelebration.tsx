import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { PartyPopper, X } from 'lucide-react-native';

interface NoPendingTasksCelebrationProps {
  onDismiss: () => void;
}

export function NoPendingTasksCelebration({ onDismiss }: NoPendingTasksCelebrationProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onDismiss}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <X size={20} color={THEME.colors.fill[100]} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <PartyPopper size={48} color={THEME.colors.fill[100]} />
        </View>

        <Text style={styles.title}>¡Increíble trabajo!</Text>
        <Text style={styles.message}>
          Has completado todas tus tareas del día. Es momento de descansar y disfrutar.
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    ...THEME.shadows.soft,
  },
  closeButton: {
    position: 'absolute',
    top: THEME.spacing.md,
    right: THEME.spacing.md,
    padding: THEME.spacing.xs,
  },
  iconContainer: {
    marginBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
    fontFamily: THEME.fonts.heading.bold,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.95,
  },
});
