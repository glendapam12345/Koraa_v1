import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type CalmPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  /** CTA protagonista (altura 56, pill). */
  large?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** `default`: gradiente azul→rosa. `soft`: secundario (blanco/lavanda, sin gradiente). */
  variant?: 'default' | 'soft';
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean; selected?: boolean };
};

export function CalmPrimaryButton({
  label,
  onPress,
  large = false,
  disabled = false,
  loading = false,
  variant = 'default',
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: CalmPrimaryButtonProps) {
  const height = large ? 56 : THEME.sizes.buttonHeight;
  const borderRadius = large ? THEME.borderRadius.pill : THEME.borderRadius.rounded;
  const isDisabled = disabled || loading;

  if (variant === 'soft') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        delayPressIn={0}
        style={[
          styles.softContainer,
          { height, borderRadius },
          isDisabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading, ...accessibilityState }}
      >
        {loading ? (
          <ActivityIndicator color={THEME.colors.calm.lavenderDeep} />
        ) : (
          <Text style={[styles.softText, large && styles.textLarge]}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      delayPressIn={0}
      style={[
        styles.container,
        { height, borderRadius },
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading, ...accessibilityState }}
    >
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={THEME.colors.onGradient} />
        ) : (
          <Text style={[styles.text, large && styles.textLarge]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  softContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  text: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  } as TextStyle,
  softText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  } as TextStyle,
  textLarge: {
    ...THEME.typography.cardTitle,
  } as TextStyle,
  disabled: {
    opacity: 0.5,
  },
});
