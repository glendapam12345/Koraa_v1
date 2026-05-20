import React, { useCallback, useEffect } from 'react';
import { Image, Platform, StyleSheet, View, type ImageStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

const LOGO = require('../../assets/images/koraa-logo.png');

type KoraaBloomLogoProps = {
  size?: number;
  /** Respiración suave; ideal cuando hay racha o quieres vida al ícono. */
  active?: boolean;
  style?: ImageStyle;
};

const AnimatedImage = Animated.createAnimatedComponent(Image);

/**
 * Logo Koraa: entrada “florecer”, pulso opcional, y burst + halo al publicar check-in (Sentir).
 */
export function KoraaBloomLogo({ size = 56, active = true, style }: KoraaBloomLogoProps) {
  const { t } = useI18n();
  const entrance = useSharedValue(0.82);
  const pulse = useSharedValue(1);
  const burst = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 15, stiffness: 120, mass: 0.85 });
  }, [entrance]);

  useEffect(() => {
    if (!active) {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [active, pulse]);

  const runBurst = useCallback(() => {
    burst.value = withSequence(
      withTiming(1.16, { duration: 210, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 14, stiffness: 220, mass: 0.55 }),
    );
    glow.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(0, { duration: 650 }),
    );
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [burst, glow]);

  useEffect(() => {
    return subscribeCheckInCelebration(() => {
      runBurst();
    });
  }, [runBurst]);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: entrance.value * pulse.value * burst.value }],
    opacity: active ? 1 : 0.92,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.85,
    transform: [{ scale: 0.9 + glow.value * 0.12 }],
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: `${THEME.colors.gradient.blue}55`,
          },
          glowStyle,
        ]}
      />
      <AnimatedImage
        source={LOGO}
        style={[styles.img, { width: size, height: size }, animatedImageStyle, style]}
        accessibilityIgnoresInvertColors
        accessibilityLabel={t('branding.logoA11y')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  img: {
    resizeMode: 'contain',
  },
});
