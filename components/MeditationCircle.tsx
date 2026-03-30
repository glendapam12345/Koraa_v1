import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { THEME } from '@/constants/theme';
import { X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type MeditationCircleProps = {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
  type: 'morning' | 'evening';
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MeditationCircle({ visible, onComplete, onClose, type }: MeditationCircleProps) {
  const [isActive, setIsActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const breatheScale = useSharedValue(1);

  const CIRCLE_SIZE = 280;
  const STROKE_WIDTH = 12;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const INHALE_DURATION = 4000; // 4 segundos
  const HOLD_DURATION = 4000; // 4 segundos
  const EXHALE_DURATION = 4000; // 4 segundos
  const TOTAL_CYCLES = 3;

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      scale.value = 1;
      breatheScale.value = 1;
      setIsActive(false);
      setBreathPhase('inhale');
      setCycleCount(0);
      setSecondsRemaining(4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- breatheScale, progress, scale are refs
  }, [visible]);

  // Contador de segundos
  useEffect(() => {
    if (!isActive) return;

    let seconds = 4;
    setSecondsRemaining(4);

    const interval = setInterval(() => {
      seconds -= 1;
      if (seconds >= 0) {
        setSecondsRemaining(seconds);
      } else {
        // Resetear para la siguiente fase
        seconds = 4;
        setSecondsRemaining(4);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, breathPhase]);

  const runBreathCycle = (currentCycle: number) => {
    if (currentCycle >= TOTAL_CYCLES) {
      runOnJS(handleComplete)();
      return;
    }

    // Fase 1: Inhalar (llenar círculo)
    runOnJS(setBreathPhase)('inhale');
    if (Platform.OS !== 'web') {
      runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))();
    }
    progress.value = withTiming(1, {
      duration: INHALE_DURATION,
      easing: Easing.inOut(Easing.ease),
    }, (finished) => {
      if (!finished) return;

      // Fase 2: Aguantar (mantener círculo lleno)
      runOnJS(setBreathPhase)('hold');
      if (Platform.OS !== 'web') {
        runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))();
      }

      // Después de aguantar, exhalar
      setTimeout(() => {
        // Fase 3: Exhalar (vaciar círculo)
        runOnJS(setBreathPhase)('exhale');
        if (Platform.OS !== 'web') {
          runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))();
        }
        progress.value = withTiming(0, {
          duration: EXHALE_DURATION,
          easing: Easing.inOut(Easing.ease),
        }, (finished) => {
          if (!finished) return;

          // Incrementar ciclo y continuar
          const nextCycle = currentCycle + 1;
          runOnJS(setCycleCount)(nextCycle);

          if (nextCycle < TOTAL_CYCLES) {
            // Pequeña pausa entre ciclos
            setTimeout(() => {
              runBreathCycle(nextCycle);
            }, 500);
          } else {
            runOnJS(handleComplete)();
          }
        });
      }, HOLD_DURATION);
    });

    // Animación de respiración del logo (sincronizada con el ciclo completo)
    breatheScale.value = withTiming(1.15, {
      duration: INHALE_DURATION,
      easing: Easing.inOut(Easing.ease),
    }, () => {
      // Mantener el tamaño durante hold
      setTimeout(() => {
        // Reducir durante exhale
        breatheScale.value = withTiming(1, {
          duration: EXHALE_DURATION,
          easing: Easing.inOut(Easing.ease),
        });
      }, HOLD_DURATION);
    });
  };

  const startMeditation = () => {
    setIsActive(true);
    setCycleCount(0);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    runBreathCycle(0);
  };

  const handleComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    scale.value = withTiming(1.2, { duration: 300 }, () => {
      scale.value = withTiming(1, { duration: 300 });
    });
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  const circleAnimatedProps = useAnimatedStyle(() => {
    const strokeDashoffset = interpolate(
      progress.value,
      [0, 1],
      [CIRCUMFERENCE, 0]
    );
    return {
      strokeDashoffset,
    } as any;
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * breatheScale.value },
      ],
    };
  });

  const getMessage = () => {
    if (type === 'morning') {
      return {
        title: 'Meditar para iniciar el día',
        subtitle: 'Respira profundo y conecta con tu intención',
        emoji: '🌅',
      };
    }
    return {
      title: 'Meditar para terminar el día',
      subtitle: 'Suelta el día y descansa tu mente',
      emoji: '🌙',
    };
  };

  const message = getMessage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={THEME.colors.fill[100]} />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.emoji}>{message.emoji}</Text>
            <Text style={styles.title}>{message.title}</Text>
            <Text style={styles.subtitle}>{message.subtitle}</Text>

            <View style={styles.circleContainer}>
              {/* SVG Circle Progress */}
              <Svg
                width={CIRCLE_SIZE}
                height={CIRCLE_SIZE}
                style={styles.svg}
              >
                {/* Background circle */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={THEME.colors.surfaceOverlay.medium}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                {/* Progress circle */}
                <AnimatedCircle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={THEME.colors.fill[100]}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeLinecap="round"
                  animatedProps={circleAnimatedProps}
                  transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                />
              </Svg>

              {/* Logo en el centro */}
              <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                {isActive ? (
                  <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{secondsRemaining}</Text>
                    <Text style={styles.timerLabel}>seg</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoBackground}
                  >
                    <Sparkles size={80} color={THEME.colors.fill[100]} strokeWidth={1.5} />
                  </LinearGradient>
                )}
              </Animated.View>
            </View>

            {!isActive ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={startMeditation}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Comenzar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.instructionContainer}>
                <Text style={styles.cycleCounter}>
                  Ciclo {cycleCount + 1} de {TOTAL_CYCLES}
                </Text>
                {breathPhase === 'inhale' && (
                  <>
                    <Text style={styles.instructionText}>Inhala</Text>
                    <Text style={styles.instructionSubtext}>
                      Respira profundo por la nariz
                    </Text>
                  </>
                )}
                {breathPhase === 'hold' && (
                  <>
                    <Text style={styles.instructionText}>Aguanta</Text>
                    <Text style={styles.instructionSubtext}>
                      Mantén el aire en tus pulmones
                    </Text>
                  </>
                )}
                {breathPhase === 'exhale' && (
                  <>
                    <Text style={styles.instructionText}>Exhala</Text>
                    <Text style={styles.instructionSubtext}>
                      Suelta el aire lentamente
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: THEME.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
  },
  circleContainer: {
    position: 'relative',
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  svg: {
    position: 'absolute',
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.soft,
    overflow: 'hidden',
  },
  logo: {
    width: 120,
    height: 120,
  },
  timerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 96,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.fill[100],
    lineHeight: 96,
  },
  timerLabel: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: -THEME.spacing.xs,
  },
  startButton: {
    backgroundColor: THEME.colors.fill[100],
    paddingHorizontal: THEME.spacing.xl * 2,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    ...THEME.shadows.soft,
  },
  startButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  instructionContainer: {
    alignItems: 'center',
  },
  cycleCounter: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientSubtle,
    marginBottom: THEME.spacing.sm,
    fontFamily: THEME.fonts.heading.medium,
  },
  instructionText: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  instructionSubtext: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    fontStyle: 'italic',
  },
});
