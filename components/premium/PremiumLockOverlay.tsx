import type { StyleProp, ViewStyle } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

type PremiumLockOverlayProps = {
  onPress: () => void;
  accessibilityLabel: string;
  hint: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  /** Texto sobre gradiente vs tarjeta clara. */
  tone?: 'gradient' | 'surface';
  /** `compact` = franja suave abajo; `center` = overlay clásico centrado. */
  layout?: 'compact' | 'center';
};

/** Overlay de candado reutilizable — tono calmado, sin bloque oscuro. */
export function PremiumLockOverlay({
  onPress,
  accessibilityLabel,
  hint,
  iconSize = 14,
  style,
  tone = 'surface',
  layout = 'compact',
}: PremiumLockOverlayProps) {
  const isGradient = tone === 'gradient';
  const shortHint = hint;

  if (layout === 'center') {
    return (
      <TouchableOpacity
        style={[styles.overlayCenter, style]}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={styles.iconWrap}>
          <Lock size={iconSize} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <Text style={[styles.hintCenter, isGradient ? styles.hintGradient : styles.hintSurface]}>
          {shortHint}
        </Text>
      </TouchableOpacity>
    );
  }

  const pill = (
    <View style={[styles.pill, isGradient ? styles.pillGradient : styles.pillSurface]}>
      <Lock size={iconSize} color={isGradient ? THEME.colors.onGradient : THEME.colors.calm.lavenderDeep} />
      <Text style={[styles.pillText, isGradient ? styles.pillTextGradient : styles.pillTextSurface]}>
        {shortHint}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.overlayCompact, style]}
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={28}
          tint={isGradient ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            isGradient ? styles.androidFadeGradient : styles.androidFadeSurface,
          ]}
        />
      )}
      <View style={styles.pillWrap}>{pill}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlayCompact: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    overflow: 'hidden',
  },
  androidFadeSurface: {
    backgroundColor: THEME.colors.surfaceOverlay.glass,
  },
  androidFadeGradient: {
    backgroundColor: THEME.colors.scrimLight,
  },
  pillWrap: {
    paddingHorizontal: THEME.spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
  },
  pillSurface: {
    backgroundColor: THEME.colors.surfaceOverlay.glassOpaque,
    borderColor: THEME.colors.calm.border,
  },
  pillGradient: {
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    borderColor: THEME.colors.surfaceOverlay.glassBorderFaint,
  },
  pillText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
  },
  pillTextSurface: {
    color: THEME.colors.calm.lavenderDeep,
  },
  pillTextGradient: {
    color: THEME.colors.onGradient,
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.surfaceOverlay.glassLight,
    borderRadius: THEME.borderRadius.standard,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  hintCenter: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  hintGradient: {
    color: THEME.colors.onGradient,
  },
  hintSurface: {
    color: THEME.colors.text.secondary,
  },
});
