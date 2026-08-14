import { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const ELLIE_OPEN = require('@/assets/images/ellie-mascot.png');

/** Lila de la app — mismo tono que CalmScreen / brand. */
export const ELLIE_SPLASH_BG = '#E8D4F6';

type EllieBlinkingMascotProps = {
  size?: number;
  breathe?: boolean;
  blink?: boolean;
};

/** Ellie con respiración + parpadeo. */
export function EllieBlinkingMascot({
  size = 160,
  breathe = true,
  blink = true,
}: EllieBlinkingMascotProps) {
  const breath = useSharedValue(1);
  const lids = useSharedValue(0);

  useEffect(() => {
    if (!breathe) {
      breath.value = 1;
      return;
    }
    breath.value = withRepeat(
      withTiming(1.035, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(breath);
  }, [breathe, breath]);

  useEffect(() => {
    if (!blink) {
      lids.value = 0;
      return;
    }
    lids.value = withRepeat(
      withSequence(
        withDelay(2200, withTiming(1, { duration: 70, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 110, easing: Easing.in(Easing.quad) }),
        withDelay(160, withTiming(1, { duration: 70, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 110, easing: Easing.in(Easing.quad) }),
        withDelay(2800, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(lids);
  }, [blink, lids]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: lids.value }],
    opacity: lids.value > 0.02 ? 1 : 0,
  }));

  const eyeY = size * 0.34;
  const eyeGap = size * 0.14;
  const lidW = size * 0.13;
  const lidH = size * 0.09;

  return (
    <Animated.View style={[{ width: size, height: size }, wrapStyle]}>
      <Image source={ELLIE_OPEN} style={{ width: size, height: size }} resizeMode="contain" />
      <View pointerEvents="none" style={[styles.lidsRow, { top: eyeY, gap: eyeGap }]}>
        <Animated.View
          style={[styles.lid, { width: lidW, height: lidH, borderRadius: lidH / 2 }, lidStyle]}
        />
        <Animated.View
          style={[styles.lid, { width: lidW, height: lidH, borderRadius: lidH / 2 }, lidStyle]}
        />
      </View>
    </Animated.View>
  );
}

type EllieBootSplashProps = {
  visible?: boolean;
};

/**
 * Una sola composición tipo Duolingo:
 * fondo rosa + Ellie mediana al centro + "koraa" abajo.
 */
export function EllieBootSplash({ visible = true }: EllieBootSplashProps) {
  if (!visible) return null;

  return (
    <View style={styles.splash} accessibilityLabel="Koraa" accessibilityRole="image">
      <View style={styles.center}>
        <EllieBlinkingMascot size={168} breathe blink />
      </View>
      <Text style={styles.brand}>koraa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ELLIE_SPLASH_BG,
    zIndex: 9999,
    elevation: 9999,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
  },
  brand: {
    position: 'absolute',
    bottom: 72,
    alignSelf: 'center',
    fontSize: 36,
    fontWeight: '700',
    color: '#5C3D9E',
    letterSpacing: 0.6,
    textTransform: 'lowercase',
  },
  lidsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lid: {
    backgroundColor: '#F5A8C0',
    borderColor: '#E889A8',
    borderWidth: 1,
  },
});
