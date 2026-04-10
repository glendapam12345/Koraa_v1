import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type StreakAuraProps = {
  children: React.ReactNode;
  /** 0 = casi invisible, 1 = halo más notorio (p. ej. racha larga). */
  intensity: number;
  /** Tamaño del contenido (logo) en px. */
  contentSize: number;
};

/**
 * Halo suave azul→rosa detrás del logo en la tarjeta de racha (Yo).
 */
export function StreakAura({ children, intensity, contentSize }: StreakAuraProps) {
  const pad = 10;
  const outer = contentSize + pad;
  const opacity = 0.14 + Math.min(1, Math.max(0, intensity)) * 0.38;

  return (
    <View style={[styles.wrap, { width: outer, height: outer }]}>
      <LinearGradient
        colors={[`${THEME.colors.gradient.blue}50`, `${THEME.colors.gradient.pink}40`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ring, { width: outer, height: outer, borderRadius: outer / 2, opacity }]}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
