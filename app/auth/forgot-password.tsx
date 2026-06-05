import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { OTPInput } from '@/components/auth/OTPInput';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OTP_CODE_LENGTH, emptyOtpSlots } from '@/constants/authOtp';
import { useI18n } from '@/contexts/I18nContext';
import { PasswordRequirementsHint } from '@/components/auth/PasswordRequirementsHint';
import { getPasswordErrorKey } from '@/lib/passwordPolicy';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetPassword, verifyRecoveryOtp, updatePassword } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(() => emptyOtpSlots());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError(t('auth.forgot.emailRequired'));
      return;
    }
    setError('');
    setIsLoading(true);
    const { error: resetErr, success } = await resetPassword(email);
    setIsLoading(false);
    if (resetErr) {
      setError(resetErr);
      return;
    }
    if (success) {
      setStep('otp');
      setResendCooldown(60);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== OTP_CODE_LENGTH) {
      setError(t('auth.forgot.otpIncomplete', { length: OTP_CODE_LENGTH }));
      return;
    }
    setError('');
    setIsLoading(true);
    const { error: verifyErr, success } = await verifyRecoveryOtp(email, code);
    setIsLoading(false);
    if (verifyErr) {
      setError(verifyErr);
      setOtpCode(emptyOtpSlots());
      return;
    }
    if (success) setStep('password');
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);
    const { error: resetErr, success } = await resetPassword(email);
    setIsLoading(false);
    if (resetErr) {
      setError(resetErr);
      return;
    }
    if (success) {
      setResendCooldown(60);
      setOtpCode(emptyOtpSlots());
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError(t('auth.signup.fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('password.mismatch'));
      return;
    }
    const passwordErrorKey = getPasswordErrorKey(newPassword);
    if (passwordErrorKey) {
      setError(t(passwordErrorKey));
      return;
    }
    setError('');
    setIsLoading(true);
    const { error: updateErr, success } = await updatePassword(newPassword);
    setIsLoading(false);
    if (updateErr) {
      setError(updateErr);
      return;
    }
    if (success) setStep('success');
  };

  const primaryCta = (
    onPress: () => void,
    label: string,
    accessibilityHint?: string,
  ) => (
    <CalmPrimaryButton
      label={label}
      onPress={onPress}
      disabled={isLoading}
      loading={isLoading}
      style={styles.cta}
      accessibilityLabel={isLoading ? `${label}${t('commonExtra.loadingSuffix')}` : label}
      accessibilityHint={accessibilityHint}
    />
  );

  const scrollPad = [
    styles.scrollContent,
    {
      paddingTop: insets.top + THEME.spacing.md,
      paddingBottom: insets.bottom + THEME.spacing.lg,
    },
  ];

  if (step === 'email') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={scrollPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.forgot.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.forgot.emailSubtitle')}</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('common.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.login.emailPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                accessibilityLabel={t('authA11y.email')}
                accessibilityHint={t('authA11y.emailHint')}
              />
            </View>
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            {primaryCta(handleSendCode, t('auth.forgot.sendCode'))}
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={t('authA11y.backToLogin')}
            accessibilityHint={t('authA11y.backToLoginHint')}
            accessibilityState={{ disabled: isLoading }}
          >
            <Text style={styles.backText}>{t('auth.forgot.backToLogin')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === 'otp') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={scrollPad} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.forgot.otpTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgot.otpSubtitlePrefix')}
              {'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
          </View>
          <View style={styles.otpWrap}>
            <OTPInput value={otpCode} onChange={setOtpCode} disabled={isLoading} />
          </View>
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          {primaryCta(handleVerifyOtp, t('auth.forgot.verify'))}
          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResendOtp}
            disabled={resendCooldown > 0 || isLoading}
            accessibilityRole="button"
            accessibilityLabel={
              resendCooldown > 0
                ? t('authA11y.resendIn', { seconds: resendCooldown })
                : t('authA11y.resend')
            }
            accessibilityHint={t('authA11y.resendHint')}
            accessibilityState={{ disabled: resendCooldown > 0 || isLoading }}
          >
            <Text
              style={[styles.resendText, (resendCooldown > 0 || isLoading) && styles.resendTextDisabled]}
            >
              {resendCooldown > 0
                ? t('auth.forgot.resendIn', { seconds: resendCooldown })
                : t('auth.forgot.resend')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep('email')}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={t('authA11y.changeEmail')}
            accessibilityHint={t('authA11y.changeEmailHint')}
            accessibilityState={{ disabled: isLoading }}
          >
            <Text style={styles.backText}>{t('auth.forgot.changeEmail')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === 'password') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={scrollPad} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.forgot.passwordTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.forgot.passwordSubtitle')}</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.forgot.newPasswordLabel')}</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('password.placeholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
                accessibilityLabel={t('common.password')}
              />
              <PasswordRequirementsHint />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('common.confirmPassword')}</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('password.confirmPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
                accessibilityLabel={t('common.confirmPassword')}
              />
            </View>
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            {primaryCta(handleUpdatePassword, t('common.save'))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.successRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.successTitle}>{t('resetPassword.successTitle')}</Text>
      <Text style={styles.successBody}>{t('resetPassword.successBody')}</Text>
      <CalmPrimaryButton
        label={t('resetPassword.signIn')}
        onPress={() => router.replace('/auth/login')}
        accessibilityHint={t('authA11y.signInHint')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.md,
    justifyContent: 'center',
  },
  header: {
    marginBottom: THEME.spacing.lg,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  emailHighlight: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  form: {
    gap: THEME.spacing.sm,
  },
  field: {
    gap: 6,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.sm,
    height: THEME.sizes.inputHeight,
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
  },
  error: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
    textAlign: 'center',
  },
  cta: {
    marginTop: THEME.spacing.sm,
  },
  otpWrap: {
    marginVertical: THEME.spacing.lg,
  },
  resendBtn: {
    padding: THEME.spacing.sm,
    alignItems: 'center',
  },
  resendText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  resendTextDisabled: {
    color: THEME.colors.text.tertiary,
  },
  backBtn: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  backText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  successRoot: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  successTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  successBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
});
