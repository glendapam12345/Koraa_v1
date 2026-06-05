import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';

type SettingsDangerButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function SettingsDangerButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: SettingsDangerButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabled]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={THEME.colors.onGradient} />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: THEME.colors.semantic.danger,
    borderRadius: THEME.borderRadius.rounded,
    minHeight: THEME.sizes.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
  },
  disabled: {
    opacity: 0.7,
  },
  text: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
