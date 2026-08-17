import type { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type HeaderIconButtonProps = {
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

/** Botón de icono en cabeceras de tab (Hoy, Semana). 48px touch target. */
export function HeaderIconButton({
  onPress,
  children,
  accessibilityLabel,
  accessibilityHint,
}: HeaderIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      delayPressIn={0}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={styles.button}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
});
