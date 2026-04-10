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
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { OTPInput } from '@/components/auth/OTPInput';
import { THEME } from '@/constants/theme';
import { OTP_CODE_LENGTH, emptyOtpSlots } from '@/constants/authOtp';
import { LinearGradient } from 'expo-linear-gradient';

type Step = 'signup' | 'otp' | 'success';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUpWithEmail, verifySignupOtp, resendSignupOtp } = useAuth();

  const [step, setStep] = useState<Step>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState(() => emptyOtpSlots());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSignup = async () => {
    if (!email.trim() || !password || !confirmPassword || !fullName.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setError('');
    setIsLoading(true);

    const { error: signupError, needsConfirmation } = await signUpWithEmail(email, password, fullName);
    setIsLoading(false);

    if (needsConfirmation) {
      if (signupError) setError(signupError);
      setStep('otp');
      setResendCooldown(60);
      return;
    }

    if (signupError) {
      setError(signupError);
      return;
    }

    router.replace('/');
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== OTP_CODE_LENGTH) {
      setError(`Introduce el código completo (${OTP_CODE_LENGTH} dígitos)`);
      return;
    }

    setError('');
    setIsLoading(true);

    const { error: verifyError, success } = await verifySignupOtp(email, code);
    setIsLoading(false);

    if (verifyError) {
      setError(verifyError);
      setOtpCode(emptyOtpSlots());
      return;
    }

    if (success) setStep('success');
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsLoading(true);
    const { error: resendError, success } = await resendSignupOtp(email);
    setIsLoading(false);

    if (resendError) {
      setError(resendError);
      return;
    }

    if (success) {
      setResendCooldown(60);
      setOtpCode(emptyOtpSlots());
    }
  };

  const primaryCta = (onPress: () => void, label: string) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={[styles.ctaOuter, isLoading && styles.ctaDisabled]}
      activeOpacity={0.85}
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

  if (step === 'signup') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + THEME.spacing.md,
              paddingBottom: insets.bottom + THEME.spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para empezar con Koraa</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Tu nombre"
                placeholderTextColor={THEME.colors.text.tertiary}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
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
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={THEME.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                placeholderTextColor={THEME.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {primaryCta(handleSignup, 'Crear cuenta')}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerMuted}>¿Ya tienes cuenta? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.footerLink}>Iniciar sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === 'otp') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + THEME.spacing.md,
              paddingBottom: insets.bottom + THEME.spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Verifica tu correo</Text>
            <Text style={styles.subtitle}>
              Introduce el código enviado a{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
          </View>

          <View style={styles.otpWrap}>
            <OTPInput value={otpCode} onChange={setOtpCode} disabled={isLoading} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {primaryCta(handleVerifyOtp, 'Verificar')}

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResendOtp}
            disabled={resendCooldown > 0 || isLoading}
          >
            <Text
              style={[
                styles.resendText,
                (resendCooldown > 0 || isLoading) && styles.resendTextDisabled,
              ]}
            >
              {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('signup')} disabled={isLoading}>
            <Text style={styles.backText}>← Cambiar correo</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.successRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.successTitle}>¡Listo!</Text>
      <Text style={styles.successBody}>Tu correo quedó verificado. Ya puedes usar Koraa.</Text>
      <TouchableOpacity
        onPress={() => router.replace('/')}
        style={styles.ctaOuter}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaText}>Continuar</Text>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME.spacing.lg,
    flexWrap: 'wrap',
  },
  footerMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  footerLink: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
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
    padding: THEME.spacing.xs,
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
