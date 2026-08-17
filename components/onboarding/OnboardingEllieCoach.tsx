import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { THEME } from '@/constants/theme';
import type { EllieMood } from '@/lib/elliePersonality';

export type { EllieMood };

const ELLIE_MOODS: Record<EllieMood, number> = {
  default: require('@/assets/images/ellie-mascot.png'),
  breathing: require('@/assets/images/ellie-mood-breathing.png'),
  sleepy: require('@/assets/images/ellie-mood-sleepy.png'),
  happy: require('@/assets/images/ellie-mood-happy.png'),
  grateful: require('@/assets/images/ellie-mood-grateful.png'),
  focus: require('@/assets/images/ellie-mood-focus.png'),
  comforting: require('@/assets/images/ellie-mood-comforting.png'),
  proud: require('@/assets/images/ellie-mood-proud.png'),
  cozy: require('@/assets/images/ellie-mood-cozy.png'),
  curious: require('@/assets/images/ellie-mood-curious.png'),
};

const MOOD_HALO: Record<EllieMood, string> = {
  default: THEME.colors.calm.mist,
  breathing: THEME.colors.calm.blush,
  sleepy: THEME.colors.calm.mist,
  happy: THEME.colors.calm.lavender,
  grateful: THEME.colors.calm.lavender,
  focus: THEME.colors.calm.lavender,
  comforting: THEME.colors.calm.blush,
  proud: THEME.colors.calm.lavender,
  cozy: THEME.colors.calm.mist,
  curious: THEME.colors.calm.lavender,
};

type OnboardingEllieCoachProps = {
  message: string;
  mood?: EllieMood;
  /** Tamaño de Ellie — compacto tipo Duolingo. */
  size?: number;
  breathe?: boolean;
  /** En onboarding deja aire abajo; en Hoy va pegado al bloque siguiente. */
  withBottomGap?: boolean;
  /** Si va dentro de un botón (p. ej. Hoy), el padre lleva el a11y. */
  accessible?: boolean;
  /** Short line under Ellie so the mood change is readable. */
  moodCaption?: string;
  /** Feeling name under Ellie — accent italic, not a companion note. */
  moodCaptionAccent?: boolean;
};

/**
 * Ellie + burbuja — guía amigable (onboarding y compañera en Hoy).
 * RN Animated (not Reanimated): Expo Go HostFunction crashes on Hoy otherwise.
 */
export function OnboardingEllieCoach({
  message,
  mood = 'default',
  size = 56,
  breathe = true,
  withBottomGap = true,
  accessible = true,
  moodCaption,
  moodCaptionAccent = false,
}: OnboardingEllieCoachProps) {
  const breath = useRef(new Animated.Value(1)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const source = ELLIE_MOODS[mood] ?? ELLIE_MOODS.default;
  const halo = MOOD_HALO[mood] ?? THEME.colors.calm.mist;
  const haloSize = size + 20;

  useEffect(() => {
    if (!breathe) {
      breath.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1.045,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, breath]);

  useEffect(() => {
    pop.setValue(0.84);
    const anim = Animated.spring(pop, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [mood, pop]);

  return (
    <View
      style={[styles.row, withBottomGap && styles.rowGap]}
      accessibilityRole={accessible ? 'text' : undefined}
      accessibilityLabel={
        accessible ? (moodCaption ? `${moodCaption}. ${message}` : message) : undefined
      }
      accessible={accessible}
      importantForAccessibility={accessible ? 'yes' : 'no-hide-descendants'}
      pointerEvents={accessible ? 'auto' : 'none'}
    >
      <View style={[styles.portraitCol, { width: haloSize }]}>
        <View
          style={[
            styles.halo,
            {
              width: haloSize,
              height: haloSize,
              borderRadius: haloSize / 2,
              backgroundColor: halo,
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: Animated.multiply(breath, pop) }] }}>
            <Image
              source={source}
              style={{ width: size, height: size, backgroundColor: 'transparent' }}
              resizeMode="contain"
              accessibilityElementsHidden
            />
          </Animated.View>
        </View>
        {moodCaption ? (
          <Text
            style={[styles.moodCaption, moodCaptionAccent && styles.moodCaptionAccent]}
            numberOfLines={2}
          >
            {moodCaption}
          </Text>
        ) : null}
      </View>
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  rowGap: {
    marginBottom: THEME.spacing.md,
  },
  portraitCol: {
    alignItems: 'center',
  },
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCaption: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    paddingHorizontal: 2,
  },
  moodCaptionAccent: {
    ...THEME.typography.bodyAccent,
    color: THEME.colors.calm.lavenderDeep,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  bubble: {
    flex: 1,
    minWidth: 0,
    marginTop: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  tail: {
    position: 'absolute',
    left: -6,
    top: 18,
    width: 12,
    height: 12,
    backgroundColor: THEME.colors.calm.card,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.colors.calm.border,
    transform: [{ rotate: '45deg' }],
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
});
