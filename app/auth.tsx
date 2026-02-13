import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react-native';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const { signIn, signUp, resetPasswordForEmail } = useAuth();

  // Validación de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validación de contraseña
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Validación de nombre
  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  // Mensajes de error de Supabase en español y con sugerencias
  const getAuthErrorMessage = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
      return 'Email o contraseña incorrectos. Revisa que estén bien escritos o regístrate si aún no tienes cuenta.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Revisa tu correo y confirma tu cuenta antes de iniciar sesión.';
    }
    if (lower.includes('user already registered') || lower.includes('already registered')) {
      return 'Este email ya está registrado. Inicia sesión o usa "¿Olvidaste tu contraseña?" si no recuerdas la contraseña.';
    }
    if (lower.includes('password')) {
      return 'Revisa tu contraseña (mínimo 6 caracteres).';
    }
    return message;
  };

  const handleAuth = async () => {
    setError('');

    // Validaciones antes de enviar
    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (isSignUp && !validateName(fullName)) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(getAuthErrorMessage(error.message));
        } else {
          router.replace('/onboarding/welcome');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(getAuthErrorMessage(error.message));
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setError(getAuthErrorMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    if (!email.trim()) {
      setError('Ingresa tu email para enviarte el enlace de recuperación');
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await resetPasswordForEmail(email);
      if (err) {
        setError(err.message || 'No se pudo enviar el enlace. Revisa tu email.');
      } else {
        setForgotSuccess(true);
        setError('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Sparkles size={32} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.subtitle}>
              Te enviaremos un enlace a tu email para restablecer tu contraseña.
            </Text>
          </View>

          {forgotSuccess ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Revisa tu correo. Te enviamos un enlace para restablecer tu contraseña.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowForgotPassword(false);
                  setForgotSuccess(false);
                }}
                style={styles.switchButton}
              >
                <Text style={styles.switchTextBold}>Volver a iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={THEME.colors.text.secondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <GradientButton
                title="Enviar enlace de recuperación"
                onPress={handleForgotPassword}
                disabled={loading || !email.trim()}
              />
              <TouchableOpacity
                onPress={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
                style={styles.switchButton}
              >
                <Text style={styles.switchText}>
                  Volver a{' '}
                  <Text style={styles.switchTextBold}>iniciar sesión</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color={THEME.colors.gradient.blue} />
          </View>
          <Text style={styles.title}>Kora</Text>
          <Text style={styles.subtitle}>
            Organiza tu día{' '}
            <Text style={styles.accentText}>sintiendo</Text>
          </Text>
        </View>

        {isSignUp && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Tu nombre"
              placeholderTextColor={THEME.colors.text.secondary}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={THEME.colors.text.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={THEME.colors.text.secondary}
            secureTextEntry
          />
          {!isSignUp && (
            <TouchableOpacity
              onPress={() => {
                setShowForgotPassword(true);
                setError('');
              }}
              style={styles.forgotLink}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotLinkText}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <GradientButton
          title={isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          onPress={handleAuth}
          disabled={loading || !email || !password || (isSignUp && !fullName)}
        />

        <TouchableOpacity
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <Text style={styles.switchTextBold}>
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  accentText: {
    fontFamily: THEME.fonts.accent.italic,
  },
  inputContainer: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    height: THEME.sizes.inputHeight,
  },
  errorContainer: {
    backgroundColor: '#FF6B6B20',
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    ...THEME.typography.caption,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  switchButton: {
    marginTop: THEME.spacing.md,
    alignItems: 'center',
  },
  switchText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  switchTextBold: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
  },
  forgotLink: {
    marginTop: THEME.spacing.xs,
    alignSelf: 'flex-start',
  },
  forgotLinkText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  successContainer: {
    marginBottom: THEME.spacing.lg,
  },
  successText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
});
