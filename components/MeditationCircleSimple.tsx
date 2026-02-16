import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { X, Sparkles } from 'lucide-react-native';

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

/**
 * Versión sin Reanimated ni SVG para Expo Go (evita crashes).
 * Misma experiencia: 3 ciclos de inhalar / aguantar / exhalar.
 */
export function MeditationCircleSimple({ visible, onComplete, onClose, type }: MeditationCircleSimpleProps) {
  const [isActive, setIsActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsActive(false);
      setBreathPhase('inhale');
      setCycleCount(0);
      setSecondsRemaining(4);
    }
  }, [visible]);

  useEffect(() => {
    if (!isActive) return;
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
  }, [isActive, breathPhase]);

  const runCycle = (currentCycle: number) => {
    if (currentCycle >= TOTAL_CYCLES) {
      onComplete();
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
            if (Platform.OS !== 'web') {
              try {
                const Haptics = require('expo-haptics');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (_) {}
            }
            setTimeout(() => onComplete(), 600);
          }
        }, EXHALE_MS);
      }, HOLD_MS);
    }, INHALE_MS);
  };

  const startMeditation = () => {
    setIsActive(true);
    setCycleCount(0);
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }
    runCycle(0);
  };

  const message = type === 'morning'
    ? { title: 'Meditar para iniciar el día', subtitle: 'Respira profundo y conecta con tu intención', emoji: '🌅' }
    : { title: 'Meditar para terminar el día', subtitle: 'Suelta el día y descansa tu mente', emoji: '🌙' };

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
            <Text style={styles.emoji}>{message.emoji}</Text>
            <Text style={styles.title}>{message.title}</Text>
            <Text style={styles.subtitle}>{message.subtitle}</Text>

            <View style={styles.circleContainer}>
              <View style={styles.logoBackground}>
                {isActive ? (
                  <>
                    <Text style={styles.timerText}>{secondsRemaining}</Text>
                    <Text style={styles.timerLabel}>seg</Text>
                  </>
                ) : (
                  <Sparkles size={80} color={THEME.colors.fill[100]} strokeWidth={1.5} />
                )}
              </View>
            </View>

            {!isActive ? (
              <TouchableOpacity style={styles.startButton} onPress={startMeditation} activeOpacity={0.8}>
                <Text style={styles.startButtonText}>Comenzar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.instructionContainer}>
                <Text style={styles.cycleCounter}>Ciclo {cycleCount + 1} de {TOTAL_CYCLES}</Text>
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
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  logoBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
