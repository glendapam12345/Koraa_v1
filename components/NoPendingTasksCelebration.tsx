import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Moon, Sparkles, PenTool, Heart, Target, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';

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
        colors={['#FF6B9D', '#FF8E9B', '#FFB3B8']}
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

        {/* Flujo de uso de la app */}
        <Animated.View style={[styles.flowContainer, { opacity: flowOpacity }]}>
          <Text style={styles.flowTitle}>¿Cómo usar Kora?</Text>
          
          <View style={styles.flowSteps}>
            {/* Paso 1: Vaciar */}
            <TouchableOpacity
              style={styles.flowStep}
              onPress={() => router.push('/(tabs)/vaciar')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Paso 1: Vaciar - Agrega tus tareas"
            >
              <View style={styles.flowStepNumber}>
                <PenTool size={20} color="#FFFFFF" />
              </View>
              <View style={styles.flowStepContent}>
                <Text style={styles.flowStepTitle}>Vaciar</Text>
                <Text style={styles.flowStepDesc}>Agrega tus tareas</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.flowArrow}>
              <ArrowRight size={18} color="rgba(255, 255, 255, 0.7)" />
            </View>

            {/* Paso 2: Sentir */}
            <TouchableOpacity
              style={styles.flowStep}
              onPress={() => router.push('/(tabs)/sentir')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Paso 2: Sentir - Di cómo te sientes"
            >
              <View style={styles.flowStepNumber}>
                <Heart size={20} color="#FFFFFF" />
              </View>
              <View style={styles.flowStepContent}>
                <Text style={styles.flowStepTitle}>Sentir</Text>
                <Text style={styles.flowStepDesc}>Di cómo te sientes</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.flowArrow}>
              <ArrowRight size={18} color="rgba(255, 255, 255, 0.7)" />
            </View>

            {/* Paso 3: Inicio */}
            <View style={styles.flowStep}>
              <View style={[styles.flowStepNumber, styles.flowStepNumberActive]}>
                <Target size={20} color="#FFFFFF" />
              </View>
              <View style={styles.flowStepContent}>
                <Text style={styles.flowStepTitle}>Inicio</Text>
                <Text style={styles.flowStepDesc}>Ve tus prioridades</Text>
              </View>
            </View>
          </View>

          <View style={styles.flowTip}>
            <Sparkles size={16} color="#FFFFFF" />
            <Text style={styles.flowTipText}>
              Kora prioriza automáticamente según cómo te sientes
            </Text>
          </View>
        </Animated.View>
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
    marginBottom: THEME.spacing.lg,
  },
  flowContainer: {
    width: '100%',
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  flowTitle: {
    ...THEME.typography.h3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    fontFamily: THEME.fonts.heading.bold,
  },
  flowSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
  flowStep: {
    alignItems: 'center',
    minWidth: 80,
  },
  flowStepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  flowStepNumberActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  flowStepContent: {
    alignItems: 'center',
  },
  flowStepTitle: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
    marginBottom: 2,
  },
  flowStepDesc: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 11,
    textAlign: 'center',
  },
  flowArrow: {
    marginHorizontal: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  flowTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  flowTipText: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    opacity: 0.95,
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
});
