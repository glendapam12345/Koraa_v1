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
<<<<<<< HEAD
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dismissButtonGradient}
          >
            <Text style={styles.dismissButtonText}>De acuerdo</Text>
          </LinearGradient>
=======
          <X size={20} color={THEME.colors.fill[100]} />
>>>>>>> 6ef79bacec3f57e8cac55fb1e4deb269bf4a5d5f
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
<<<<<<< HEAD
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    alignSelf: 'center',
    marginTop: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  dismissButtonGradient: {
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 15,
    letterSpacing: 0.5,
=======
>>>>>>> 6ef79bacec3f57e8cac55fb1e4deb269bf4a5d5f
  },
});
