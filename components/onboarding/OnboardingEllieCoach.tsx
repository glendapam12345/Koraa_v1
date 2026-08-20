import { View, Text, StyleSheet, Image, Animated, Easing, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { THEME } from '@/constants/theme';
import type { EllieMood } from '@/lib/elliePersonality';
import { ELLIE_MOOD_ASSETS } from '@/lib/ellieMoodAssets';

export type { EllieMood };

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
  /** Abre check-in / actualizar emoción al tocar el retrato de Ellie. */
  onPortraitPress?: () => void;
  /** Línea bajo el retrato: “Toca aquí para cambiar”. */
  portraitHint?: string;
  portraitA11yLabel?: string;
  portraitA11yHint?: string;
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
  onPortraitPress,
  portraitHint,
  portraitA11yLabel,
  portraitA11yHint,
}: OnboardingEllieCoachProps) {
  const breath = useRef(new Animated.Value(1)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(false);
  const [moodImageReady, setMoodImageReady] = useState(mood === 'default');
  const [moodImageFailed, setMoodImageFailed] = useState(false);
  const source = ELLIE_MOOD_ASSETS[mood] ?? ELLIE_MOOD_ASSETS.default;
  const halo = MOOD_HALO[mood] ?? THEME.colors.calm.mist;
  const haloSize = size + 20;
  const showDefaultUnderlay =
    mood !== 'default' && (!moodImageReady || moodImageFailed);

  useEffect(() => {
    setMoodImageReady(mood === 'default');
    setMoodImageFailed(false);
  }, [mood]);

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
    if (!mountedRef.current) {
      mountedRef.current = true;
      pop.setValue(1);
      return;
    }
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

  const portraitPressable = Boolean(onPortraitPress);

  const portraitInner = (
    <>
      <View
        style={[
          styles.halo,
          portraitPressable && styles.haloPressable,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            backgroundColor: halo,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: breath }] }}>
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <View style={[styles.portraitFrame, { width: size, height: size }]}>
              {showDefaultUnderlay ? (
                <Image
                  source={ELLIE_MOOD_ASSETS.default}
                  style={[styles.portrait, { width: size, height: size }]}
                  resizeMode="contain"
                  accessibilityElementsHidden
                />
              ) : null}
              {mood === 'default' || moodImageFailed ? (
                <Image
                  source={ELLIE_MOOD_ASSETS.default}
                  style={[styles.portrait, { width: size, height: size }]}
                  resizeMode="contain"
                  accessibilityElementsHidden
                />
              ) : (
                <Image
                  source={source}
                  style={[
                    styles.portrait,
                    { width: size, height: size },
                    showDefaultUnderlay ? styles.portraitOverlay : null,
                  ]}
                  resizeMode="contain"
                  fadeDuration={0}
                  onLoad={() => setMoodImageReady(true)}
                  onError={() => setMoodImageFailed(true)}
                  accessibilityElementsHidden
                />
              )}
            </View>
          </Animated.View>
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
      {portraitHint ? (
        <Text style={styles.portraitHint} numberOfLines={2}>
          {portraitHint}
        </Text>
      ) : null}
    </>
  );

  return (
    <View
      style={[styles.row, withBottomGap && styles.rowGap]}
      accessibilityRole={accessible ? 'text' : undefined}
      accessibilityLabel={
        accessible ? (moodCaption ? `${moodCaption}. ${message}` : message) : undefined
      }
      accessible={accessible}
      importantForAccessibility={accessible ? 'yes' : portraitPressable ? 'auto' : 'no-hide-descendants'}
      pointerEvents={accessible ? 'auto' : portraitPressable ? 'box-none' : 'none'}
    >
      {portraitPressable ? (
        <TouchableOpacity
          style={[styles.portraitCol, { width: haloSize }]}
          onPress={onPortraitPress}
          delayPressIn={0}
          activeOpacity={0.82}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={portraitA11yLabel ?? portraitHint ?? moodCaption ?? message}
          accessibilityHint={portraitA11yHint}
        >
          {portraitInner}
        </TouchableOpacity>
      ) : (
        <View style={[styles.portraitCol, { width: haloSize }]}>{portraitInner}</View>
      )}
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
  haloPressable: {
    borderWidth: 1.5,
    borderColor: THEME.colors.calm.lavenderDeep,
    borderStyle: 'dashed',
  },
  portrait: {
    backgroundColor: 'transparent',
  },
  portraitFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  portraitHint: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
    textDecorationLine: 'underline',
    lineHeight: 16,
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
