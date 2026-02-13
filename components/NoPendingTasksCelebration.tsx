import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Moon, CheckCircle2 } from 'lucide-react-native';

interface NoPendingTasksCelebrationProps {
  recommendation?: {
    message: string;
    emoji: string;
  };
  onDismiss?: () => void;
}

export function NoPendingTasksCelebration({ recommendation, onDismiss }: NoPendingTasksCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const flowOpacity = useRef(new Animated.Value(0)).current;

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

    // Flujo aparece al final
    Animated.timing(flowOpacity, {
      toValue: 1,
      duration: 400,
      delay: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  const iconRotate = iconRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  if (!isVisible) return null;

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
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCheckContainer}>
            <CheckCircle2 size={24} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Hoy está completo.</Text>
            <Text style={styles.subtitle}>Descansa y disfruta del momento presente</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="De acuerdo"
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dismissButtonGradient}
          >
            <Text style={styles.dismissButtonText}>De acuerdo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  iconCheckContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...THEME.typography.h3,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    opacity: 0.95,
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
  },
});
