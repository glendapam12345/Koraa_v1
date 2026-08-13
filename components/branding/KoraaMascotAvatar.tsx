import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { THEME } from '@/constants/theme';

type KoraaMascotAvatarProps = {
  size?: number;
  /**
   * `ellie` — mascota axolotl (compañera tipo Duolingo).
   * `logo` — flor de marca.
   * `face` — Ellie geométrica (fallback compacto).
   */
  variant?: 'ellie' | 'logo' | 'face';
  /** Respiración suave (solo ellie). */
  breathe?: boolean;
};

const LOGO = require('@/assets/images/koraa-logo.png');
const ELLIE = require('@/assets/images/ellie-mascot.png');

/** Identidad visual de Koraa — Ellie por defecto; logo flor opcional. */
export function KoraaMascotAvatar({
  size = 44,
  variant = 'ellie',
  breathe = variant === 'ellie',
}: KoraaMascotAvatarProps) {
  const breath = useSharedValue(1);

  useEffect(() => {
    if (!breathe || variant !== 'ellie') {
      breath.value = 1;
      return;
    }
    breath.value = withRepeat(
      withTiming(1.045, {
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [breathe, breath, variant]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  if (variant === 'ellie') {
    return (
      <Animated.View
        style={[
          styles.ellieWrap,
          {
            width: size,
            height: size,
          },
          breathStyle,
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image
          source={ELLIE}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  if (variant === 'logo') {
    return (
      <View
        style={[
          styles.logoWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image
          source={LOGO}
          style={{ width: size * 0.92, height: size * 0.92 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const eyeSize = Math.max(4, Math.round(size * 0.09));
  const eyeGap = Math.max(10, Math.round(size * 0.22));

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.eyes, { gap: eyeGap }]}>
        <View style={[styles.eye, { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 }]} />
        <View style={[styles.eye, { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 }]} />
      </View>
      <View
        style={[
          styles.smile,
          {
            width: size * 0.34,
            height: size * 0.17,
            borderBottomLeftRadius: size * 0.2,
            borderBottomRightRadius: size * 0.2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ellieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
    ...THEME.shadows.lavenderGlow,
  },
  circle: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    ...THEME.shadows.soft,
  },
  eyes: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  eye: {
    backgroundColor: THEME.colors.onGradient,
  },
  smile: {
    borderBottomWidth: 2,
    borderColor: THEME.colors.onGradient,
    marginTop: -1,
  },
});
