import { View, Text, TextInput } from 'react-native';
import { THEME } from '@/constants/theme';
import { PasswordRequirementsHint } from '@/components/auth/PasswordRequirementsHint';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsChangePasswordFormProps = {
  title: string;
  subtitle: string;
  error: string;
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  isLoading: boolean;
  onSave: () => void;
  saveLabel: string;
  passwordPlaceholder: string;
  confirmPlaceholder: string;
};

export function SettingsChangePasswordForm({
  title,
  subtitle,
  error,
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  isLoading,
  onSave,
  saveLabel,
  passwordPlaceholder,
  confirmPlaceholder,
}: SettingsChangePasswordFormProps) {
  return (
    <View style={styles.stepBlock}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder={passwordPlaceholder}
        placeholderTextColor={THEME.colors.text.tertiary}
        value={newPassword}
        onChangeText={onNewPasswordChange}
        secureTextEntry
        autoCapitalize="none"
        editable={!isLoading}
      />
      <PasswordRequirementsHint />
      <TextInput
        style={styles.input}
        placeholder={confirmPlaceholder}
        placeholderTextColor={THEME.colors.text.tertiary}
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        secureTextEntry
        autoCapitalize="none"
        editable={!isLoading}
      />

      <CalmPrimaryButton
        label={saveLabel}
        onPress={onSave}
        disabled={isLoading}
        loading={isLoading}
        style={styles.cta}
      />
    </View>
  );
}
