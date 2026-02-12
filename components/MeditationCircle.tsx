import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
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

export function MeditationCircle({ visible, onComplete, onClose, type }: MeditationCircleProps) {
  const [isActive, setIsActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const [progress, setProgress] = useState(0);
  
  const scale = useRef(new Animated.Value(1)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;
  const combinedScale = useRef(new Animated.Value(1)).current;
  const combinedScale = useRef(new Animated.Value(1)).current;
  const combinedScale = useRef(new Animated.Value(1)).current;

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
      setProgress(0);
      scale.setValue(1);
      breatheScale.setValue(1);
      combinedScale.setValue(1);
      setIsActive(false);
      setBreathPhase('inhale');
      setCycleCount(0);
      setSecondsRemaining(4);
    }
  }, [visible]);

  // Sincronizar combinedScale con breatheScale
  useEffect(() => {
    const listener = breatheScale.addListener(({ value }) => {
      combinedScale.setValue(value);
    });
    return () => {
      breatheScale.removeListener(listener);
    };
  }, []);

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
      handleComplete();
      return;
    }

    // Fase 1: Inhalar (llenar círculo)
    setBreathPhase('inhale');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Animar progreso usando estado
    const progressAnim = new Animated.Value(0);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: INHALE_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;

      // Actualizar estado de progreso
      setProgress(1);

      // Fase 2: Aguantar (mantener círculo lleno)
      setBreathPhase('hold');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Después de aguantar, exhalar
      setTimeout(() => {
        // Fase 3: Exhalar (vaciar círculo)
        setBreathPhase('exhale');
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const exhaleAnim = new Animated.Value(1);
        Animated.timing(exhaleAnim, {
          toValue: 0,
          duration: EXHALE_DURATION,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (!finished) return;

          setProgress(0);

          // Incrementar ciclo y continuar
          const nextCycle = currentCycle + 1;
          setCycleCount(nextCycle);

          if (nextCycle < TOTAL_CYCLES) {
            // Pequeña pausa entre ciclos
            setTimeout(() => {
              runBreathCycle(nextCycle);
            }, 500);
          } else {
            handleComplete();
          }
        });
      }, HOLD_DURATION);
    });

    // Animación de respiración del logo (sincronizada con el ciclo completo)
    Animated.sequence([
      Animated.timing(breatheScale, {
        toValue: 1.15,
        duration: INHALE_DURATION,
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_DURATION),
      Animated.timing(breatheScale, {
        toValue: 1,
        duration: EXHALE_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
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
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  const strokeDashoffset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);

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
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={THEME.colors.fill[100]}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                />
              </Svg>

              {/* Logo en el centro */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: combinedScale }],
                  },
                ]}
              >
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'rgba(255, 255, 255, 0.9)',
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
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
});
