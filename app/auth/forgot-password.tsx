import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { OTPInput } from '@/components/auth/OTPInput';
import { THEME } from '@/constants/theme';
import { OTP_CODE_LENGTH, emptyOtpSlots } from '@/constants/authOtp';
import { LinearGradient } from 'expo-linear-gradient';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordScreen() {
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
      setError('Introduce tu correo');
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
      setError(`Introduce el código completo (${OTP_CODE_LENGTH} dígitos)`);
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
      setError('Completa todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
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
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={[styles.ctaOuter, isLoading && styles.ctaDisabled]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={isLoading ? `${label}, cargando` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
    >
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ctaGradient}
      >
        {isLoading ? (
          <ActivityIndicator color={THEME.colors.onGradient} />
        ) : (
          <Text style={styles.ctaText}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
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
            <Text style={styles.title}>Restablecer contraseña</Text>
            <Text style={styles.subtitle}>Te enviaremos un código de verificación a tu correo</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={THEME.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                accessibilityLabel="Correo electrónico"
                accessibilityHint="Escribe el correo asociado a tu cuenta"
              />
            </View>
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            {primaryCta(handleSendCode, 'Enviar código', 'Envía un código de recuperación a tu correo')}
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio de sesión"
            accessibilityHint="Regresa a la pantalla anterior"
            accessibilityState={{ disabled: isLoading }}
          >
            <Text style={styles.backText}>← Volver al inicio de sesión</Text>
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
            <Text style={styles.title}>Verifica tu identidad</Text>
            <Text style={styles.subtitle}>
              Código enviado a{'\n'}
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
          {primaryCta(handleVerifyOtp, 'Verificar', 'Verifica el código para continuar con el cambio de contraseña')}
          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResendOtp}
            disabled={resendCooldown > 0 || isLoading}
            accessibilityRole="button"
            accessibilityLabel={resendCooldown > 0 ? `Reenviar en ${resendCooldown} segundos` : 'Reenviar código'}
            accessibilityHint="Solicita un nuevo código de recuperación"
            accessibilityState={{ disabled: resendCooldown > 0 || isLoading }}
          >
            <Text
              style={[styles.resendText, (resendCooldown > 0 || isLoading) && styles.resendTextDisabled]}
            >
              {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep('email')}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Cambiar correo"
            accessibilityHint="Vuelve atrás para escribir otro correo"
            accessibilityState={{ disabled: isLoading }}
          >
            <Text style={styles.backText}>← Cambiar correo</Text>
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
            <Text style={styles.title}>Nueva contraseña</Text>
            <Text style={styles.subtitle}>Elige una contraseña segura</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={THEME.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
                accessibilityLabel="Nueva contraseña"
                accessibilityHint="Crea una nueva contraseña de al menos 8 caracteres"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirmar</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la contraseña"
                placeholderTextColor={THEME.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
                accessibilityLabel="Confirmar contraseña"
                accessibilityHint="Repite la nueva contraseña para confirmar"
              />
            </View>
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            {primaryCta(handleUpdatePassword, 'Guardar', 'Guarda tu nueva contraseña')}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.successRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.successTitle}>Contraseña actualizada</Text>
      <Text style={styles.successBody}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
      <TouchableOpacity
        onPress={() => router.replace('/auth/login')}
        style={styles.ctaOuter}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión"
        accessibilityHint="Abre la pantalla de acceso con la nueva contraseña"
      >
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaText}>Iniciar sesión</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  ctaOuter: {
    marginTop: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    minHeight: THEME.sizes.buttonHeight,
    ...THEME.shadows.card,
  },
  ctaDisabled: {
    opacity: 0.75,
  },
  ctaGradient: {
    flex: 1,
    minHeight: THEME.sizes.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  ctaText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
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
