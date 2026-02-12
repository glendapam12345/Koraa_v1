import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Moon } from 'lucide-react-native';

interface NoPendingTasksCelebrationProps {
  recommendation?: {
    message: string;
    emoji: string;
  };
}

export function NoPendingTasksCelebration({ recommendation }: NoPendingTasksCelebrationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const recommendationOpacity = useSharedValue(0);

  useEffect(() => {
    // Animación de entrada con spring
    scale.value = withDelay(
      200,
      withSpring(1, {
        damping: 10,
        stiffness: 100,
      })
    );

    opacity.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 100 }));

    // Rotación del icono
    iconRotation.value = withDelay(
      400,
      withSequence(
        withSpring(360, { damping: 8, stiffness: 80 }),
        withSpring(0, { damping: 8, stiffness: 80 })
      )
    );

    // Texto aparece después
    textOpacity.value = withDelay(600, withSpring(1, { damping: 10, stiffness: 100 }));

    // Recomendación aparece al final
    if (recommendation) {
      recommendationOpacity.value = withDelay(
        1000,
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
  }, [recommendation]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const recommendationStyle = useAnimatedStyle(() => ({
    opacity: recommendationOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Moon size={48} color="#FFFFFF" />
        </Animated.View>

        <Animated.View style={textStyle}>
          <Text style={styles.title}>¡No tienes pendientes para hoy!</Text>
          <Text style={styles.subtitle}>Descansa</Text>
        </Animated.View>

        {recommendation && (
          <Animated.View style={[styles.recommendationContainer, recommendationStyle]}>
            <Text style={styles.recommendationEmoji}>{recommendation.emoji}</Text>
            <Text style={styles.recommendationText}>{recommendation.message}</Text>
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.lg,
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    ...THEME.shadows.soft,
  },
  iconContainer: {
    marginBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.h3,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: THEME.fonts.accent.italic,
  },
  recommendationContainer: {
    marginTop: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    width: '100%',
  },
  recommendationEmoji: {
    fontSize: 32,
    marginBottom: THEME.spacing.xs,
  },
  recommendationText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    paddingHorizontal: THEME.spacing.md,
  },
});
