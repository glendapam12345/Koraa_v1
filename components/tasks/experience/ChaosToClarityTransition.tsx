import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { VISION_PASTELS } from '@/lib/lifeAreas/visionPalette';

type ChaosToClarityTransitionProps = {
  active: boolean;
  onComplete: () => void;
  durationMs?: number;
};

/** Breve transición visual caos → claridad — sin lógica real. */
export function ChaosToClarityTransition({
  active,
  onComplete,
  durationMs = 1400,
}: ChaosToClarityTransitionProps) {
  const { t } = useI18n();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!active) return;

    opacity.setValue(0);
    scale.setValue(0.92);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onComplete, durationMs);
    return () => clearTimeout(timer);
  }, [active, durationMs, onComplete, opacity, scale]);

  if (!active) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>
          <Sparkles size={28} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <Text style={styles.title}>{t('tasksExperience.vision.reorganizing')}</Text>
        <ActivityIndicator color={THEME.colors.calm.lavenderDeep} style={styles.spinner} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.calmScrim,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    borderRadius: 28,
  },
  card: {
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: VISION_PASTELS.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    lineHeight: 24,
  },
  spinner: {
    marginTop: 4,
  },
});
