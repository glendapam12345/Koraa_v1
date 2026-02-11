import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
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
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type MeditationCircleProps = {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
  type: 'morning' | 'evening';
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MeditationCircle({ visible, onComplete, onClose, type }: MeditationCircleProps) {
  const [isActive, setIsActive] = useState(false);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const breatheScale = useSharedValue(1);

  const CIRCLE_SIZE = 280;
  const STROKE_WIDTH = 12;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const DURATION = 5000; // 5 segundos

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      scale.value = 1;
      breatheScale.value = 1;
      setIsActive(false);
    }
  }, [visible]);

  const startMeditation = () => {
    setIsActive(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animación de progreso del círculo
    progress.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(handleComplete)();
      }
    });

    // Animación de respiración sutil
    const breathe = () => {
      breatheScale.value = withTiming(1.05, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }, () => {
        breatheScale.value = withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        });
      });
    };
    breathe();
    const breatheInterval = setInterval(breathe, 4000);

    setTimeout(() => clearInterval(breatheInterval), DURATION);
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
                  stroke="rgba(255, 255, 255, 0.2)"
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
                  rotation="-90"
                  origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                />
              </Svg>

              {/* Logo en el centro */}
              <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                <View style={styles.logoBackground}>
                  <Image
                    source={require('@/assets/images/Ícono_Koraa.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
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
                <Text style={styles.instructionText}>Respira profundo</Text>
                <Text style={styles.instructionSubtext}>
                  Inhala... Exhala... Relájate
                </Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.soft,
  },
  logo: {
    width: 120,
    height: 120,
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
  instructionText: {
    ...THEME.typography.h3,
    color: THEME.colors.fill[100],
    marginBottom: THEME.spacing.xs,
  },
  instructionSubtext: {
    ...THEME.typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
});
