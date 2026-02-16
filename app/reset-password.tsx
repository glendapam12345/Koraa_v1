import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react-native';

function parseTokensFromUrl(url: string | null): { access_token?: string; refresh_token?: string; type?: string } | null {
  if (!url) return null;
  
  let access_token: string | undefined;
  let refresh_token: string | undefined;
  let type: string | undefined;
  
  try {
    // Si es una URL HTTP completa (https://...)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      // Los tokens pueden estar en el hash (#) o en query params (?)
      if (urlObj.hash) {
        const hashParams = new URLSearchParams(urlObj.hash.slice(1));
        access_token = hashParams.get('access_token') ?? undefined;
        refresh_token = hashParams.get('refresh_token') ?? undefined;
        type = hashParams.get('type') ?? undefined;
      }
      // Si no hay hash, buscar en query params
      if (!access_token && urlObj.searchParams) {
        access_token = urlObj.searchParams.get('access_token') ?? undefined;
        refresh_token = urlObj.searchParams.get('refresh_token') ?? undefined;
        type = urlObj.searchParams.get('type') ?? undefined;
      }
    }
    // Si es un deep link (myapp://reset-password#...)
    else if (url.includes('#')) {
      const hashIndex = url.indexOf('#');
      const fragment = url.slice(hashIndex + 1);
      const params = new URLSearchParams(fragment);
      access_token = params.get('access_token') ?? undefined;
      refresh_token = params.get('refresh_token') ?? undefined;
      type = params.get('type') ?? undefined;
    }
    // Si tiene query params directamente
    else if (url.includes('?')) {
      const urlObj = new URL(url, 'http://dummy.com'); // Base URL dummy para parsear
      access_token = urlObj.searchParams.get('access_token') ?? undefined;
      refresh_token = urlObj.searchParams.get('refresh_token') ?? undefined;
      type = urlObj.searchParams.get('type') ?? undefined;
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
  
  // Para reset password, necesitamos access_token y refresh_token
  if (!access_token || !refresh_token) return null;
  
  return { access_token, refresh_token, type };
}

export default function ResetPasswordScreen() {
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'invalid'>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIncomingUrl = useCallback(async (url: string | null) => {
    if (!url) {
      setStatus('invalid');
      return;
    }
    
    console.log('[ResetPassword] Processing URL:', url.substring(0, 100)); // Log parcial por seguridad
    
    const tokens = parseTokensFromUrl(url);
    if (!tokens) {
      console.log('[ResetPassword] No tokens found in URL');
      setStatus('invalid');
      return;
    }
    
    console.log('[ResetPassword] Tokens found, setting session...');
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
    });
    
    if (sessionError) {
      console.error('[ResetPassword] Session error:', sessionError.message);
      setError(sessionError.message);
      setStatus('invalid');
      return;
    }
    
    console.log('[ResetPassword] Session set successfully');
    setStatus('form');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // En web, los parámetros pueden venir en window.location
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        if (currentUrl.includes('reset-password') || currentUrl.includes('access_token')) {
          await handleIncomingUrl(currentUrl);
          return;
        }
      }
      
      // En mobile, usar Linking
      const url = await Linking.getInitialURL();
      if (cancelled) return;
      if (url && (url.includes('reset-password') || url.includes('access_token'))) {
        await handleIncomingUrl(url);
        return;
      }
      
      // Si no hay URL con tokens, verificar si hay sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        setStatus('form');
      } else {
        setStatus('invalid');
      }
    })();
    
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url && (url.includes('reset-password') || url.includes('access_token'))) {
        handleIncomingUrl(url);
      }
    });
    
    // En web, también escuchar cambios en window.location
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleHashChange = () => {
        const currentUrl = window.location.href;
        if (currentUrl.includes('reset-password') || currentUrl.includes('access_token')) {
          handleIncomingUrl(currentUrl);
        }
      };
      window.addEventListener('hashchange', handleHashChange);
      
      return () => {
        cancelled = true;
        sub.remove();
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
    
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
              Este enlace ha caducado o ya se usó. Pide otro desde &quot;Olvidé mi contraseña&quot; en la pantalla de inicio de sesión.
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
