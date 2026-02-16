import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { X, Sparkles, CheckCircle } from 'lucide-react-native';

type MeditationCircleSimpleProps = {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
  type: 'morning' | 'evening';
};

const INHALE_MS = 4000;
const HOLD_MS = 4000;
const EXHALE_MS = 4000;
const TOTAL_CYCLES = 3;
const CIRCLE_SIZE = 260;

/**
 * Versión sin Reanimated ni SVG para Expo Go (evita crashes).
 * Círculo grande que se llena con los segundos; 3 ciclos inhala/aguanta/exhala; pantalla de completado.
 */
export function MeditationCircleSimple({ visible, onComplete, onClose, type }: MeditationCircleSimpleProps) {
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (completedTimeoutRef.current) clearTimeout(completedTimeoutRef.current);
      timeoutRef.current = null;
      completedTimeoutRef.current = null;
      setIsActive(false);
      setIsCompleted(false);
      setBreathPhase('inhale');
      setCycleCount(0);
      setSecondsRemaining(4);
    }
  }, [visible]);

  useEffect(() => {
    if (!isActive || isCompleted) return;
    let seconds = 4;
    setSecondsRemaining(4);
    const interval = setInterval(() => {
      seconds -= 1;
      if (seconds >= 0) setSecondsRemaining(seconds);
      else {
        seconds = 4;
        setSecondsRemaining(4);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, breathPhase, isCompleted]);

  const runCycle = (currentCycle: number) => {
    if (currentCycle >= TOTAL_CYCLES) {
      if (Platform.OS !== 'web') {
        try {
          const Haptics = require('expo-haptics');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
      }
      setIsCompleted(true);
      completedTimeoutRef.current = setTimeout(() => {
        onComplete();
      }, 2500);
      return;
    }
    setBreathPhase('inhale');
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}
    }
    timeoutRef.current = setTimeout(() => {
      setBreathPhase('hold');
      if (Platform.OS !== 'web') {
        try {
          const Haptics = require('expo-haptics');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (_) {}
      }
      timeoutRef.current = setTimeout(() => {
        setBreathPhase('exhale');
        if (Platform.OS !== 'web') {
          try {
            const Haptics = require('expo-haptics');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (_) {}
        }
        timeoutRef.current = setTimeout(() => {
          const next = currentCycle + 1;
          setCycleCount(next);
          if (next < TOTAL_CYCLES) {
            timeoutRef.current = setTimeout(() => runCycle(next), 500);
          } else {
            runCycle(next);
          }
        }, EXHALE_MS);
      }, HOLD_MS);
    }, INHALE_MS);
  };

  const startMeditation = () => {
    setIsActive(true);
    setIsCompleted(false);
    setCycleCount(0);
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }
    runCycle(0);
  };

  // Progreso 0..1 para que el círculo se llene (inhala), se quede lleno (hold), se vacíe (exhala)
  const fillProgress = (() => {
    if (!isActive || isCompleted) return 0;
    const t = 1 - secondsRemaining / 4;
    if (breathPhase === 'inhale') return t;
    if (breathPhase === 'hold') return 1;
    return 1 - t; // exhale: 1 -> 0
  })();

  const message = type === 'morning'
    ? { title: 'Meditar para iniciar el día', subtitle: 'Respira profundo y conecta con tu intención', emoji: '🌅', completed: 'Meditación de la mañana completada' }
    : { title: 'Meditar para terminar el día', subtitle: 'Suelta el día y descansa tu mente', emoji: '🌙', completed: 'Meditación de la noche completada' };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <X size={24} color={THEME.colors.fill[100]} />
          </TouchableOpacity>

          <View style={styles.content}>
            {isCompleted ? (
              <>
                <View style={styles.completedGlow} />
                <View style={styles.completedCircle}>
                  <CheckCircle size={100} color={THEME.colors.fill[100]} strokeWidth={2.5} />
                </View>
                <Text style={styles.completedTitle}>{message.completed}</Text>
                <Text style={styles.completedSubtitle}>¡Bien hecho! 🧘</Text>
              </>
            ) : (
              <>
                <Text style={styles.emoji}>{message.emoji}</Text>
                <Text style={styles.title}>{message.title}</Text>
                <Text style={styles.subtitle}>{message.subtitle}</Text>

                <View style={[styles.circleWrapper, { width: CIRCLE_SIZE + 56, height: CIRCLE_SIZE + 56 }]}>
                  {/* Glow suave detrás del anillo */}
                  <View style={[styles.ringGlow, { width: CIRCLE_SIZE + 24, height: CIRCLE_SIZE + 24, borderRadius: (CIRCLE_SIZE + 24) / 2 }]} />
                  <View style={[styles.circleContainer, { width: CIRCLE_SIZE + 8, height: CIRCLE_SIZE + 8 }]}>
                    {/* Anillo exterior (borde + pista) */}
                    <View style={[styles.ringOuter, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }]}>
                      <View style={[styles.ringFillClip, { height: CIRCLE_SIZE * fillProgress }]}>
                        <LinearGradient
                          colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.35)']}
                          start={{ x: 0.5, y: 1 }}
                          end={{ x: 0.5, y: 0 }}
                          style={[styles.ringFill, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }]}
                        />
                      </View>
                    </View>
                    {/* Centro: cristal + número o ícono */}
                    <View style={styles.ringCenter}>
                      <View style={styles.centerGlass}>
                        {!isActive ? (
                          <Sparkles size={76} color={THEME.colors.fill[100]} strokeWidth={1.5} />
                        ) : (
                          <>
                            <Text style={styles.timerText}>{secondsRemaining}</Text>
                            <Text style={styles.timerLabel}>seg</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {!isActive ? (
                  <TouchableOpacity style={styles.startButton} onPress={startMeditation} activeOpacity={0.8}>
                    <Text style={styles.startButtonText}>Comenzar</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.instructionContainer}>
                    <View style={styles.cycleBadge}>
                      <Text style={styles.cycleCounter}>Ciclo {cycleCount + 1} de {TOTAL_CYCLES}</Text>
                    </View>
                    {breathPhase === 'inhale' && (
                      <>
                        <Text style={styles.instructionText}>Inhala</Text>
                        <Text style={styles.instructionSubtext}>Respira profundo por la nariz</Text>
                      </>
                    )}
                    {breathPhase === 'hold' && (
                      <>
                        <Text style={styles.instructionText}>Aguanta</Text>
                        <Text style={styles.instructionSubtext}>Mantén el aire en tus pulmones</Text>
                      </>
                    )}
                    {breathPhase === 'exhale' && (
                      <>
                        <Text style={styles.instructionText}>Exhala</Text>
                        <Text style={styles.instructionSubtext}>Suelta el aire lentamente</Text>
                      </>
                    )}
                  </View>
                )}
                {!isActive && (
                  <Text style={styles.hint}>3 ciclos · Inhala, aguanta, exhala</Text>
                )}
              </>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  emoji: {
    fontSize: 52,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h2,
    fontSize: 26,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    lineHeight: 22,
  },
  circleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  ringGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    borderWidth: 12,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  ringFillClip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    alignItems: 'center',
  },
  ringFill: {
    position: 'absolute',
    bottom: 0,
  },
  ringCenter: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerGlass: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.soft,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  timerText: {
    fontSize: 72,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.fill[100],
    lineHeight: 72,
    letterSpacing: -1,
  },
  timerLabel: {
    ...THEME.typography.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.92)',
    fontFamily: THEME.fonts.heading.medium,
    marginTop: -4,
    letterSpacing: 0.5,
  },
  hint: {
    ...THEME.typography.caption,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: THEME.colors.fill[100],
    paddingHorizontal: THEME.spacing.xl * 2,
    paddingVertical: THEME.spacing.md + 4,
    borderRadius: THEME.borderRadius.full,
    ...THEME.shadows.soft,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  startButtonText: {
    ...THEME.typography.body,
    fontSize: 17,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  cycleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cycleCounter: {
    ...THEME.typography.caption,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: THEME.fonts.heading.medium,
  },
  instructionText: {
    ...THEME.typography.h2,
    fontSize: 26,
    color: THEME.colors.fill[100],
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  instructionSubtext: {
    ...THEME.typography.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.88)',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  completedGlow: {
    position: 'absolute',
    top: 10,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 8,
  },
  completedCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.soft,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  completedTitle: {
    ...THEME.typography.h2,
    fontSize: 22,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.lg,
    lineHeight: 28,
  },
  completedSubtitle: {
    ...THEME.typography.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
  },
});
