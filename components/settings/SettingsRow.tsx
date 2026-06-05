import { Pressable, View, Text, ActivityIndicator, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { THEME } from '@/constants/theme';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsRowProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
};

export function SettingsRow({
  icon,
  label,
  onPress,
  loading = false,
  disabled = false,
  danger = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: SettingsRowProps) {
  return (
    <Pressable
      style={[styles.row, danger && styles.rowDanger, style]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      <View style={styles.rowLeft}>
        {icon}
        <Text style={danger ? styles.rowLabelDanger : styles.rowLabel}>{label}</Text>
      </View>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={danger ? THEME.colors.semantic.danger : THEME.colors.calm.lavenderDeep}
        />
      ) : (
        <Text style={danger ? styles.chevronDanger : styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}
