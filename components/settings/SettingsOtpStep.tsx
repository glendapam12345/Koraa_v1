import { View, Text, Pressable } from 'react-native';
import { OTPInput } from '@/components/auth/OTPInput';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsOtpStepProps = {
  title: string;
  subtitle: string;
  email?: string;
  error: string;
  success: string;
  otpCode: string[];
  onOtpChange: (value: string[]) => void;
  isLoading: boolean;
  resendCooldown: number;
  onVerify: () => void;
  onResend: () => void;
  verifyLabel: string;
  resendLabel: string;
  resendInLabel: string;
};

export function SettingsOtpStep({
  title,
  subtitle,
  email,
  error,
  success,
  otpCode,
  onOtpChange,
  isLoading,
  resendCooldown,
  onVerify,
  onResend,
  verifyLabel,
  resendLabel,
  resendInLabel,
}: SettingsOtpStepProps) {
  return (
    <View style={styles.stepBlock}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      <Text style={styles.emailBold}>{email}</Text>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <View style={styles.otpWrap}>
        <OTPInput value={otpCode} onChange={onOtpChange} disabled={isLoading} />
      </View>

      <CalmPrimaryButton
        label={verifyLabel}
        onPress={onVerify}
        disabled={isLoading}
        loading={isLoading}
        style={styles.cta}
      />

      <Pressable
        style={styles.resendWrap}
        onPress={onResend}
        disabled={resendCooldown > 0 || isLoading}
        accessibilityRole="button"
      >
        <Text style={[styles.resendText, (resendCooldown > 0 || isLoading) && styles.resendMuted]}>
          {resendCooldown > 0 ? resendInLabel : resendLabel}
        </Text>
      </Pressable>
    </View>
  );
}
