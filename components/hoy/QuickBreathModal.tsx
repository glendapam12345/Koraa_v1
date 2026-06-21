import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Wind } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type QuickBreathModalProps = {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
};

const INHALE_MS = 3000;
const EXHALE_MS = 3000;
const TOTAL_CYCLES = 3;
const CIRCLE_SIZE = 132;

/**
 * Respiro rápido — distinto de meditación: tarjeta compacta, sin aguantar,
 * círculo que crece/decrece, ~20 s. Meditar usa el ritual completo en pantalla.
 */
export function QuickBreathModal({ visible, onComplete, onClose }: QuickBreathModalProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.72)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    pulseRef.current?.stop();
    pulseRef.current = null;
  }, []);

  const resetState = useCallback(() => {
    clearTimers();
    setPhase('inhale');
    setCycle(0);
    setRunning(false);
    scaleAnim.setValue(0.72);
  }, [clearTimers, scaleAnim]);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  const animateTo = useCallback(
    (toValue: number, duration: number) =>
      new Promise<void>((resolve) => {
        pulseRef.current = Animated.timing(scaleAnim, {
          toValue,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        });
        pulseRef.current.start(({ finished }) => {
          if (finished) resolve();
        });
      }),
    [scaleAnim],
  );

  const haptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS === 'web') return;
    try {
      void Haptics.impactAsync(style);
    } catch {
      /* noop */
    }
  }, []);

  const runCycle = useCallback(
    async (index: number) => {
      if (index >= TOTAL_CYCLES) {
        if (Platform.OS !== 'web') {
          try {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            /* noop */
          }
        }
        onComplete();
        return;
      }

      setCycle(index);
      setPhase('inhale');
      haptic(Haptics.ImpactFeedbackStyle.Light);
      await animateTo(1, INHALE_MS);

      setPhase('exhale');
      haptic(Haptics.ImpactFeedbackStyle.Light);
      await animateTo(0.72, EXHALE_MS);

      void runCycle(index + 1);
    },
    [animateTo, haptic, onComplete],
  );

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    void runCycle(0);
  }, [runCycle, running]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const phaseLabel =
    phase === 'inhale' ? t('meditation.breatheQuickInhale') : t('meditation.breatheQuickExhale');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.close}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('meditation.close')}
          >
            <X size={20} color={THEME.colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Wind size={18} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.title}>{t('meditation.breatheQuickTitle')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('meditation.breatheQuickSubtitle')}</Text>

          <View style={styles.circleWrap}>
            <Animated.View
              style={[
                styles.circle,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.circleInner}>
                {running ? (
                  <Text style={styles.phaseText}>{phaseLabel}</Text>
                ) : (
                  <Wind size={36} color={THEME.colors.calm.lavenderDeep} strokeWidth={1.5} />
                )}
              </View>
            </Animated.View>
          </View>

          {running ? (
            <Text style={styles.progress}>
              {t('meditation.breatheQuickCycle', { current: cycle + 1, total: TOTAL_CYCLES })}
            </Text>
          ) : (
            <>
              <Text style={styles.hint}>{t('meditation.breatheQuickHint')}</Text>
              <TouchableOpacity style={styles.startBtn} onPress={start} activeOpacity={0.85}>
                <Text style={styles.startBtnText}>{t('meditation.breatheQuickStart')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.layout.screenPaddingX,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.md,
    alignItems: 'center',
    ...THEME.shadows.soft,
  },
  close: {
    position: 'absolute',
    top: THEME.spacing.sm,
    right: THEME.spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    marginBottom: 4,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: THEME.spacing.md,
  },
  circleWrap: {
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.sm,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  phaseText: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
  },
  progress: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  startBtn: {
    alignSelf: 'stretch',
    backgroundColor: THEME.colors.calm.lavender,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
