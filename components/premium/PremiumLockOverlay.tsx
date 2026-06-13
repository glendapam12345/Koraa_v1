import type { StyleProp, ViewStyle } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
};

/** Overlay de candado reutilizable en tarjetas premium (Para mí, Emergency Kit). */
export function PremiumLockOverlay({
  onPress,
  accessibilityLabel,
  hint,
  iconSize = 16,
  style,
  tone = 'surface',
}: PremiumLockOverlayProps) {
  return (
    <TouchableOpacity
      style={[styles.overlay, style]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.iconWrap}>
        <Lock size={iconSize} color={THEME.colors.calm.lavenderDeep} />
      </View>
      <Text style={[styles.hint, tone === 'gradient' ? styles.hintGradient : styles.hintSurface]}>
        {hint}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: THEME.borderRadius.standard,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  hint: {
    ...THEME.typography.caption,
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
