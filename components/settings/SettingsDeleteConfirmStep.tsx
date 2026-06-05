import { View, Text, Pressable } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { SettingsDangerButton } from '@/components/settings/SettingsDangerButton';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsDeleteConfirmStepProps = {
  title: string;
  subtitle: string;
  error: string;
  isLoading: boolean;
  onConfirmDelete: () => void;
  onCancel: () => void;
  confirmLabel: string;
  cancelLabel: string;
};

export function SettingsDeleteConfirmStep({
  title,
  subtitle,
  error,
  isLoading,
  onConfirmDelete,
  onCancel,
  confirmLabel,
  cancelLabel,
}: SettingsDeleteConfirmStepProps) {
  return (
    <View style={styles.stepBlock}>
      <Trash2 size={48} color={THEME.colors.semantic.danger} style={styles.centerIcon} />
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <SettingsDangerButton
        label={confirmLabel}
        onPress={onConfirmDelete}
        disabled={isLoading}
        loading={isLoading}
      />

      <Pressable style={styles.textOnly} onPress={onCancel} accessibilityRole="button">
        <Text style={styles.linkMuted}>{cancelLabel}</Text>
      </Pressable>
    </View>
  );
}
