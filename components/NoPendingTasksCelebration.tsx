import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Moon, Sparkles } from 'lucide-react-native';

interface NoPendingTasksCelebrationProps {
  recommendation?: {
    message: string;
    emoji: string;
  };
}

export function NoPendingTasksCelebration({ recommendation }: NoPendingTasksCelebrationProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const recommendationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada con spring
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotación del icono
    Animated.sequence([
      Animated.spring(iconRotation, {
        toValue: 360,
        tension: 50,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(iconRotation, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Texto aparece después
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 300,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Recomendación aparece al final
    if (recommendation) {
      Animated.timing(recommendationOpacity, {
        toValue: 1,
        duration: 300,
        delay: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [recommendation]);

  const iconRotate = iconRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: iconRotate }],
            },
          ]}
        >
          <Moon size={48} color="#FFFFFF" />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.title}>¡No tienes pendientes para hoy!</Text>
          <Text style={styles.subtitle}>Descansa</Text>
        </Animated.View>

        {recommendation && (
          <Animated.View
            style={[
              styles.recommendationContainer,
              {
                opacity: recommendationOpacity,
              },
            ]}
          >
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
