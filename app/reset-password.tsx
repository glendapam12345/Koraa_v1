import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react-native';

function parseTokensFromUrl(url: string | null): { access_token?: string; refresh_token?: string } | null {
  if (!url) return null;
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return null;
  const fragment = url.slice(hashIndex + 1);
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token') ?? undefined;
  const refresh_token = params.get('refresh_token') ?? undefined;
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export default function ResetPasswordScreen() {
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'invalid'>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIncomingUrl = useCallback(async (url: string | null) => {
    const tokens = parseTokensFromUrl(url);
    if (!tokens) {
      setStatus('invalid');
      return;
    }
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
    });
    if (sessionError) {
      setError(sessionError.message);
      setStatus('invalid');
      return;
    }
    setStatus('form');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await Linking.getInitialURL();
      if (cancelled) return;
      if (url && url.includes('reset-password')) {
        await handleIncomingUrl(url);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        setStatus('form');
      } else {
        setStatus('invalid');
      }
    })();
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url && url.includes('reset-password')) handleIncomingUrl(url);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [handleIncomingUrl]);

  const validatePassword = (p: string) => p.length >= 6;

  const handleSubmit = async () => {
    setError('');
    if (!password.trim()) {
      setError('Escribe tu nueva contraseña');
      return;
    }
    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setStatus('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
        <Text style={styles.loadingText}>Comprobando enlace…</Text>
      </View>
    );
  }

  if (status === 'invalid') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Sparkles size={32} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.title}>Enlace no válido</Text>
            <Text style={styles.subtitle}>
              Este enlace ha caducado o ya se usó. Pide otro desde "Olvidé mi contraseña" en la pantalla de inicio de sesión.
            </Text>
          </View>
          {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}
          <TouchableOpacity onPress={() => router.replace('/auth')} style={styles.linkButton}>
            <Text style={styles.linkText}>Ir a iniciar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Sparkles size={32} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.title}>Contraseña actualizada</Text>
            <Text style={styles.subtitle}>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </Text>
          </View>
          <GradientButton title="Iniciar sesión" onPress={() => router.replace('/auth')} />
        </ScrollView>
      </View>
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
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>
            Elige una contraseña de al menos 6 caracteres.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nueva contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={THEME.colors.text.secondary}
            secureTextEntry
            editable={!loading}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirmar contraseña</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={THEME.colors.text.secondary}
            secureTextEntry
            editable={!loading}
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GradientButton
          title="Guardar contraseña"
          onPress={handleSubmit}
          disabled={loading || !password || !confirmPassword}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
    padding: THEME.spacing.lg,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.md,
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
    textAlign: 'center',
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
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
  linkButton: {
    marginTop: THEME.spacing.md,
    alignItems: 'center',
  },
  linkText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
